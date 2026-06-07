/**
 * services/adminApi.ts — API d'administration (remplace Dexie/IndexedDB)
 * Toutes les opérations CRUD admin passent par l'API REST (/api/v1).
 */
import { api, uploadFile as uploadToMinio } from './apiClient';
import { mapApiEvent, serializeEventForApi } from './mappers';
import type { Event, TrainingModule, Theme, FeaturedItem, Kalenda, MoodleInstance, MoodleCourse, MoodleOfflinePackage, MoodleCourseMap, TimelineNarrative, HeritageItem, HeritageCategory, HeritageResourceType } from '../types';
import type { EventFormData, ModuleFormData, ThemeFormData, FeaturedFormData, TimelineFormData } from '../schemas/admin';
import type { MoodleInstanceFormData, MoodleCourseFormData, MoodlePackageFormData, MoodleMapFormData } from '../schemas/moodle';

interface ListResponse<T> { items: T[]; total?: number; totalItems?: number }

// ─── Timelines ─────────────────────────────────────────────────────────────────

const listTimelines  = async (): Promise<ListResponse<TimelineNarrative>> => api.get('/timelines/all');
const getTimeline    = async (id: string): Promise<TimelineNarrative | null> => { try { return await api.get<TimelineNarrative>(`/timelines/${id}`); } catch { return null; } };
const createTimeline = async (data: TimelineFormData): Promise<TimelineNarrative> => api.post('/timelines', data);
const updateTimeline = async (id: string, data: TimelineFormData): Promise<TimelineNarrative> => api.put(`/timelines/${id}`, data);
const deleteTimeline = async (id: string): Promise<boolean> => { await api.delete(`/timelines/${id}`); return true; };

// ─── Events ────────────────────────────────────────────────────────────────────

const listEvents = async (opts: { limit?: number } = {}): Promise<ListResponse<Event>> => {
  const limit = opts.limit ?? 500;
  const res = await api.get<{ items: Record<string, unknown>[]; totalItems?: number }>(`/events/all?limit=${limit}`);
  return { items: res.items.map(mapApiEvent), totalItems: res.totalItems };
};

const getEvent = async (id: string): Promise<Event | null> => {
  try {
    const raw = await api.get<Record<string, unknown>>(`/events/${id}`);
    return mapApiEvent(raw);
  } catch { return null; }
};

const createEvent = async (data: EventFormData): Promise<Event> => {
  const raw = await api.post<Record<string, unknown>>('/events', serializeEventForApi(data as Record<string, unknown>));
  return mapApiEvent(raw);
};

const updateEvent = async (id: string, data: EventFormData): Promise<Event> => {
  const raw = await api.put<Record<string, unknown>>(`/events/${id}`, serializeEventForApi(data as Record<string, unknown>));
  return mapApiEvent(raw);
};

const deleteEvent = async (id: string): Promise<boolean> => { await api.delete(`/events/${id}`); return true; };

// ─── StoryEvents d'un événement (pour clone picker) ───────────────────────────

export interface EventStoryEventItem {
  id: string;
  storyId: string;
  storyTitle: string;
  storySlug: string;
  storyType: string;
  storyStatus: string;
  position: number;
  narrativeText: string | null;
  quote: string | null;
  quoteAuthor: string | null;
  narrativeAudioUrl: string | null;
  narrativeVideoUrl: string | null;
  sourceStoryEventId: string | null;
  authorName: string | null;
  createdAt: string;
}

const getEventStoryEvents = async (eventId: string): Promise<EventStoryEventItem[]> => {
  try {
    const res = await api.get<{ items: EventStoryEventItem[] }>(`/events/${eventId}/story-events`);
    return res.items;
  } catch {
    return [];
  }
};

// ─── Themes ────────────────────────────────────────────────────────────────────

const listThemes  = async (): Promise<ListResponse<Theme>> => ({ items: await api.get<Theme[]>('/themes') });
const getTheme    = async (id: string): Promise<Theme | null> => { try { return await api.get<Theme>(`/themes/${id}`); } catch { return null; } };
const createTheme = async (data: ThemeFormData): Promise<Theme> => api.post('/themes', data);
const updateTheme = async (id: string, data: ThemeFormData): Promise<Theme> => api.put(`/themes/${id}`, data);
const deleteTheme = async (id: string): Promise<boolean> => { await api.delete(`/themes/${id}`); return true; };

// ─── Modules ───────────────────────────────────────────────────────────────────

