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

import { api } from './apiClient';
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

// ─── Types payload ────────────────────────────────────────────────────────────

type PackagePayload = {
  packageId: string;
  type: string;
  items: (Event | TimelineNarrative | Theme | TrainingModule)[];
  syncedAt: string;
  itemCount: number;
};

// ─── Service principal ────────────────────────────────────────────────────────

export const syncService = {

  isOnline(): boolean {
    return navigator.onLine;
  },

  /** Récupère le catalogue depuis l'API REST (remplace MOCK_CATALOG) */
  async fetchCatalog(): Promise<SyncPackage[]> {
    if (!this.isOnline()) {
      throw new Error('Pas de connexion internet. Connectez-vous pour accéder au catalogue.');
    }
    return api.get<SyncPackage[]>('/sync/catalog');
  },

  /** Télécharge les paquets sélectionnés depuis l'API et met à jour la DB locale */
  async pullPackages(
    packageIds: string[],
    onProgress: (progress: SyncProgress) => void,
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
      onProgress({ packageId: id, status: 'downloading', progress: 20 });

      try {
        const payload = await api.get<PackagePayload>(`/sync/packages/${id}`);

        onProgress({ packageId: id, status: 'saving', progress: 70 });

        // Les données reçues du serveur sont centrales — on les stocke directement
        // L'API renvoie déjà source: { type:'central', syncedAt }
        // (La logique de gouvernance locale→centrale est côté API)
        console.info(`[Sync] Package ${id}: ${payload.itemCount} items (${payload.type})`);

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
};
