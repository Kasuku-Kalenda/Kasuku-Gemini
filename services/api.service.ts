import { db } from './db';
import type { Event, TrainingModule, TimelineNarrative, Theme } from '../types';

export const apiService = {
  // --- EVENTS ---
  async getEvents(): Promise<Event[]> {
    return db.events.orderBy('id').reverse().toArray();
  },

  async getEventById(id: string): Promise<Event | null> {
    return (await db.events.get(id)) ?? null;
  },

  async getEventBySlug(slug: string): Promise<Event | null> {
    return (await db.events.where('slug').equals(slug).first()) ?? null;
  },

  async createEvent(data: Omit<Event, 'id'>): Promise<Event> {
    const newEvent: Event = { ...data, id: crypto.randomUUID() };
    await db.events.add(newEvent);
    return newEvent;
  },

  async updateEvent(id: string, data: Partial<Event>): Promise<Event> {
    const existing = await db.events.get(id);
    if (!existing) throw new Error('Événement non trouvé');
    const updatedEvent = { ...existing, ...data };
    await db.events.put(updatedEvent);
    return updatedEvent;
  },

  async deleteEvent(id: string): Promise<void> {
    await db.events.delete(id);
  },

  // --- MODULES ---
  async getModules(): Promise<TrainingModule[]> {
    return db.modules.orderBy('updatedAt').reverse().toArray();
  },

  async getModuleById(id: string): Promise<TrainingModule | null> {
    return (await db.modules.get(id)) ?? null;
  },

  async getModuleBySlug(slug: string): Promise<TrainingModule | null> {
    return (await db.modules.where('slug').equals(slug).first()) ?? null;
  },

  async createModule(data: Omit<TrainingModule, 'id'>): Promise<TrainingModule> {
    const newModule: TrainingModule = { ...data, id: crypto.randomUUID(), updatedAt: new Date().toISOString() };
    await db.modules.add(newModule);
    return newModule;
  },

  async updateModule(id: string, data: Partial<TrainingModule>): Promise<TrainingModule> {
    const existing = await db.modules.get(id);
    if (!existing) throw new Error('Module non trouvé');
    const updatedModule = { ...existing, ...data, updatedAt: new Date().toISOString() };
    await db.modules.put(updatedModule);
    return updatedModule;
  },

  async deleteModule(id: string): Promise<void> {
    await db.modules.delete(id);
  },

  // --- TIMELINES ---
  async getTimelines(): Promise<TimelineNarrative[]> {
    return db.timelines.orderBy('id').reverse().toArray();
  },

  async getTimelineById(id: string): Promise<TimelineNarrative | null> {
    return (await db.timelines.get(id)) ?? null;
  },

  async getTimelineBySlug(slug: string): Promise<TimelineNarrative | null> {
    return (await db.timelines.where('slug').equals(slug).first()) ?? null;
  },

  async createTimeline(data: Omit<TimelineNarrative, 'id'>): Promise<TimelineNarrative> {
    const now = new Date().toISOString();
    const newTimeline: TimelineNarrative = { ...data, id: crypto.randomUUID(), eventCount: 0, createdAt: now, updatedAt: now };
    await db.timelines.add(newTimeline);
    return newTimeline;
  },

  async updateTimeline(id: string, data: Partial<TimelineNarrative>): Promise<TimelineNarrative> {
    const existing = await db.timelines.get(id);
    if (!existing) throw new Error('Timeline non trouvée');
    const updatedTimeline = { ...existing, ...data, updatedAt: new Date().toISOString() };
    await db.timelines.put(updatedTimeline);
    return updatedTimeline;
  },

  async deleteTimeline(id: string): Promise<void> {
    await db.timelines.delete(id);
  },

  // --- THEMES ---
  async getThemes(): Promise<Theme[]> {
    return db.themes.orderBy('slug').toArray();
  },

  async createTheme(data: Omit<Theme, 'id'>): Promise<Theme> {
    const newTheme: Theme = { ...data, id: crypto.randomUUID() };
    await db.themes.add(newTheme);
    return newTheme;
  },

  async deleteTheme(id: string): Promise<void> {
    await db.themes.delete(id);
  },
};
