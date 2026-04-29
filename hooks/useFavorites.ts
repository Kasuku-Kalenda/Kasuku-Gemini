import { useState, useEffect, useCallback } from 'react';
import type { FavItem } from '../types';

/**
 * Versioning du schéma localStorage.
 *
 * Règle : si le schéma de FavItem change (nouveaux champs obligatoires,
 * type union étendu…), incrémenter CURRENT_VERSION ET ajouter une entrée
 * dans migrate() pour transformer les données de la version précédente.
 *
 * Historique :
 *  v1 → données brutes sans version (type: "event" | "module")
 *  v2 → ajout du type "timeline" ; migration : items sans type connu
 *        sont conservés s'ils ont type "event" ou "module", filtrés sinon.
 */
const CURRENT_VERSION = 2;
const KEY = 'kasuku_favorites';
const VERSION_KEY = 'kasuku_favorites_version';

const VALID_TYPES = new Set<FavItem['type']>(['event', 'module', 'timeline']);

function isValidItem(i: unknown): i is FavItem {
  if (!i || typeof i !== 'object') return false;
  const item = i as Record<string, unknown>;
  return (
    typeof item.type === 'string' &&
    VALID_TYPES.has(item.type as FavItem['type']) &&
    typeof item.id === 'string' &&
    typeof item.slug === 'string' &&
    typeof item.title === 'string'
  );
}

/**
 * Migre les données d'une version antérieure vers CURRENT_VERSION.
 * Chaque étape est idempotente et conservative : on ne perd aucun
 * favori valide, on supprime uniquement ce qui ne peut pas être normalisé.
 */
function migrate(raw: unknown[], fromVersion: number): FavItem[] {
  let items = raw;

  // v1 → v2 : filtrer les items dont le type n'est pas dans le nouvel ensemble
  if (fromVersion < 2) {
    items = items.filter(i => {
      if (!i || typeof i !== 'object') return false;
      const type = (i as Record<string, unknown>).type;
      return type === 'event' || type === 'module';
    });
  }

  return items.filter(isValidItem);
}

function loadFromStorage(): FavItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    // Compat avec l'ancienne clé kasuku_favorites_v1
    const rawLegacy = !raw ? localStorage.getItem('kasuku_favorites_v1') : null;
    const data = raw ?? rawLegacy;
    if (!data) return [];

    const parsed: unknown = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    const storedVersion = parseInt(localStorage.getItem(VERSION_KEY) ?? '1', 10);

    if (storedVersion < CURRENT_VERSION) {
      const migrated = migrate(parsed, storedVersion);
      // Persiste immédiatement les données migrées
      localStorage.setItem(KEY, JSON.stringify(migrated));
      localStorage.setItem(VERSION_KEY, String(CURRENT_VERSION));
      // Nettoie l'ancienne clé si elle existait
      if (rawLegacy) localStorage.removeItem('kasuku_favorites_v1');
      return migrated;
    }

    return parsed.filter(isValidItem);
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [items, setItems] = useState<FavItem[]>(() => loadFromStorage());

  // Synchronisation entre onglets (storage event)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setItems(loadFromStorage());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persist = useCallback((list: FavItem[]) => {
    setItems(list);
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
      localStorage.setItem(VERSION_KEY, String(CURRENT_VERSION));
    } catch (error) {
      console.error('useFavorites: impossible de sauvegarder', error);
    }
  }, []);

  const add = useCallback((item: FavItem) => {
    setItems(prev => {
      if (prev.some(i => i.type === item.type && i.id === item.id)) return prev;
      const next = [...prev, item];
      persist(next);
      return next;
    });
  }, [persist]);

  const remove = useCallback((type: FavItem['type'], id: string) => {
    setItems(prev => {
      const next = prev.filter(i => !(i.type === type && i.id === id));
      persist(next);
      return next;
    });
  }, [persist]);

  const exists = useCallback((type: FavItem['type'], id: string) => {
    return items.some(i => i.type === type && i.id === id);
  }, [items]);

  const toggle = useCallback((item: FavItem) => {
    if (exists(item.type, item.id)) remove(item.type, item.id);
    else add(item);
  }, [exists, remove, add]);

  return { items, toggle, exists };
}
