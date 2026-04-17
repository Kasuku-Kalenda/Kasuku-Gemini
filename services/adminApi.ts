
import { EVENTS, THEMES, ALL_TRAINING_MODULES, FEATURED_ITEMS, MOODLE_INSTANCES, MOODLE_COURSES, MOODLE_PACKAGES, MOODLE_MAPS, TIMELINES } from '../constants';
import type { Event, TrainingModule, Theme, FeaturedItem, MoodleInstance, MoodleCourse, MoodleOfflinePackage, MoodleCourseMap, TimelineNarrative, TimelineMoment } from '../types';
import type { EventFormData, ModuleFormData, ThemeFormData, FeaturedFormData, TimelineFormData } from '../schemas/admin';
import type { MoodleInstanceFormData, MoodleCourseFormData, MoodlePackageFormData, MoodleMapFormData } from '../schemas/moodle';

const simulateDelay = (ms = 50) => new Promise(res => setTimeout(res, ms));

// --- Timelines API ---
const listTimelines = async () => {
    await simulateDelay();
    return { items: [...TIMELINES].sort((a, b) => (b.id > a.id ? 1 : -1)) };
};

const getTimeline = async (id: string): Promise<TimelineNarrative | null> => {
    await simulateDelay();
    return TIMELINES.find(t => t.id === id) || null;
};

const createTimeline = async (data: TimelineFormData) => {
    await simulateDelay();
    const newTimeline: TimelineNarrative = {
        id: `tl${Date.now()}`,
        ...data,
        eventCount: data.moments.length,
        moments: data.moments.map((m, i) => ({
            ...m,
            id: m.id || `mom${Math.random()}`,
            timelineId: `tl${Date.now()}`,
            position: m.position ?? i
        })) as any
    };
    TIMELINES.unshift(newTimeline);
    return newTimeline;
};

const updateTimeline = async (id: string, data: TimelineFormData) => {
    await simulateDelay();
    const idx = TIMELINES.findIndex(t => t.id === id);
    if (idx === -1) throw new Error("Timeline not found");
    const updated: TimelineNarrative = {
        ...TIMELINES[idx],
        ...data,
        eventCount: data.moments.length,
        moments: data.moments.map((m, i) => ({
            ...m,
            id: m.id || `mom${Math.random()}`,
            timelineId: id,
            position: m.position ?? i
        })) as any
    };
    TIMELINES[idx] = updated;
    return updated;
};

const deleteTimeline = async (id: string) => {
    await simulateDelay();
    const idx = TIMELINES.findIndex(t => t.id === id);
    if (idx > -1) {
        TIMELINES.splice(idx, 1);
        return true;
    }
    return false;
};

// --- Events API ---
const listEvents = async () => {
    await simulateDelay();
    const sorted = [...EVENTS].sort((a, b) => (b.id > a.id ? 1 : -1));
    return { items: sorted };
};

const getEvent = async (id: string): Promise<Event | null> => {
    await simulateDelay();
    const event = EVENTS.find(e => e.id === id);
    if (!event) return null;
    return { ...event, themeIds: event.themes.map(t => t.id) } as any;
};

const createEvent = async (data: EventFormData) => {
    await simulateDelay();
    const newEvent: Event = {
        id: `evt${Date.now()}`,
        ...data,
        countryCode: data.countryCode ?? undefined,
        dateISO: data.dateISO ?? undefined,
        year: data.year ?? undefined,
        period: data.period ?? undefined,
        themes: THEMES.filter(t => data.themeIds.includes(t.id)),
        media: data.media.map(m => ({...m, id: `med${Math.random()}`})),
        sources: data.sources.map(s => ({...s, id: `src${Math.random()}`})),
        timelineId: data.timelineId ?? undefined,
        timelineMomentId: data.timelineMomentId ?? undefined,
        timelineSlug: TIMELINES.find(t => t.id === data.timelineId)?.slug
    };
    EVENTS.unshift(newEvent);
    return newEvent;
};

