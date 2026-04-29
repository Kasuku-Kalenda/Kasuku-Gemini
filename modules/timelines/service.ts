/**
 * Timelines Service — single source of truth for timeline DB operations.
 *
 * To replace with a REST API: swap this file's implementation.
 * The interface stays the same; components import from this service.
 */

import { adminApi } from '../../services/adminApi';
import { getTimelines, getTimelineBySlug } from '../../services/api';
import type { TimelineNarrative } from '../../types';
import type { TimelineFormData } from '../../schemas/admin';

// ── Public reads (user-facing) ─────────────────────────────────────────────

export { getTimelines, getTimelineBySlug };

// ── Admin reads ────────────────────────────────────────────────────────────

export const listTimelines = (): Promise<{ items: TimelineNarrative[] }> => adminApi.listTimelines();
export const getTimeline = (id: string): Promise<TimelineNarrative | null> => adminApi.getTimeline(id);

// ── Admin writes ───────────────────────────────────────────────────────────

export const createTimeline = (data: TimelineFormData): Promise<TimelineNarrative> => adminApi.createTimeline(data);
export const updateTimeline = (id: string, data: TimelineFormData): Promise<TimelineNarrative> => adminApi.updateTimeline(id, data);
export const deleteTimeline = (id: string): Promise<boolean> => adminApi.deleteTimeline(id);
