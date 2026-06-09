/**
 * services/api.service.ts — CRUD centralisé (remplace Dexie/IndexedDB)
 * Chaque méthode appelle l'API REST Kasuku (/api/v1).
 */
import { api } from './apiClient';
import { mapApiEvent, mapApiModule, serializeEventForApi } from './mappers';
import type { Event, TrainingModule, TimelineNarrative, Theme, HeritageItem, HeritageCategory } from '../types';

interface PaginatedResponse<T> { items: T[]; page: number; totalPages: number; totalItems: number; }

export const apiService = {

  // ─── Events ───────────────────────────────────────────────────────────────

  async getEvents(filters: { q?: string; theme?: string; country?: string; date?: string; year?: number } = {}): Promise<Event[]> {
    const params = new URLSearchParams();
    if (filters.q)       params.set('q',       filters.q);
    if (filters.theme)   params.set('theme',   filters.theme);
    if (filters.country) params.set('country', filters.country);
    if (filters.date)    params.set('date',    filters.date);
    if (filters.year)    params.set('year',    String(filters.year));
    const qs = params.toString();
    const res = await api.get<PaginatedResponse<Record<string, unknown>>>(`/events${qs ? `?${qs}` : ''}`);
    return res.items.map(mapApiEvent);
  },

  async getEventById(id: string): Promise<Event | null> {
    try {
      const raw = await api.get<Record<string, unknown>>(`/events/${id}`);
      return mapApiEvent(raw);
    } catch { return null; }
  },

  async getEventBySlug(slug: string): Promise<Event | null> {
    try {
      const raw = await api.get<Record<string, unknown>>(`/events/slug/${slug}`);
      return mapApiEvent(raw);
    } catch { return null; }
  },

  async createEvent(data: Omit<Event, 'id'>): Promise<Event> {
    const raw = await api.post<Record<string, unknown>>('/events', serializeEventForApi(data as Record<string, unknown>));
    return mapApiEvent(raw);
  },

  async updateEvent(id: string, data: Partial<Event>): Promise<Event> {
    const raw = await api.put<Record<string, unknown>>(`/events/${id}`, serializeEventForApi(data as Record<string, unknown>));
    return mapApiEvent(raw);
  },

  async deleteEvent(id: string): Promise<void> {
    return api.delete(`/events/${id}`);
  },

  // ─── Modules ──────────────────────────────────────────────────────────────

  async getModules(options: { q?: string; level?: string; lang?: string; type?: string; creator?: string; page?: number; limit?: number } = {}): Promise<TrainingModule[]> {
    const params = new URLSearchParams();
    if (options.q)       params.set('q',       options.q);
    if (options.level)   params.set('level',   options.level);
    if (options.lang)    params.set('lang',    options.lang);
    if (options.type)    params.set('type',    options.type);
    if (options.creator) params.set('creator', options.creator);
    if (options.page)    params.set('page',    String(options.page));
    if (options.limit)   params.set('limit',   String(options.limit));
    const qs = params.toString();
    const res = await api.get<PaginatedResponse<TrainingModule>>(`/modules${qs ? `?${qs}` : ''}`);
    return res.items;
  },

  async getModuleById(id: string): Promise<TrainingModule | null> {
    try {
      const raw = await api.get<Record<string, unknown>>(`/modules/${id}`);
      return mapApiModule(raw);
    } catch { return null; }
  },

  async getModuleBySlug(slug: string): Promise<TrainingModule | null> {
    try {
      const raw = await api.get<Record<string, unknown>>(`/modules/slug/${slug}`);
      return mapApiModule(raw);
    } catch { return null; }
  },

  async createModule(data: Omit<TrainingModule, 'id'>): Promise<TrainingModule> {
    return api.post<TrainingModule>('/modules', data);
  },

  async updateModule(id: string, data: Partial<TrainingModule>): Promise<TrainingModule> {
    return api.put<TrainingModule>(`/modules/${id}`, data);
  },

  async deleteModule(id: string): Promise<void> {
    return api.delete(`/modules/${id}`);
  },

  // ─── Timelines ────────────────────────────────────────────────────────────

  async getTimelines(): Promise<TimelineNarrative[]> {
    return api.get<TimelineNarrative[]>('/timelines');
  },

  async getTimelineById(id: string): Promise<TimelineNarrative | null> {
    try { return await api.get<TimelineNarrative>(`/timelines/${id}`); } catch { return null; }
  },

  async getTimelineBySlug(slug: string): Promise<TimelineNarrative | null> {
    try { return await api.get<TimelineNarrative>(`/timelines/slug/${slug}`); } catch { return null; }
  },

  async createTimeline(data: Omit<TimelineNarrative, 'id'>): Promise<TimelineNarrative> {
    return api.post<TimelineNarrative>('/timelines', data);
  },

  async updateTimeline(id: string, data: Partial<TimelineNarrative>): Promise<TimelineNarrative> {
    return api.put<TimelineNarrative>(`/timelines/${id}`, data);
  },

  async deleteTimeline(id: string): Promise<void> {
    return api.delete(`/timelines/${id}`);
  },

  // ─── Heritage ─────────────────────────────────────────────────────────────

  async listHeritagePublic(opts: { q?: string; category?: HeritageCategory | ''; country?: string; page?: number; limit?: number } = {}): Promise<{ items: HeritageItem[]; totalItems: number; totalPages: number }> {
    const params = new URLSearchParams();
    if (opts.q)        params.set('q',        opts.q);
    if (opts.category) params.set('category', opts.category);
    if (opts.country)  params.set('country',  opts.country);
    if (opts.page)     params.set('page',     String(opts.page));
    if (opts.limit)    params.set('limit',    String(opts.limit));
    const qs = params.toString();
    return api.get<{ items: HeritageItem[]; totalItems: number; totalPages: number }>(`/heritage${qs ? `?${qs}` : ''}`);
  },

  async getHeritageBySlug(slug: string): Promise<HeritageItem | null> {
    try {
      return await api.get<HeritageItem>(`/heritage/slug/${slug}`);
    } catch {
      return null;
    }
  },

  // ─── Themes ───────────────────────────────────────────────────────────────

  async getThemes(): Promise<Theme[]> {
    return api.get<Theme[]>('/themes');
  },

  async createTheme(data: Omit<Theme, 'id'>): Promise<Theme> {
    return api.post<Theme>('/themes', data);
  },

  async updateTheme(id: string, data: Partial<Theme>): Promise<Theme> {
    return api.put<Theme>(`/themes/${id}`, data);
  },

  async deleteTheme(id: string): Promise<void> {
    return api.delete(`/themes/${id}`);
  },
};
