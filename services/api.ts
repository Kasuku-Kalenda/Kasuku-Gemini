/**
 * services/api.ts — Couche de lecture publique
 * Source unique : IndexedDB (Dexie) — PLUS de constantes statiques.
 *
 * Toutes les fonctions sont asynchrones et lisent la même DB que l'admin.
 * Un événement créé en admin est donc immédiatement visible dans le front.
 */

import { db } from './db';
import type { Event, Theme, TrainingModule, FeaturedStory, TimelineNarrative } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States', GB: 'United Kingdom', DE: 'Germany', IT: 'Italy',
  CO: 'Colombia', ZA: 'South Africa', ET: 'Ethiopia', GH: 'Ghana',
  EG: 'Egypt', ML: 'Mali', SN: 'Sénégal', CD: 'RD Congo', BF: 'Burkina Faso',
  NG: 'Nigeria', KE: 'Kenya', LY: 'Libye', AO: 'Angola', MR: 'Mauritanie',
  TZ: 'Tanzanie', CM: 'Cameroun', ES: 'Espagne', FR: 'France',
  CG: 'Congo', UN: 'International', CI: "Côte d'Ivoire", MG: 'Madagascar',
  TN: 'Tunisie', MA: 'Maroc', DZ: 'Algérie', SD: 'Soudan', MZ: 'Mozambique',
};

// ─── Filtres événements ───────────────────────────────────────────────────────

interface EventFilterOptions {
  query?: string;
  theme?: string;
  country?: string;
  date?: string;   // YYYY-MM-DD
  year?: number;
}

export const getEvents = async (filters: EventFilterOptions = {}): Promise<Event[]> => {
  let events = await db.events.toArray();

  if (filters.query) {
    const q = filters.query.toLowerCase();
    events = events.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.summary.toLowerCase().includes(q)
    );
  }
  if (filters.theme) {
    events = events.filter(e => e.themes.some(t => t.slug === filters.theme));
  }
  if (filters.country) {
    events = events.filter(e => e.countryCode === filters.country);
  }
  if (filters.year) {
    const y = Number(filters.year);
    if (!isNaN(y)) events = events.filter(e => e.year === y);
  }
  if (filters.date) {
    const d = new Date(filters.date);
    const month = d.getMonth();
    const day = d.getDate();
    events = events.filter(e => {
      if (!e.dateISO) return false;
      const ed = new Date(e.dateISO);
      return ed.getMonth() === month && ed.getDate() === day;
    });
  }

  // Tri par date décroissante — événements sans date en fin de liste
  return events.sort((a, b) => {
    if (a.dateISO && b.dateISO) return b.dateISO.localeCompare(a.dateISO);
    if (a.dateISO) return -1;
    if (b.dateISO) return 1;
    return (b.year ?? 0) - (a.year ?? 0);
  });
};

// ─── Modules ──────────────────────────────────────────────────────────────────

export const getModules = async (options: {
  query?: string;
  page?: number;
  limit?: number;
  level?: string;
  lang?: string;
  maxDuration?: number;
  type?: string;
  creator?: string;
} = {}): Promise<{ items: TrainingModule[]; page: number; totalPages: number; totalItems: number }> => {
  let modules = await db.modules.toArray();

  if (options.query) {
    const q = options.query.toLowerCase();
    modules = modules.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.summary.toLowerCase().includes(q)
    );
  }
  if (options.level) modules = modules.filter(m => m.level === options.level);
  if (options.lang) modules = modules.filter(m => m.language === options.lang);
  if (options.maxDuration) modules = modules.filter(m => (m.durationMin ?? 0) <= options.maxDuration!);
  if (options.type) modules = modules.filter(m => m.moduleType === options.type);
  if (options.creator) {
    modules = modules.filter(m => m.creators.some(c => c.id === options.creator));
  }

  const page = options.page ?? 1;
  const limit = options.limit ?? 12;
  const start = (page - 1) * limit;
  const items = modules.slice(start, start + limit);

  return {
    items,
    page,
    totalPages: Math.ceil(modules.length / limit),
    totalItems: modules.length,
  };
};

export const getModuleCreators = async (): Promise<{ id: string; name: string }[]> => {
  const modules = await db.modules.toArray();
  const seen = new Set<string>();
  const creators: { id: string; name: string }[] = [];
  for (const m of modules) {
    for (const c of m.creators) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        creators.push({ id: c.id, name: c.name });
      }
    }
  }
  return creators;
};

// ─── Timelines ────────────────────────────────────────────────────────────────

export const getTimelines = async (): Promise<TimelineNarrative[]> => {
  return db.timelines.where('status').equals('published').toArray();
};

export const getTimelineBySlug = async (slug: string): Promise<TimelineNarrative | null> => {
  return (await db.timelines.where('slug').equals(slug).first()) ?? null;
};

// ─── Thèmes & Pays ───────────────────────────────────────────────────────────

export const getThemes = async (): Promise<Theme[]> => {
  return db.themes.orderBy('slug').toArray();
};

export const getCountries = async (): Promise<{ code: string; name: string }[]> => {
  const events = await db.events.toArray();
  const codes = [...new Set(events.map(e => e.countryCode).filter(Boolean) as string[])];
  return codes
    .map(code => ({ code, name: COUNTRY_NAMES[code] ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

// ─── Featured Stories ─────────────────────────────────────────────────────────

export const getFeaturedItems = async (_limit = 12): Promise<FeaturedStory[]> => {
  const [featured, events, modules, timelines] = await Promise.all([
    db.featured.toArray(),
    db.events.toArray(),
    db.modules.toArray(),
    db.timelines.toArray(),
  ]);

  const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

  const activeItems = featured
    .filter(item => {
      if (!item.active) return false;
      // Date range filtering
      if (item.startDate && today < item.startDate) return false;
      if (item.endDate && today > item.endDate) return false;
      return true;
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const result: FeaturedStory[] = [];

  for (const item of activeItems) {
    // eventId is now optional — a featured item can link only to a timeline/module
    const event = item.eventId ? events.find(e => e.id === item.eventId) : null;

    const matchedModule = modules.find(m => m.slug === item.ctaTo);
    const matchedTimeline = timelines.find(t => t.slug === item.ctaTo);
    const ctaType: FeaturedStory['ctaType'] = matchedModule
      ? 'module'
      : matchedTimeline
        ? 'timeline'
        : null;

    // Resolve image: use item imageUrl, or fall back to timeline thumbnail, or event first media
    const imageUrl =
      item.imageUrl ||
      matchedTimeline?.thumbnail ||
      event?.media?.[0]?.url ||
      undefined;

    result.push({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      imageUrl,
      eventSlug: event?.slug ?? null,
      dateISO: event?.dateISO
        ? new Date(event.dateISO + 'T12:00:00Z')
            .toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
            .replace(/\./g, '')      // fix: remove ALL dots (janv. → janv)
            .trim()
        : (event?.period ?? null),
      ctaType,
      ctaLabel: item.ctaLabel,
      ctaTo: item.ctaTo,
    });
  }

  return result;
};