const updateEvent = async (id: string, data: EventFormData) => {
    await simulateDelay();
    const eventIndex = EVENTS.findIndex(e => e.id === id);
    if (eventIndex === -1) throw new Error("Event not found");

    const updatedEvent: Event = {
        ...EVENTS[eventIndex],
        ...data,
        countryCode: data.countryCode ?? undefined,
        dateISO: data.dateISO ?? undefined,
        year: data.year ?? undefined,
        period: data.period ?? undefined,
        themes: THEMES.filter(t => data.themeIds.includes(t.id)),
        media: data.media.map(m => ({...m, id: m.id || `med${Math.random()}`})),
        sources: data.sources.map(s => ({...s, id: s.id || `src${Math.random()}`})),
        timelineId: data.timelineId ?? undefined,
        timelineMomentId: data.timelineMomentId ?? undefined,
        timelineSlug: TIMELINES.find(t => t.id === data.timelineId)?.slug
    };

    EVENTS[eventIndex] = updatedEvent;
    return updatedEvent;
};

const deleteEvent = async (id: string) => {
    await simulateDelay();
    const index = EVENTS.findIndex(e => e.id === id);
    if (index > -1) {
        EVENTS.splice(index, 1);
        return true;
    }
    return false;
};

// --- Themes API ---
const listThemes = async () => {
    await simulateDelay();
    return { items: [...THEMES].sort((a, b) => a.name.localeCompare(b.name)) };
};

const getTheme = async (id: string): Promise<Theme | null> => {
    await simulateDelay();
    return THEMES.find(t => t.id === id) || null;
};

const createTheme = async (data: ThemeFormData) => {
    await simulateDelay();
    const newTheme: Theme = { id: `theme${Date.now()}`, ...data };
    THEMES.push(newTheme);
    return newTheme;
};

const updateTheme = async (id: string, data: ThemeFormData) => {
    await simulateDelay();
    const themeIndex = THEMES.findIndex(t => t.id === id);
    if (themeIndex === -1) throw new Error("Theme not found");
    const updatedTheme = { ...THEMES[themeIndex], ...data };
    THEMES[themeIndex] = updatedTheme;
    return updatedTheme;
};

const deleteTheme = async (id: string) => {
    await simulateDelay();
    const index = THEMES.findIndex(t => t.id === id);
    if (index > -1) {
        THEMES.splice(index, 1);
        return true;
    }
    return false;
};


// --- Modules API ---
const listModules = async () => {
    await simulateDelay();
    return { items: [...ALL_TRAINING_MODULES].sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1)) };
};

const getModule = async (id: string): Promise<TrainingModule | null> => {
    await simulateDelay();
    return ALL_TRAINING_MODULES.find(m => m.id === id) || null;
};

const createModule = async (data: ModuleFormData) => {
    await simulateDelay();
    const newModule: TrainingModule = {
        id: `mod${Date.now()}`,
        ...data,
        creators: [], 
        sponsors: [],
        updatedAt: new Date().toISOString(),
        sections: (data.sections ?? []).map(s => ({
            ...s,
            id: s.id || `sec${Math.random()}`,
            lessons: s.lessons.map(l => ({...l, id: l.id || `les${Math.random()}`}))
        }))
    };
    ALL_TRAINING_MODULES.unshift(newModule);
    return newModule;
};

const updateModule = async (id: string, data: ModuleFormData) => {
    await simulateDelay();
    const moduleIndex = ALL_TRAINING_MODULES.findIndex(m => m.id === id);
    if (moduleIndex === -1) throw new Error("Module not found");

    const updatedModule: TrainingModule = {
        ...ALL_TRAINING_MODULES[moduleIndex],
        ...data,
        updatedAt: new Date().toISOString(),
        sections: data.moduleType === 'internal' ? (data.sections ?? []).map(s => ({
            ...s,
            id: s.id || `sec${Math.random()}`,
            lessons: s.lessons.map(l => ({...l, id: l.id || `les${Math.random()}`}))
        })) : [],
    };
    ALL_TRAINING_MODULES[moduleIndex] = updatedModule;
    return updatedModule;
};

