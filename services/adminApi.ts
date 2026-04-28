import { db } from './db';
import type { Event, TrainingModule, Theme, FeaturedItem, Kalenda, MoodleInstance, MoodleCourse, MoodleOfflinePackage, MoodleCourseMap, TimelineNarrative } from '../types';
import type { EventFormData, ModuleFormData, ThemeFormData, FeaturedFormData, TimelineFormData } from '../schemas/admin';
import type { MoodleInstanceFormData, MoodleCourseFormData, MoodlePackageFormData, MoodleMapFormData } from '../schemas/moodle';

// Source locale assignée automatiquement à tout contenu créé par l'admin local
const LOCAL_SOURCE = { type: 'local' as const, id: 'local_admin' };

// --- Timelines ---

// Extrait une année d'un texte de période (ex: "Été 1944", "1943")
const extractYearFromText = (text?: string | null): number | null => {
    if (!text) return null;
    const m = text.match(/\b(\d{3,4})\b/);
    if (!m) return null;
    const y = parseInt(m[1], 10);
    return y >= 100 && y <= 2200 ? y : null;
};

// Convertit un moment en timestamp de tri (prend en compte dateExact ET periodText)
const momentSortTs = (m: { dateExact?: string | null; periodText?: string | null; position?: number | null }): number => {
    if (m.dateExact) {
        const ts = new Date(m.dateExact + 'T12:00:00Z').getTime();
        if (!isNaN(ts)) return ts;
    }
    const y = extractYearFromText(m.periodText);
    if (y) return new Date(`${y}-07-01T12:00:00Z`).getTime();
    return Infinity;
};

// Trie les moments chronologiquement : dateExact > année extraite de periodText > position manuelle
const sortMoments = (moments: TimelineNarrative['moments']): TimelineNarrative['moments'] =>
    [...moments].sort((a, b) => {
        const ta = momentSortTs(a);
        const tb = momentSortTs(b);
        if (ta !== tb) return ta - tb;
        return (a.position ?? 0) - (b.position ?? 0); // Tie-break : ordre manuel
    }).map((m, i) => ({ ...m, position: i }));

const listTimelines = async () => {
    const items = await db.timelines.orderBy('id').reverse().toArray();
    return { items };
};

const getTimeline = async (id: string): Promise<TimelineNarrative | null> => {
    return (await db.timelines.get(id)) ?? null;
};

const createTimeline = async (data: TimelineFormData): Promise<TimelineNarrative> => {
    const id = `tl${Date.now()}`;
    const now = new Date().toISOString();
    const rawMoments = data.moments.map((m, i) => ({
        ...m,
        id: m.id || `mom${crypto.randomUUID()}`,
        timelineId: id,
        position: m.position ?? i,
    })) as TimelineNarrative['moments'];
    const newTimeline: TimelineNarrative = {
        id,
        ...data,
        eventCount: rawMoments.length,
        createdAt: now,
        updatedAt: now,
        moments: sortMoments(rawMoments),
        source: LOCAL_SOURCE,
    };
    await db.timelines.add(newTimeline);
    return newTimeline;
};

const updateTimeline = async (id: string, data: TimelineFormData): Promise<TimelineNarrative> => {
    const existing = await db.timelines.get(id);
    if (!existing) throw new Error('Timeline non trouvée');
    const rawMoments = data.moments.map((m, i) => ({
        ...m,
        id: m.id || `mom${crypto.randomUUID()}`,
        timelineId: id,
        position: m.position ?? i,
    })) as TimelineNarrative['moments'];
    const updated: TimelineNarrative = {
        ...existing,
        ...data,
        id,
        eventCount: rawMoments.length,
        updatedAt: new Date().toISOString(),
        moments: sortMoments(rawMoments),
    };
    await db.timelines.put(updated);
    return updated;
};

const deleteTimeline = async (id: string): Promise<boolean> => {
    await db.timelines.delete(id);
    return true;
};

// --- Events ---
const listEvents = async () => {
    const items = await db.events.orderBy('id').reverse().toArray();
    return { items };
};

const getEvent = async (id: string): Promise<Event | null> => {
    return (await db.events.get(id)) ?? null;
};

