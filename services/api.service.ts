import type { Event, TrainingModule, TimelineNarrative, Theme } from '../types';

const STORAGE_KEY_EVENTS = 'kasuku_events';
const STORAGE_KEY_MODULES = 'kasuku_modules';
const STORAGE_KEY_TIMELINES = 'kasuku_timelines';
const STORAGE_KEY_THEMES = 'kasuku_themes';

/**
 * Service d'API abstrait (Pattern Repository)
 * Prêt pour une transition vers une API REST réelle.
 */
export const apiService = {
  // --- EVENTS ---
  async getEvents(): Promise<Event[]> {
    const stored = localStorage.getItem(STORAGE_KEY_EVENTS);
    const events: Event[] = stored ? JSON.parse(stored) : [];
    await new Promise(resolve => setTimeout(resolve, 300));
    // TODO: Remplacer par fetch(`${API_URL}/events`)
    return events;
  },

  async getEventById(id: string): Promise<Event | null> {
    const events = await this.getEvents();
    return events.find(e => e.id === id) || null;
    // TODO: Remplacer par fetch(`${API_URL}/events/${id}`)
  },

  async getEventBySlug(slug: string): Promise<Event | null> {
    const events = await this.getEvents();
    return events.find(e => e.slug === slug) || null;
    // TODO: Remplacer par fetch(`${API_URL}/events/slug/${slug}`)
  },

  async createEvent(data: Omit<Event, 'id'>): Promise<Event> {
    const events = await this.getEvents();
    const newEvent: Event = { ...data, id: crypto.randomUUID() };
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify([...events, newEvent]));
    await new Promise(resolve => setTimeout(resolve, 500));
    // TODO: Remplacer par fetch(`${API_URL}/events`, { method: 'POST', body: JSON.stringify(data) })
    return newEvent;
  },

  async updateEvent(id: string, data: Partial<Event>): Promise<Event> {
    const events = await this.getEvents();
    const index = events.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Événement non trouvé');
    const updatedEvent = { ...events[index], ...data };
    events[index] = updatedEvent;
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
    await new Promise(resolve => setTimeout(resolve, 500));
    // TODO: Remplacer par fetch(`${API_URL}/events/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    return updatedEvent;
  },

  async deleteEvent(id: string): Promise<void> {
    const events = await this.getEvents();
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events.filter(e => e.id !== id)));
    await new Promise(resolve => setTimeout(resolve, 300));
    // TODO: Remplacer par fetch(`${API_URL}/events/${id}`, { method: 'DELETE' })
  },

  // --- MODULES ---
  async getModules(): Promise<TrainingModule[]> {
    const stored = localStorage.getItem(STORAGE_KEY_MODULES);
    const modules: TrainingModule[] = stored ? JSON.parse(stored) : [];
    await new Promise(resolve => setTimeout(resolve, 300));
    // TODO: Remplacer par fetch(`${API_URL}/modules`)
    return modules;
  },

  async getModuleById(id: string): Promise<TrainingModule | null> {
    const modules = await this.getModules();
    return modules.find(m => m.id === id) || null;
    // TODO: Remplacer par fetch(`${API_URL}/modules/${id}`)
  },

  async createModule(data: Omit<TrainingModule, 'id'>): Promise<TrainingModule> {
    const modules = await this.getModules();
    const newModule: TrainingModule = { ...data, id: crypto.randomUUID(), updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY_MODULES, JSON.stringify([...modules, newModule]));
    await new Promise(resolve => setTimeout(resolve, 500));
    // TODO: Remplacer par fetch(`${API_URL}/modules`, { method: 'POST', body: JSON.stringify(data) })
    return newModule;
  },

  async updateModule(id: string, data: Partial<TrainingModule>): Promise<TrainingModule> {
    const modules = await this.getModules();
    const index = modules.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Module non trouvé');
    const updatedModule = { ...modules[index], ...data, updatedAt: new Date().toISOString() };
    modules[index] = updatedModule;
    localStorage.setItem(STORAGE_KEY_MODULES, JSON.stringify(modules));
    await new Promise(resolve => setTimeout(resolve, 500));
    // TODO: Remplacer par fetch(`${API_URL}/modules/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    return updatedModule;
  },

  async deleteModule(id: string): Promise<void> {
    const modules = await this.getModules();
    localStorage.setItem(STORAGE_KEY_MODULES, JSON.stringify(modules.filter(m => m.id !== id)));
    await new Promise(resolve => setTimeout(resolve, 300));
    // TODO: Remplacer par fetch(`${API_URL}/modules/${id}`, { method: 'DELETE' })
  },

  // --- TIMELINES ---
  async getTimelines(): Promise<TimelineNarrative[]> {
    const stored = localStorage.getItem(STORAGE_KEY_TIMELINES);
    const timelines: TimelineNarrative[] = stored ? JSON.parse(stored) : [];
    await new Promise(resolve => setTimeout(resolve, 300));
    // TODO: Remplacer par fetch(`${API_URL}/timelines`)
    return timelines;
  },

  async getTimelineById(id: string): Promise<TimelineNarrative | null> {
    const timelines = await this.getTimelines();
    return timelines.find(t => t.id === id) || null;
    // TODO: Remplacer par fetch(`${API_URL}/timelines/${id}`)
  },

  async createTimeline(data: Omit<TimelineNarrative, 'id'>): Promise<TimelineNarrative> {
    const timelines = await this.getTimelines();
    const newTimeline: TimelineNarrative = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), eventCount: 0 };
    localStorage.setItem(STORAGE_KEY_TIMELINES, JSON.stringify([...timelines, newTimeline]));
    await new Promise(resolve => setTimeout(resolve, 500));
    // TODO: Remplacer par fetch(`${API_URL}/timelines`, { method: 'POST', body: JSON.stringify(data) })
    return newTimeline;
  },

  async updateTimeline(id: string, data: Partial<TimelineNarrative>): Promise<TimelineNarrative> {
    const timelines = await this.getTimelines();
    const index = timelines.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Timeline non trouvée');
    const updatedTimeline = { ...timelines[index], ...data, updatedAt: new Date().toISOString() };
    timelines[index] = updatedTimeline;
    localStorage.setItem(STORAGE_KEY_TIMELINES, JSON.stringify(timelines));
    await new Promise(resolve => setTimeout(resolve, 500));
    // TODO: Remplacer par fetch(`${API_URL}/timelines/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    return updatedTimeline;
  },

  async deleteTimeline(id: string): Promise<void> {
    const timelines = await this.getTimelines();
    localStorage.setItem(STORAGE_KEY_TIMELINES, JSON.stringify(timelines.filter(t => t.id !== id)));
    await new Promise(resolve => setTimeout(resolve, 300));
    // TODO: Remplacer par fetch(`${API_URL}/timelines/${id}`, { method: 'DELETE' })
  },

  // --- THEMES ---
  async getThemes(): Promise<Theme[]> {
    const stored = localStorage.getItem(STORAGE_KEY_THEMES);
    const themes: Theme[] = stored ? JSON.parse(stored) : [];
    await new Promise(resolve => setTimeout(resolve, 200));
    // TODO: Remplacer par fetch(`${API_URL}/themes`)
    return themes;
  },

  async createTheme(data: Omit<Theme, 'id'>): Promise<Theme> {
    const themes = await this.getThemes();
    const newTheme: Theme = { ...data, id: crypto.randomUUID() };
    localStorage.setItem(STORAGE_KEY_THEMES, JSON.stringify([...themes, newTheme]));
    await new Promise(resolve => setTimeout(resolve, 300));
    // TODO: Remplacer par fetch(`${API_URL}/themes`, { method: 'POST', body: JSON.stringify(data) })
    return newTheme;
  },

  async deleteTheme(id: string): Promise<void> {
    const themes = await this.getThemes();
    localStorage.setItem(STORAGE_KEY_THEMES, JSON.stringify(themes.filter(t => t.id !== id)));
    await new Promise(resolve => setTimeout(resolve, 200));
    // TODO: Remplacer par fetch(`${API_URL}/themes/${id}`, { method: 'DELETE' })
  }
};
