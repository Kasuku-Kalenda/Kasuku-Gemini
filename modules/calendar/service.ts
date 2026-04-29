/**
 * Calendar Service — single source of truth for event + theme DB operations.
 *
 * To replace with a REST API: swap this file's implementation.
 * The interface stays the same; components import from this service.
 */

import { adminApi } from '../../services/adminApi';
import { getEvents, getThemes, getCountries } from '../../services/api';
import type { Event, Theme } from '../../types';
import type { EventFormData, ThemeFormData } from '../../schemas/admin';

// ── Public reads (user-facing) ─────────────────────────────────────────────

export { getEvents, getThemes, getCountries };

// ── Admin reads ────────────────────────────────────────────────────────────

export const listEvents = (): Promise<{ items: Event[] }> => adminApi.listEvents();
export const getEvent = (id: string): Promise<Event | null> => adminApi.getEvent(id);

export const listThemes = (): Promise<{ items: Theme[] }> => adminApi.listThemes();
export const getTheme = (id: string): Promise<Theme | null> => adminApi.getTheme(id);

// ── Admin writes ───────────────────────────────────────────────────────────

export const createEvent = (data: EventFormData): Promise<Event> => adminApi.createEvent(data);
export const updateEvent = (id: string, data: EventFormData): Promise<Event> => adminApi.updateEvent(id, data);
export const deleteEvent = (id: string): Promise<boolean> => adminApi.deleteEvent(id);

export const createTheme = (data: ThemeFormData): Promise<Theme> => adminApi.createTheme(data);
export const updateTheme = (id: string, data: ThemeFormData): Promise<Theme> => adminApi.updateTheme(id, data);
export const deleteTheme = (id: string): Promise<boolean> => adminApi.deleteTheme(id);