const listModules  = async (): Promise<ListResponse<TrainingModule>> => api.get('/modules/all?limit=200');
const getModule    = async (id: string): Promise<TrainingModule | null> => { try { return await api.get<TrainingModule>(`/modules/${id}`); } catch { return null; } };
const createModule = async (data: ModuleFormData): Promise<TrainingModule> => api.post('/modules', data);
const updateModule = async (id: string, data: ModuleFormData): Promise<TrainingModule> => api.put(`/modules/${id}`, data);
const deleteModule = async (id: string): Promise<boolean> => { await api.delete(`/modules/${id}`); return true; };

// ─── People ────────────────────────────────────────────────────────────────────

export interface PersonSourceLink {
  label: string;
  url: string;
}

export type PersonResourceType = 'audio' | 'video' | 'pdf' | 'other';

export interface PersonResource {
  type: PersonResourceType;
  title: string;
  url: string;
}

export interface PersonFormData {
  name: string;
  nationality?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  birthDate?: string | null;
  deathDate?: string | null;
  sources?: PersonSourceLink[];
  resources?: PersonResource[];
}

export interface PersonItem {
  id: string;
  slug: string;
  name: string;
  nationality?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  birthDate?: string | null;
  deathDate?: string | null;
  sources?: PersonSourceLink[];
  resources?: PersonResource[];
  createdAt?: string;
  updatedAt?: string;
}

const listPeople  = async (): Promise<ListResponse<PersonItem>> => api.get('/people?limit=200');
const getPerson   = async (id: string): Promise<PersonItem | null> => { try { return await api.get<PersonItem>(`/people/${id}`); } catch { return null; } };
const createPerson = async (data: PersonFormData): Promise<PersonItem> => api.post('/people', data);
const updatePerson = async (id: string, data: PersonFormData): Promise<PersonItem> => api.put(`/people/${id}`, data);
const deletePerson = async (id: string): Promise<boolean> => { await api.delete(`/people/${id}`); return true; };

// ─── Heritage Items ────────────────────────────────────────────────────────────

export interface HeritageResourceInput {
  type: HeritageResourceType;
  url: string;
  title?: string | null;
  credit?: string | null;
}

export interface HeritageFormData {
  title: string;
  lang?: string;
  category?: HeritageCategory;
  summary?: string | null;
  period?: string | null;
  countryCode?: string | null;
  coverUrl?: string | null;
  status?: 'draft' | 'published' | 'archived';
  themeIds?: string[];
  personIds?: string[];
  eventIds?: string[];
  storyIds?: string[];
  moduleIds?: string[];
  resources?: HeritageResourceInput[];
}

const listHeritage   = async (opts: { status?: string } = {}): Promise<{ items: HeritageItem[]; totalItems?: number }> => {
  const params = opts.status ? `?status=${opts.status}` : '';
  return api.get(`/heritage/all${params}`);
};
const getHeritage    = async (id: string): Promise<HeritageItem | null> => { try { return await api.get<HeritageItem>(`/heritage/${id}`); } catch { return null; } };
const createHeritage = async (data: HeritageFormData): Promise<HeritageItem> => api.post('/heritage', data);
const updateHeritage = async (id: string, data: HeritageFormData): Promise<HeritageItem> => api.put(`/heritage/${id}`, data);
const deleteHeritage = async (id: string): Promise<boolean> => { await api.delete(`/heritage/${id}`); return true; };

// ─── Featured ──────────────────────────────────────────────────────────────────

const listFeatured   = async (): Promise<ListResponse<FeaturedItem>> => api.get('/featured/all');
const getFeatured    = async (id: string): Promise<FeaturedItem | null> => { try { return await api.get<FeaturedItem>(`/featured/${id}`); } catch { return null; } };
const createFeatured = async (data: FeaturedFormData): Promise<FeaturedItem> => api.post('/featured', data);
const updateFeatured = async (id: string, data: FeaturedFormData): Promise<FeaturedItem> => api.put(`/featured/${id}`, data);
const deleteFeatured = async (id: string): Promise<boolean> => { await api.delete(`/featured/${id}`); return true; };

// ─── Kalenda ───────────────────────────────────────────────────────────────────

const listKalendas   = async (): Promise<ListResponse<Kalenda>> => api.get('/kalendas/all');
const getKalenda     = async (id: string): Promise<Kalenda | null> => { try { return await api.get<Kalenda>(`/kalendas/${id}`); } catch { return null; } };
const createKalenda  = async (data: Omit<Kalenda, 'id' | 'createdAt' | 'updatedAt'>): Promise<Kalenda> => api.post('/kalendas', data);
const updateKalenda  = async (id: string, data: Partial<Omit<Kalenda, 'id' | 'createdAt'>>): Promise<Kalenda> => api.put(`/kalendas/${id}`, data);
const deleteKalenda  = async (id: string): Promise<boolean> => { await api.delete(`/kalendas/${id}`); return true; };
const publishKalenda = async (id: string, status: 'draft' | 'published'): Promise<Kalenda> => updateKalenda(id, { status });

