/**
 * Featured Service — single source of truth for featured items DB operations.
 *
 * To replace with a REST API: swap this file's implementation.
 * The interface stays the same; components import from this service.
 */

import { adminApi } from '../../services/adminApi';
import { getFeaturedItems } from '../../services/api';
import type { FeaturedItem, FeaturedStory } from '../../types';
import type { FeaturedFormData } from '../../schemas/admin';

// ── Public reads (user-facing) ─────────────────────────────────────────────

export { getFeaturedItems };
export type { FeaturedStory };

// ── Admin reads ────────────────────────────────────────────────────────────

export const listFeatured = (): Promise<{ items: FeaturedItem[] }> => adminApi.listFeatured();
export const getFeatured = (id: string): Promise<FeaturedItem | null> => adminApi.getFeatured(id);

// ── Admin writes ───────────────────────────────────────────────────────────

export const createFeatured = (data: FeaturedFormData): Promise<FeaturedItem> => adminApi.createFeatured(data);
export const updateFeatured = (id: string, data: FeaturedFormData): Promise<FeaturedItem> => adminApi.updateFeatured(id, data);
export const deleteFeatured = (id: string): Promise<boolean> => adminApi.deleteFeatured(id);