const createEvent = async (data: EventFormData): Promise<Event> => {
    const themes = await db.themes.where('id').anyOf(data.themeIds).toArray();
    const timeline = data.timelineId ? await db.timelines.get(data.timelineId) : undefined;
    const newEvent: Event = {
        id: `evt${Date.now()}`,
        ...data,
        countryCode: data.countryCode ?? undefined,
        dateISO: data.dateISO ?? undefined,
        year: data.year ?? undefined,
        period: data.period ?? undefined,
        themes,
        media: data.media.map(m => ({ ...m, id: `med${crypto.randomUUID()}` })),
        sources: data.sources.map(s => ({ ...s, id: `src${crypto.randomUUID()}` })),
        timelineId: data.timelineId ?? undefined,
        timelineMomentId: data.timelineMomentId ?? undefined,
        timelineSlug: timeline?.slug,
        source: LOCAL_SOURCE,
    };
    await db.events.add(newEvent);
    return newEvent;
};

const updateEvent = async (id: string, data: EventFormData): Promise<Event> => {
    const existing = await db.events.get(id);
    if (!existing) throw new Error('Événement non trouvé');
    const themes = await db.themes.where('id').anyOf(data.themeIds).toArray();
    const timeline = data.timelineId ? await db.timelines.get(data.timelineId) : undefined;
    const updatedEvent: Event = {
        ...existing,
        ...data,
        id,
        countryCode: data.countryCode ?? undefined,
        dateISO: data.dateISO ?? undefined,
        year: data.year ?? undefined,
        period: data.period ?? undefined,
        themes,
        media: data.media.map(m => ({ ...m, id: m.id || `med${crypto.randomUUID()}` })),
        sources: data.sources.map(s => ({ ...s, id: s.id || `src${crypto.randomUUID()}` })),
        timelineId: data.timelineId ?? undefined,
        timelineMomentId: data.timelineMomentId ?? undefined,
        timelineSlug: timeline?.slug,
    };
    await db.events.put(updatedEvent);
    return updatedEvent;
};

const deleteEvent = async (id: string): Promise<boolean> => {
    await db.events.delete(id);
    return true;
};

// --- Themes ---
const listThemes = async () => {
    const items = await db.themes.orderBy('slug').toArray();
    return { items };
};

const getTheme = async (id: string): Promise<Theme | null> => {
    return (await db.themes.get(id)) ?? null;
};

const createTheme = async (data: ThemeFormData): Promise<Theme> => {
    const newTheme: Theme = { id: `theme${Date.now()}`, ...data, source: LOCAL_SOURCE };
    await db.themes.add(newTheme);
    return newTheme;
};

const updateTheme = async (id: string, data: ThemeFormData): Promise<Theme> => {
    const existing = await db.themes.get(id);
    if (!existing) throw new Error('Thème non trouvé');
    const updatedTheme = { ...existing, ...data };
    await db.themes.put(updatedTheme);
    return updatedTheme;
};

const deleteTheme = async (id: string): Promise<boolean> => {
    await db.themes.delete(id);
    return true;
};

// --- Modules ---
const listModules = async () => {
    const items = await db.modules.orderBy('updatedAt').reverse().toArray();
    return { items };
};

const getModule = async (id: string): Promise<TrainingModule | null> => {
    return (await db.modules.get(id)) ?? null;
};

const createModule = async (data: ModuleFormData): Promise<TrainingModule> => {
    const newModule: TrainingModule = {
        id: `mod${Date.now()}`,
        ...data,
        creators: [],
        sponsors: [],
        updatedAt: new Date().toISOString(),
        source: LOCAL_SOURCE,
        sections: (data.sections ?? []).map(s => ({
            ...s,
            id: s.id || `sec${crypto.randomUUID()}`,
            lessons: s.lessons.map(l => ({
                ...l,
                id: l.id || `les${crypto.randomUUID()}`,
                quiz: l.quiz ? { ...l.quiz, id: l.quiz.id || `qz${crypto.randomUUID()}` } : null,
            })),
            quiz: s.quiz ? { ...s.quiz, id: s.quiz.id || `qz${crypto.randomUUID()}` } : null,
        })),
    };
    await db.modules.add(newModule);
    return newModule;
};

