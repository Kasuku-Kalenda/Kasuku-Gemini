/**
 * SyncService — Kasuku Kalenda
 *
 * Architecture de synchronisation :
 *   Serveur central (online) ──► SyncService ──► IndexedDB (Dexie) ──► UI
 *
 * Fonctionnement :
 *  1. fetchCatalog()   → liste tous les "paquets" disponibles sur le serveur
 *  2. pullPackages(ids) → télécharge les paquets sélectionnés et les stocke localement
 *
 * Pour connecter un vrai serveur :
 *   Remplacer MOCK_CATALOG et simulatePull() par des appels fetch() vers l'API REST.
 *   L'interface (SyncPackage, SyncResult) reste identique — aucune modification UI.
 */

import { db } from './db';
import type { Event, TimelineNarrative, Theme, TrainingModule } from '../types';

// ─── Types publics ────────────────────────────────────────────────────────────

export type SyncPackageType = 'events' | 'timelines' | 'themes' | 'modules';

export interface SyncPackage {
  id: string;
  type: SyncPackageType;
  title: string;
  description: string;
  itemCount: number;
  sizeKb: number;
  lastUpdated: string;            // ISO date
  tags: string[];                 // ex: ['Sénégal', 'Sports', 'JOJ']
  coverUrl?: string;
}

export interface SyncProgress {
  packageId: string;
  status: 'pending' | 'downloading' | 'saving' | 'done' | 'error';
  progress: number;               // 0–100
  error?: string;
}

export interface SyncResult {
  success: string[];              // package IDs réussis
  failed: { id: string; error: string }[];
  lastSyncAt: string;
}

// ─── Config serveur ──────────────────────────────────────────────────────────

const SERVER_KEY = 'kasuku_sync_server_url';
const LAST_SYNC_KEY = 'kasuku_last_sync';

export const syncConfig = {
  getServerUrl: () => localStorage.getItem(SERVER_KEY) ?? '',
  setServerUrl: (url: string) => localStorage.setItem(SERVER_KEY, url.replace(/\/$/, '')),
  getLastSync: () => localStorage.getItem(LAST_SYNC_KEY) ?? null,
  setLastSync: (date: string) => localStorage.setItem(LAST_SYNC_KEY, date),
};

// ─── Catalogue simulé (remplacer par fetch('/api/sync/catalog')) ─────────────

const MOCK_CATALOG: SyncPackage[] = [
  {
    id: 'pkg_joj_senegal',
    type: 'events',
    title: 'JOJ — Histoire des Sports du Sénégal',
    description: 'Événements clés autour des Jeux Olympiques de la Jeunesse et du sport sénégalais.',
    itemCount: 12,
    sizeKb: 340,
    lastUpdated: '2026-04-20T10:00:00Z',
    tags: ['Sénégal', 'Sports', 'JOJ', 'Olympique'],
    coverUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400',
  },
  {
    id: 'pkg_independances_afrique',
    type: 'events',
    title: 'Indépendances africaines — 1958–1965',
    description: 'La vague des indépendances qui a traversé le continent africain.',
    itemCount: 28,
    sizeKb: 890,
    lastUpdated: '2026-04-15T08:30:00Z',
    tags: ['Afrique', 'Histoire', 'Politique', 'Indépendance'],
    coverUrl: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=400',
  },
  {
    id: 'pkg_musiques_traditionnelles',
    type: 'events',
    title: 'Musiques Traditionnelles d\'Afrique de l\'Ouest',
    description: 'Patrimoine musical : griots, kora, balafon et percussions.',
    itemCount: 18,
    sizeKb: 520,
    lastUpdated: '2026-04-10T14:00:00Z',
    tags: ['Musique', 'Patrimoine', 'Afrique de l\'Ouest'],
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400',
  },
  {
    id: 'pkg_timeline_thomas_sankara',
    type: 'timelines',
    title: 'Parcours : Thomas Sankara',
    description: 'Le récit complet de la vie et de l\'héritage du "Che africain".',
    itemCount: 15,
    sizeKb: 280,
    lastUpdated: '2026-04-18T09:00:00Z',
    tags: ['Figures', 'Politique', 'Burkina Faso'],
    coverUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
  },
  {
    id: 'pkg_timeline_panafricanisme',
    type: 'timelines',
    title: 'Parcours : Naissance du Panafricanisme',
    description: 'De Du Bois à Nkrumah — les grandes étapes d\'un mouvement fondateur.',
    itemCount: 10,
    sizeKb: 210,
    lastUpdated: '2026-04-12T11:00:00Z',
    tags: ['Histoire', 'Politique', 'Panafricanisme'],
    coverUrl: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=400',
  },
  {
    id: 'pkg_themes_base',
    type: 'themes',
    title: 'Thématiques de base',
    description: 'Catalogue complet des thématiques : Art, Histoire, Politique, Science, etc.',
    itemCount: 11,
    sizeKb: 12,
    lastUpdated: '2026-04-01T00:00:00Z',
    tags: ['Système'],
  },
  {
    id: 'pkg_module_histoire_orale',
    type: 'modules',
    title: 'Module : Introduction à l\'Histoire Orale',
    description: 'Formation sur la collecte et la préservation des témoignages oraux.',
    itemCount: 6,
    sizeKb: 1200,
    lastUpdated: '2026-04-05T10:00:00Z',
    tags: ['Formation', 'Histoire', 'Patrimoine'],
    coverUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
  },
];

