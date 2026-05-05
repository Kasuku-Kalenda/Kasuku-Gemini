/**
 * services/api.ts — Couche de lecture publique
 * Source unique : IndexedDB (Dexie) — PLUS de constantes statiques.
 *
 * Toutes les fonctions sont asynchrones et lisent la même DB que l'admin.
 * Un événement créé en admin est donc immédiatement visible dans le front.
 */

import { api } from './apiClient';
import { mapApiEvent } from './mappers';
import type { Event, Theme, TrainingModule, FeaturedStory, TimelineNarrative } from '../types';

interface PaginatedResponse<T> { items: T[]; page: number; totalPages: number; totalItems: number; }

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
  date?: string;
  year?: number;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export const getEvents = async (filters: EventFilterOptions = {}): Promise<Event[]> => {
  const params = new URLSearchParams();
  if (filters.query)   params.set('q',       filters.query);
  if (filters.theme)   params.set('theme',   filters.theme);
  if (filters.country) params.set('country', filters.country);
  if (filters.date)    params.set('date',    filters.date);
  if (filters.year)    params.set('year',    String(filters.year));
  const qs = params.toString();
  const res = await api.get<PaginatedResponse<Record<string, unknown>>>(`/events${qs ? `?${qs}` : ''}`);
  return res.items.map(mapApiEvent);
};

export const getEventBySlug = async (slug: string): Promise<Event | null> => {
  try {
    const raw = await api.get<Record<string, unknown>>(`/events/slug/${slug}`);
    return mapApiEvent(raw);
  } catch { return null; }
};

// ─── Modules ──────────────────────────────────────────────────────────────────

export const getModules = async (options: {
  query?: string; page?: number; limit?: number; level?: string;
  lang?: string; maxDuration?: number; type?: string; creator?: string;
} = {}): Promise<{ items: TrainingModule[]; page: number; totalPages: number; totalItems: number }> => {
  const params = new URLSearchParams();
  if (options.query)   params.set('q',       options.query);
  if (options.level)   params.set('level',   options.level);
  if (options.lang)    params.set('lang',    options.lang);
  if (options.type)    params.set('type',    options.type);
  if (options.creator) params.set('creator', options.creator);
  if (options.page)    params.set('page',    String(options.page));
  if (options.limit)   params.set('limit',   String(options.limit));
  const qs = params.toString();
  return api.get<PaginatedResponse<TrainingModule>>(`/modules${qs ? `?${qs}` : ''}`);
};

export const getModuleCreators = async (): Promise<{ id: string; name: string }[]> => {
  const res = await api.get<PaginatedResponse<TrainingModule>>('/modules?limit=200');
  const seen = new Set<string>();
  const creators: { id: string; name: string }[] = [];
  for (const m of res.items) {
    for (const c of m.creators) {
      if (!seen.has(c.id)) { seen.add(c.id); creators.push({ id: c.id, name: c.name }); }
    }
  }
  return creators;
};

// ─── Timelines ────────────────────────────────────────────────────────────────

interface TimelinesResponse {
  items: TimelineNarrative[];
  page: number;
  totalPages: number;
  totalItems: number;
}

export const getTimelines = async (opts: { page?: number; limit?: number; q?: string } = {}): Promise<TimelineNarrative[]> => {
  const params = new URLSearchParams();
  if (opts.page)  params.set('page',  String(opts.page));
  if (opts.limit) params.set('limit', String(opts.limit));
  if (opts.q)     params.set('q',     opts.q);
  const qs = params.toString();
  const res = await api.get<TimelinesResponse>(`/timelines${qs ? `?${qs}` : ''}`);
  return res.items;
};

export const getTimelineBySlug = async (slug: string): Promise<TimelineNarrative | null> => {
  try { return await api.get<TimelineNarrative>(`/timelines/slug/${slug}`); } catch { return null; }
};

// ─── Thèmes & Pays ────────────────────────────────────────────────────────────

export const getThemes = async (): Promise<Theme[]> =>
  api.get<Theme[]>('/themes');

export const getCountries = async (): Promise<{ code: string; name: string }[]> => {
  const res = await api.get<PaginatedResponse<Event>>('/events?limit=500');
  const codes = [...new Set(res.items.map(e => e.countryCode).filter(Boolean) as string[])];
  return codes
    .map(code => ({ code, name: COUNTRY_NAMES[code] ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

// ─── Featured Stories ─────────────────────────────────────────────────────────

export const getFeaturedItems = async (_limit = 12): Promise<FeaturedStory[]> => {
  const raw = await api.get<any[]>('/featured');
  return raw.map((item: any) => ({
    id:          item.id,
    title:       item.title,
    subtitle:    item.subtitle,
    imageUrl:    item.imageUrl,
    sourceType:  item.sourceType,
    eventSlug:   item.eventSlug  ?? null,
    storySlug:   item.storySlug  ?? null,
    moduleSlug:  item.moduleSlug ?? null,
    dateISO:     null,
    ctaType:     item.sourceType === 'module'
                   ? 'module'
                   : item.sourceType === 'story'
                     ? 'timeline'
                     : null,
    ctaLabel:    item.ctaLabel,
    ctaTo:       item.ctaTo,
  }));
};
