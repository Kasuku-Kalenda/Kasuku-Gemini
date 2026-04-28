/**
 * services/adminApi.ts — API d'administration (remplace Dexie/IndexedDB)
 * Toutes les opérations CRUD admin passent par l'API REST (/api/v1).
 */
import { api, uploadFile as uploadToMinio } from './apiClient';
import type { Event, TrainingModule, Theme, FeaturedItem, Kalenda, MoodleInstance, MoodleCourse, MoodleOfflinePackage, MoodleCourseMap, TimelineNarrative } from '../types';
import type { EventFormData, ModuleFormData, ThemeFormData, FeaturedFormData, TimelineFormData } from '../schemas/admin';
import type { MoodleInstanceFormData, MoodleCourseFormData, MoodlePackageFormData, MoodleMapFormData } from '../schemas/moodle';

interface ListResponse<T> { items: T[] }

// ─── Timelines ─────────────────────────────────────────────────────────────────

const listTimelines  = async () => api.get<ListResponse<TimelineNarrative>>('/timelines/all');
const getTimeline    = async (id: string) => { try { return await api.get<TimelineNarrative>(`/timelines/${id}`); } catch { return null; } };
const createTimeline = async (data: TimelineFormData) => api.post<TimelineNarrative>('/timelines', data);
const updateTimeline = async (id: string, data: TimelineFormData) => api.put<TimelineNarrative>(`/timelines/${id}`, data);
const deleteTimeline = async (id: string) => { await api.delete(`/timelines/${id}`); return true; };

// ─── Events ────────────────────────────────────────────────────────────────────

const listEvents  = async () => api.get<ListResponse<Event>>('/events?limit=200');
const getEvent    = async (id: string) => { try { return await api.get<Event>(`/events/${id}`); } catch { return null; } };
const createEvent = async (data: EventFormData) => api.post<Event>('/events', data);
const updateEvent = async (id: string, data: EventFormData) => api.put<Event>(`/events/${id}`, data);
const deleteEvent = async (id: string) => { await api.delete(`/events/${id}`); return true; };

// ─── Themes ────────────────────────────────────────────────────────────────────

const listThemes  = async () => ({ items: await api.get<Theme[]>('/themes') });
const getTheme    = async (id: string) => { try { return await api.get<Theme>(`/themes/${id}`); } catch { return null; } };
const createTheme = async (data: ThemeFormData) => api.post<Theme>('/themes', data);
const updateTheme = async (id: string, data: ThemeFormData) => api.put<Theme>(`/themes/${id}`, data);
const deleteTheme = async (id: string) => { await api.delete(`/themes/${id}`); return true; };

// ─── Modules ───────────────────────────────────────────────────────────────────

const listModules  = async () => api.get<ListResponse<TrainingModule>>('/modules?limit=200');
const getModule    = async (id: string) => { try { return await api.get<TrainingModule>(`/modules/${id}`); } catch { return null; } };
const createModule = async (data: ModuleFormData) => api.post<TrainingModule>('/modules', data);
const updateModule = async (id: string, data: ModuleFormData) => api.put<TrainingModule>(`/modules/${id}`, data);
const deleteModule = async (id: string) => { await api.delete(`/modules/${id}`); return true; };

// ─── Featured ──────────────────────────────────────────────────────────────────

const listFeatured  = async () => api.get<ListResponse<FeaturedItem>>('/featured/all');
const getFeatured   = async (id: string) => { try { return await api.get<FeaturedItem>(`/featured/${id}`); } catch { return null; } };
const createFeatured = async (data: FeaturedFormData) => api.post<FeaturedItem>('/featured', data);
const updateFeatured = async (id: string, data: FeaturedFormData) => api.put<FeaturedItem>(`/featured/${id}`, data);
const deleteFeatured = async (id: string) => { await api.delete(`/featured/${id}`); return true; };

// ─── Kalenda ───────────────────────────────────────────────────────────────────

const listKalendas  = async () => api.get<ListResponse<Kalenda>>('/kalendas/all');
const getKalenda    = async (id: string) => { try { return await api.get<Kalenda>(`/kalendas/${id}`); } catch { return null; } };
const createKalenda = async (data: Omit<Kalenda, 'id' | 'createdAt' | 'updatedAt'>) => api.post<Kalenda>('/kalendas', data);
const updateKalenda = async (id: string, data: Partial<Omit<Kalenda, 'id' | 'createdAt'>>) => api.put<Kalenda>(`/kalendas/${id}`, data);
const deleteKalenda = async (id: string) => { await api.delete(`/kalendas/${id}`); return true; };
const publishKalenda = async (id: string, status: 'draft' | 'published') => updateKalenda(id, { status });

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
    listEvents, getEvent, createEvent, updateEvent, deleteEvent,
    listThemes, getTheme, createTheme, updateTheme, deleteTheme,
    listModules, getModule, createModule, updateModule, deleteModule,
    listFeatured, getFeatured, createFeatured, updateFeatured, deleteFeatured,
    listTimelines, getTimeline, createTimeline, updateTimeline, deleteTimeline,
    listKalendas, getKalenda, createKalenda, updateKalenda, deleteKalenda, publishKalenda,
    listMoodleInstances, getMoodleInstance, createMoodleInstance, updateMoodleInstance, deleteMoodleInstance,
    listMoodleCourses, getMoodleCourse, createMoodleCourse, updateMoodleCourse, deleteMoodleCourse,
    listMoodlePackages, getMoodlePackage, createMoodlePackage, updateMoodlePackage, deleteMoodlePackage, uploadMoodlePackage,
    listMoodleMaps, getMoodleMap, createMoodleMap, updateMoodleMap, deleteMoodleMap,
};