const deleteModule = async (id: string) => {
    await simulateDelay();
    const index = ALL_TRAINING_MODULES.findIndex(m => m.id === id);
    if (index > -1) {
        ALL_TRAINING_MODULES.splice(index, 1);
        return true;
    }
    return false;
};

// --- Featured API ---
const listFeatured = async () => {
    await simulateDelay();
    return { items: [...FEATURED_ITEMS].sort((a, b) => a.order - b.order) };
};

const getFeatured = async (id: string): Promise<FeaturedItem | null> => {
    await simulateDelay();
    return FEATURED_ITEMS.find(f => f.id === id) || null;
};

const createFeatured = async (data: FeaturedFormData) => {
    await simulateDelay();
    const newItem: FeaturedItem = { id: `feat${Date.now()}`, ...data };
    FEATURED_ITEMS.push(newItem);
    return newItem;
};

const updateFeatured = async (id: string, data: FeaturedFormData) => {
    await simulateDelay();
    const index = FEATURED_ITEMS.findIndex(f => f.id === id);
    if (index === -1) throw new Error("Featured item not found");
    const updatedItem: FeaturedItem = { ...FEATURED_ITEMS[index], ...data };
    FEATURED_ITEMS[index] = updatedItem;
    return updatedItem;
};

const deleteFeatured = async (id: string) => {
    await simulateDelay();
    const index = FEATURED_ITEMS.findIndex(f => f.id === id);
    if (index > -1) {
        FEATURED_ITEMS.splice(index, 1);
        return true;
    }
    return false;
};