// ─── Moodle Instances ──────────────────────────────────────────────────────────

const listMoodleInstances    = async () => api.get<ListResponse<MoodleInstance>>('/moodle/instances');
const getMoodleInstance      = async (id: string) => { try { return await api.get<MoodleInstance>(`/moodle/instances/${id}`); } catch { return null; } };
const createMoodleInstance   = async (data: MoodleInstanceFormData) => api.post<MoodleInstance>('/moodle/instances', data);
const updateMoodleInstance   = async (id: string, data: MoodleInstanceFormData) => api.put<MoodleInstance>(`/moodle/instances/${id}`, data);
const deleteMoodleInstance   = async (id: string) => { await api.delete(`/moodle/instances/${id}`); return true; };

// ─── Moodle Courses ────────────────────────────────────────────────────────────

const listMoodleCourses  = async () => api.get<ListResponse<MoodleCourse>>('/moodle/courses');
const getMoodleCourse    = async (id: string) => { try { return await api.get<MoodleCourse>(`/moodle/courses/${id}`); } catch { return null; } };
const createMoodleCourse = async (data: MoodleCourseFormData) => api.post<MoodleCourse>('/moodle/courses', data);
const updateMoodleCourse = async (id: string, data: MoodleCourseFormData) => api.put<MoodleCourse>(`/moodle/courses/${id}`, data);
const deleteMoodleCourse = async (id: string) => { await api.delete(`/moodle/courses/${id}`); return true; };

// ─── Moodle Packages ───────────────────────────────────────────────────────────

const listMoodlePackages  = async () => api.get<ListResponse<MoodleOfflinePackage>>('/moodle/packages');
const getMoodlePackage    = async (id: string) => { try { return await api.get<MoodleOfflinePackage>(`/moodle/packages/${id}`); } catch { return null; } };
const createMoodlePackage = async (data: MoodlePackageFormData) => api.post<MoodleOfflinePackage>('/moodle/packages', data);
const updateMoodlePackage = async (id: string, data: MoodlePackageFormData) => api.put<MoodleOfflinePackage>(`/moodle/packages/${id}`, data);
const deleteMoodlePackage = async (id: string) => { await api.delete(`/moodle/packages/${id}`); return true; };

const uploadMoodlePackage = async (courseId: string, file: File): Promise<MoodleOfflinePackage> => {
    const { url } = await uploadToMinio(file, 'misc');
    return api.post<MoodleOfflinePackage>('/moodle/packages', {
        courseId,
        type: file.name.endsWith('.h5p') ? 'H5P' : 'SCORM',
        title: file.name.replace(/\.(zip|h5p)$/i, ''),
        storagePath: url,
        sizeBytes: file.size,
        isAvailable: true,
    });
};

// ─── Moodle Maps ───────────────────────────────────────────────────────────────

const listMoodleMaps  = async () => api.get<ListResponse<MoodleCourseMap>>('/moodle/maps');
const getMoodleMap    = async (id: string) => { try { return await api.get<MoodleCourseMap>(`/moodle/maps/${id}`); } catch { return null; } };
const createMoodleMap = async (data: MoodleMapFormData) => api.post<MoodleCourseMap>('/moodle/maps', data);
const updateMoodleMap = async (id: string, data: MoodleMapFormData) => api.put<MoodleCourseMap>(`/moodle/maps/${id}`, data);
const deleteMoodleMap = async (id: string) => { await api.delete(`/moodle/maps/${id}`); return true; };

export const adminApi = {
    listHeritage, getHeritage, createHeritage, updateHeritage, deleteHeritage,
    listEvents, getEvent, createEvent, updateEvent, deleteEvent, getEventStoryEvents,
    listThemes, getTheme, createTheme, updateTheme, deleteTheme,
    listModules, getModule, createModule, updateModule, deleteModule,
    listPeople, getPerson, createPerson, updatePerson, deletePerson,
    listFeatured, getFeatured, createFeatured, updateFeatured, deleteFeatured,
    listTimelines, getTimeline, createTimeline, updateTimeline, deleteTimeline,
    listKalendas, getKalenda, createKalenda, updateKalenda, deleteKalenda, publishKalenda,
    listMoodleInstances, getMoodleInstance, createMoodleInstance, updateMoodleInstance, deleteMoodleInstance,
    listMoodleCourses, getMoodleCourse, createMoodleCourse, updateMoodleCourse, deleteMoodleCourse,
    listMoodlePackages, getMoodlePackage, createMoodlePackage, updateMoodlePackage, deleteMoodlePackage, uploadMoodlePackage,
    listMoodleMaps, getMoodleMap, createMoodleMap, updateMoodleMap, deleteMoodleMap,
};
