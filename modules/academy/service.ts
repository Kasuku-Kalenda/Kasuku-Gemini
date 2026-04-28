/**
 * Academy Service — single source of truth for training module DB operations.
 *
 * To replace with a REST API: swap this file's implementation.
 * The interface stays the same; components import from this service.
 */

import { adminApi } from '../../services/adminApi';
import { getModules, getModuleCreators } from '../../services/api';
import type { TrainingModule } from '../../types';
import type { ModuleFormData } from '../../schemas/admin';

// ── Public reads (user-facing) ─────────────────────────────────────────────

export { getModules, getModuleCreators };

// ── Admin reads ────────────────────────────────────────────────────────────

export const listModules = (): Promise<{ items: TrainingModule[] }> => adminApi.listModules();
export const getModule = (id: string): Promise<TrainingModule | null> => adminApi.getModule(id);

// ── Admin writes ───────────────────────────────────────────────────────────

export const createModule = (data: ModuleFormData): Promise<TrainingModule> => adminApi.createModule(data);
export const updateModule = (id: string, data: ModuleFormData): Promise<TrainingModule> => adminApi.updateModule(id, data);
export const deleteModule = (id: string): Promise<boolean> => adminApi.deleteModule(id);