// ─── Données simulées par package ────────────────────────────────────────────
// En production : remplacer par fetch(`${SERVER_URL}/api/sync/pull`, { method:'POST', body: JSON.stringify({packageIds}) })

type PackagePayload = {
  events?: Event[];
  timelines?: TimelineNarrative[];
  themes?: Theme[];
  modules?: TrainingModule[];
};

async function fetchPackageFromServer(_packageId: string): Promise<PackagePayload> {
  // TODO: Remplacer par :
  // const res = await fetch(`${syncConfig.getServerUrl()}/api/sync/pull`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ packageIds: [_packageId] })
  // });
  // return res.json();

  // Simulation : délai réseau + données fictives
  await new Promise(r => setTimeout(r, 800 + Math.random() * 600));

  // Retourne des données vides mais valides pour la démo
  // En production, le serveur retourne les vraies données
  return {};
}

// ─── Service principal ────────────────────────────────────────────────────────

export const syncService = {
  /**
   * Vérifie si l'app est connectée à internet.
   */
  isOnline(): boolean {
    return navigator.onLine;
  },

  /**
   * Récupère le catalogue des paquets disponibles sur le serveur central.
   * TODO: fetch(`${syncConfig.getServerUrl()}/api/sync/catalog`)
   */
  async fetchCatalog(): Promise<SyncPackage[]> {
    if (!this.isOnline()) {
      throw new Error('Pas de connexion internet. Connectez-vous pour accéder au catalogue.');
    }

    // Simulation du délai serveur
    await new Promise(r => setTimeout(r, 600));

    // TODO: Remplacer par :
    // const res = await fetch(`${syncConfig.getServerUrl()}/api/sync/catalog`);
    // if (!res.ok) throw new Error(`Erreur serveur: ${res.status}`);
    // return res.json();

    return MOCK_CATALOG;
  },

  /**
   * Télécharge les paquets sélectionnés et les stocke dans IndexedDB.
   * Appelle onProgress pour chaque étape (pour la barre de progression).
   */
  async pullPackages(
    packageIds: string[],
    onProgress: (progress: SyncProgress) => void
  ): Promise<SyncResult> {
    if (!this.isOnline()) {
      throw new Error('Pas de connexion internet.');
    }

    const result: SyncResult = {
      success: [],
      failed: [],
      lastSyncAt: new Date().toISOString(),
    };

    for (const id of packageIds) {
      // Étape 1 — Téléchargement
      onProgress({ packageId: id, status: 'downloading', progress: 10 });

      try {
        const payload = await fetchPackageFromServer(id);

        // Étape 2 — Sauvegarde dans IndexedDB
        onProgress({ packageId: id, status: 'saving', progress: 70 });

        // ── Règle de gouvernance : ne jamais écraser le contenu local ──────────
        // Chaque item entrant reçoit source = { type:'central', id: packageId, syncedAt }
        // Si un item existe déjà avec source.type === 'local', on le préserve.
        const now = new Date().toISOString();
        const centralSource = { type: 'central' as const, id, syncedAt: now };

        await db.transaction('rw', [db.events, db.timelines, db.themes, db.modules], async () => {
          if (payload.events?.length) {
            const incoming = payload.events.map(ev => ({ ...ev, source: centralSource }));
            const existing = await db.events.bulkGet(incoming.map(e => e.id));
            const toSave = incoming.filter((_, i) => existing[i]?.source?.type !== 'local');
            if (toSave.length) await db.events.bulkPut(toSave);
          }
          if (payload.timelines?.length) {
            const incoming = payload.timelines.map(t => ({
              ...t,
              updatedAt: t.updatedAt ?? now,
              createdAt: t.createdAt ?? now,
              source: centralSource,
            }));
            const existing = await db.timelines.bulkGet(incoming.map(t => t.id));
            const toSave = incoming.filter((_, i) => existing[i]?.source?.type !== 'local');
            if (toSave.length) await db.timelines.bulkPut(toSave);
          }
          if (payload.themes?.length) {
            const incoming = payload.themes.map(th => ({ ...th, source: centralSource }));
            const existing = await db.themes.bulkGet(incoming.map(t => t.id));
            const toSave = incoming.filter((_, i) => existing[i]?.source?.type !== 'local');
            if (toSave.length) await db.themes.bulkPut(toSave);
          }
          if (payload.modules?.length) {
            const incoming = payload.modules.map(m => ({ ...m, source: centralSource }));
            const existing = await db.modules.bulkGet(incoming.map(m => m.id));
            const toSave = incoming.filter((_, i) => existing[i]?.source?.type !== 'local');
            if (toSave.length) await db.modules.bulkPut(toSave);
          }
        });

        onProgress({ packageId: id, status: 'done', progress: 100 });
        result.success.push(id);

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
        onProgress({ packageId: id, status: 'error', progress: 0, error: errorMsg });
        result.failed.push({ id, error: errorMsg });
      }
    }

    if (result.success.length > 0) {
      syncConfig.setLastSync(result.lastSyncAt);
    }

    return result;
  },

  /**
   * Exporte les données locales (pour envoi vers le serveur central si besoin).
   * TODO: implémenter le push offline → online.
   */
  async exportLocal(): Promise<PackagePayload> {
    const [events, timelines, themes, modules] = await Promise.all([
      db.events.toArray(),
      db.timelines.toArray(),
      db.themes.toArray(),
      db.modules.toArray(),
    ]);
    return { events, timelines, themes, modules };
  },
};