const updateModule = async (id: string, data: ModuleFormData): Promise<TrainingModule> => {
    const existing = await db.modules.get(id);
    if (!existing) throw new Error('Module non trouvé');
    const updatedModule: TrainingModule = {
        ...existing,
        ...data,
        id,
        updatedAt: new Date().toISOString(),
        sections: data.moduleType === 'internal'
            ? (data.sections ?? []).map(s => ({
                ...s,
                id: s.id || `sec${crypto.randomUUID()}`,
                lessons: s.lessons.map(l => ({
                    ...l,
                    id: l.id || `les${crypto.randomUUID()}`,
                    quiz: l.quiz ? { ...l.quiz, id: l.quiz.id || `qz${crypto.randomUUID()}` } : null,
                })),
                quiz: s.quiz ? { ...s.quiz, id: s.quiz.id || `qz${crypto.randomUUID()}` } : null,
            }))
            : [],
    };
    await db.modules.put(updatedModule);
    return updatedModule;
};

const deleteModule = async (id: string): Promise<boolean> => {
    await db.modules.delete(id);
    return true;
};

// --- Featured ---
const listFeatured = async () => {
    const items = await db.featured.orderBy('order').toArray();
    return { items };
};

const getFeatured = async (id: string): Promise<FeaturedItem | null> => {
    return (await db.featured.get(id)) ?? null;
};

const createFeatured = async (data: FeaturedFormData): Promise<FeaturedItem> => {
    const newItem: FeaturedItem = { id: `feat${Date.now()}`, ...data };
    await db.featured.add(newItem);
    return newItem;
};

const updateFeatured = async (id: string, data: FeaturedFormData): Promise<FeaturedItem> => {
    const existing = await db.featured.get(id);
    if (!existing) throw new Error('Featured item non trouvé');
    const updatedItem = { ...existing, ...data };
    await db.featured.put(updatedItem);
    return updatedItem;
};

const deleteFeatured = async (id: string): Promise<boolean> => {
    await db.featured.delete(id);
    return true;
};

// --- Moodle Instances ---
const listMoodleInstances = async () => {
    const items = await db.moodleInstances.orderBy('createdAt').reverse().toArray();
    return { items };
};

const getMoodleInstance = async (id: string): Promise<MoodleInstance | null> => {
    return (await db.moodleInstances.get(id)) ?? null;
};

const createMoodleInstance = async (data: MoodleInstanceFormData): Promise<MoodleInstance> => {
    const now = new Date().toISOString();
    const newItem: MoodleInstance = { ...data, id: `minst_${Date.now()}`, createdAt: now, updatedAt: now };
    await db.moodleInstances.add(newItem);
    return newItem;
};

const updateMoodleInstance = async (id: string, data: MoodleInstanceFormData): Promise<MoodleInstance> => {
    const existing = await db.moodleInstances.get(id);
    if (!existing) throw new Error('Instance Moodle non trouvée');
    const updatedItem = { ...existing, ...data, updatedAt: new Date().toISOString() };
    await db.moodleInstances.put(updatedItem);
    return updatedItem;
};

const deleteMoodleInstance = async (id: string): Promise<boolean> => {
    await db.moodleInstances.delete(id);
    return true;
};

// --- Moodle Courses ---
const listMoodleCourses = async () => {
    const items = await db.moodleCourses.orderBy('createdAt').reverse().toArray();
    return { items };
};

const getMoodleCourse = async (id: string): Promise<MoodleCourse | null> => {
    return (await db.moodleCourses.get(id)) ?? null;
};

const createMoodleCourse = async (data: MoodleCourseFormData): Promise<MoodleCourse> => {
    const now = new Date().toISOString();
    const newItem: MoodleCourse = { ...data, id: `mcourse_${Date.now()}`, createdAt: now, updatedAt: now };
    await db.moodleCourses.add(newItem);
    return newItem;
};

const updateMoodleCourse = async (id: string, data: MoodleCourseFormData): Promise<MoodleCourse> => {
    const existing = await db.moodleCourses.get(id);
    if (!existing) throw new Error('Cours Moodle non trouvé');
    const updatedItem = { ...existing, ...data, updatedAt: new Date().toISOString() };
    await db.moodleCourses.put(updatedItem);
    return updatedItem;
};

const deleteMoodleCourse = async (id: string): Promise<boolean> => {
    await db.moodleCourses.delete(id);
    return true;
};

// --- Moodle Packages ---
const listMoodlePackages = async () => {
    const items = await db.moodlePackages.orderBy('createdAt').reverse().toArray();
    return { items };
};

const getMoodlePackage = async (id: string): Promise<MoodleOfflinePackage | null> => {
    return (await db.moodlePackages.get(id)) ?? null;
};