// --- Moodle APIs ---
const listMoodleInstances = async () => {
    await simulateDelay();
    return { items: [...MOODLE_INSTANCES].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1)) };
};
const getMoodleInstance = async (id: string) => {
    await simulateDelay();
    return MOODLE_INSTANCES.find(i => i.id === id) || null;
};
const createMoodleInstance = async (data: MoodleInstanceFormData) => {
    await simulateDelay();
    const newItem: MoodleInstance = { ...data, id: `minst_${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    MOODLE_INSTANCES.unshift(newItem);
    return newItem;
};
const updateMoodleInstance = async (id: string, data: MoodleInstanceFormData) => {
    await simulateDelay();
    const index = MOODLE_INSTANCES.findIndex(i => i.id === id);
    if (index === -1) throw new Error("Instance not found");
    const updatedItem = { ...MOODLE_INSTANCES[index], ...data, updatedAt: new Date().toISOString() };
    MOODLE_INSTANCES[index] = updatedItem;
    return updatedItem;
};
const deleteMoodleInstance = async (id: string) => {
    await simulateDelay();
    const index = MOODLE_INSTANCES.findIndex(i => i.id === id);
    if (index > -1) { MOODLE_INSTANCES.splice(index, 1); return true; }
    return false;
};

const listMoodleCourses = async () => {
    await simulateDelay();
    return { items: [...MOODLE_COURSES].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1)) };
};
const getMoodleCourse = async (id: string) => {
    await simulateDelay();
    return MOODLE_COURSES.find(i => i.id === id) || null;
};
const createMoodleCourse = async (data: MoodleCourseFormData) => {
    await simulateDelay();
    const newItem: MoodleCourse = { ...data, id: `mcourse_${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    MOODLE_COURSES.unshift(newItem);
    return newItem;
};
const updateMoodleCourse = async (id: string, data: MoodleCourseFormData) => {
    await simulateDelay();
    const index = MOODLE_COURSES.findIndex(i => i.id === id);
    if (index === -1) throw new Error("Course not found");
    const updatedItem = { ...MOODLE_COURSES[index], ...data, updatedAt: new Date().toISOString() };
    MOODLE_COURSES[index] = updatedItem;
    return updatedItem;
};
const deleteMoodleCourse = async (id: string) => {
    await simulateDelay();
    const index = MOODLE_COURSES.findIndex(i => i.id === id);
    if (index > -1) { MOODLE_COURSES.splice(index, 1); return true; }
    return false;
};

const listMoodlePackages = async () => {
    await simulateDelay();
    return { items: [...MOODLE_PACKAGES].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1)) };
};
const getMoodlePackage = async (id: string) => {
    await simulateDelay();
    return MOODLE_PACKAGES.find(i => i.id === id) || null;
};
const createMoodlePackage = async (data: MoodlePackageFormData) => {
    await simulateDelay();
    const newItem: MoodleOfflinePackage = { ...data, id: `mpkg_${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    MOODLE_PACKAGES.unshift(newItem);
    return newItem;
};
const updateMoodlePackage = async (id: string, data: MoodlePackageFormData) => {
    await simulateDelay();
    const index = MOODLE_PACKAGES.findIndex(i => i.id === id);
    if (index === -1) throw new Error("Package not found");
    const updatedItem = { ...MOODLE_PACKAGES[index], ...data, updatedAt: new Date().toISOString() };
    MOODLE_PACKAGES[index] = updatedItem;
    return updatedItem;
};
const deleteMoodlePackage = async (id: string) => {
    await simulateDelay();
    const index = MOODLE_PACKAGES.findIndex(i => i.id === id);
    if (index > -1) { MOODLE_PACKAGES.splice(index, 1); return true; }
    return false;
};
const uploadMoodlePackage = async (courseId: string, file: File) => {
    await simulateDelay();
    const newPackage: MoodleOfflinePackage = {
      id: `moodle_pkg_${Date.now()}`,
      courseId,
      type: file.name.endsWith('.h5p') ? 'H5P' : 'SCORM',
      title: file.name,
      storagePath: `/uploads/moodle/${file.name.replace(/\.(zip|h5p)$/i, '')}/`,
      manifestPath: `/uploads/moodle/${file.name.replace(/\.(zip|h5p)$/i, '')}/${file.name.endsWith('.h5p') ? 'h5p.json' : 'imsmanifest.xml'}`,
      isAvailable: true,
      sizeBytes: file.size,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOODLE_PACKAGES.unshift(newPackage);
    return newPackage;
};


const listMoodleMaps = async () => {
    await simulateDelay();
    return { items: [...MOODLE_MAPS].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1)) };
};
const getMoodleMap = async (id: string) => {
    await simulateDelay();
    return MOODLE_MAPS.find(i => i.id === id) || null;
};
const createMoodleMap = async (data: MoodleMapFormData) => {
    await simulateDelay();
    const newItem: MoodleCourseMap = { ...data, id: `mmap_${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    MOODLE_MAPS.unshift(newItem);
    return newItem;
};
const updateMoodleMap = async (id: string, data: MoodleMapFormData) => {
    await simulateDelay();
    const index = MOODLE_MAPS.findIndex(i => i.id === id);
    if (index === -1) throw new Error("Map not found");
    const updatedItem = { ...MOODLE_MAPS[index], ...data, updatedAt: new Date().toISOString() };
    MOODLE_MAPS[index] = updatedItem;
    return updatedItem;
};
const deleteMoodleMap = async (id: string) => {
    await simulateDelay();
    const index = MOODLE_MAPS.findIndex(i => i.id === id);
    if (index > -1) { MOODLE_MAPS.splice(index, 1); return true; }
    return false;
};

export const adminApi = {
    listEvents, getEvent, createEvent, updateEvent, deleteEvent,
    listThemes, getTheme, createTheme, updateTheme, deleteTheme,
    listModules, getModule, createModule, updateModule, deleteModule,
    listFeatured, getFeatured, createFeatured, updateFeatured, deleteFeatured,
    listTimelines, getTimeline, createTimeline, updateTimeline, deleteTimeline,
    listMoodleInstances, getMoodleInstance, createMoodleInstance, updateMoodleInstance, deleteMoodleInstance,
    listMoodleCourses, getMoodleCourse, createMoodleCourse, updateMoodleCourse, deleteMoodleCourse,
    listMoodlePackages, getMoodlePackage, createMoodlePackage, updateMoodlePackage, deleteMoodlePackage, uploadMoodlePackage,
    listMoodleMaps, getMoodleMap, createMoodleMap, updateMoodleMap, deleteMoodleMap,
};