const createMoodlePackage = async (data: MoodlePackageFormData): Promise<MoodleOfflinePackage> => {
    const now = new Date().toISOString();
    const newItem: MoodleOfflinePackage = { ...data, id: `mpkg_${Date.now()}`, createdAt: now, updatedAt: now };
    await db.moodlePackages.add(newItem);
    return newItem;
};

const updateMoodlePackage = async (id: string, data: MoodlePackageFormData): Promise<MoodleOfflinePackage> => {
    const existing = await db.moodlePackages.get(id);
    if (!existing) throw new Error('Package Moodle non trouvé');
    const updatedItem = { ...existing, ...data, updatedAt: new Date().toISOString() };
    await db.moodlePackages.put(updatedItem);
    return updatedItem;
};

const deleteMoodlePackage = async (id: string): Promise<boolean> => {
    await db.moodlePackages.delete(id);
    return true;
};

const uploadMoodlePackage = async (courseId: string, file: File): Promise<MoodleOfflinePackage> => {
    const now = new Date().toISOString();
    const newPackage: MoodleOfflinePackage = {
        id: `moodle_pkg_${Date.now()}`,
        courseId,
        type: file.name.endsWith('.h5p') ? 'H5P' : 'SCORM',
        title: file.name,
        storagePath: `/uploads/moodle/${file.name.replace(/\.(zip|h5p)$/i, '')}/`,
        manifestPath: `/uploads/moodle/${file.name.replace(/\.(zip|h5p)$/i, '')}/${file.name.endsWith('.h5p') ? 'h5p.json' : 'imsmanifest.xml'}`,
        isAvailable: true,
        sizeBytes: file.size,
        createdAt: now,
        updatedAt: now,
    };
    await db.moodlePackages.add(newPackage);
    return newPackage;
};

// --- Kalenda (projets déployés ciblés) ---
const listKalendas = async () => {
    const items = await db.kalendas.orderBy('updatedAt').reverse().toArray();
    return { items };
};

const getKalenda = async (id: string): Promise<Kalenda | null> => {
    return (await db.kalendas.get(id)) ?? null;
};

const createKalenda = async (data: Omit<Kalenda, 'id' | 'createdAt' | 'updatedAt'>): Promise<Kalenda> => {
    const now = new Date().toISOString();
    const newKalenda: Kalenda = { id: `kal_${Date.now()}`, ...data, createdAt: now, updatedAt: now };
    await db.kalendas.add(newKalenda);
    return newKalenda;
};

const updateKalenda = async (id: string, data: Partial<Omit<Kalenda, 'id' | 'createdAt'>>): Promise<Kalenda> => {
    const existing = await db.kalendas.get(id);
    if (!existing) throw new Error('Kalenda non trouvé');
    const updated: Kalenda = { ...existing, ...data, id, updatedAt: new Date().toISOString() };
    await db.kalendas.put(updated);
    return updated;
};

const deleteKalenda = async (id: string): Promise<boolean> => {
    await db.kalendas.delete(id);
    return true;
};

// Publie ou dépublie un Kalenda
const publishKalenda = async (id: string, status: 'draft' | 'published'): Promise<Kalenda> => {
    return updateKalenda(id, { status });
};

// --- Moodle Maps ---
const listMoodleMaps = async () => {
    const items = await db.moodleMaps.orderBy('createdAt').reverse().toArray();
    return { items };
};

const getMoodleMap = async (id: string): Promise<MoodleCourseMap | null> => {
    return (await db.moodleMaps.get(id)) ?? null;
};

const createMoodleMap = async (data: MoodleMapFormData): Promise<MoodleCourseMap> => {
    const now = new Date().toISOString();
    const newItem: MoodleCourseMap = { ...data, id: `mmap_${Date.now()}`, createdAt: now, updatedAt: now };
    await db.moodleMaps.add(newItem);
    return newItem;
};

const updateMoodleMap = async (id: string, data: MoodleMapFormData): Promise<MoodleCourseMap> => {
    const existing = await db.moodleMaps.get(id);
    if (!existing) throw new Error('Mapping Moodle non trouvé');
    const updatedItem = { ...existing, ...data, updatedAt: new Date().toISOString() };
    await db.moodleMaps.put(updatedItem);
    return updatedItem;
};

const deleteMoodleMap = async (id: string): Promise<boolean> => {
    await db.moodleMaps.delete(id);
    return true;
};

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
