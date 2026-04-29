/**
 * Moodle Service — single source of truth for Moodle DB operations.
 *
 * To replace with a REST API: swap this file's implementation.
 * The interface stays the same; components import from this service.
 *
 * Set `enabled: false` in modules/moodle/index.ts to completely
 * disconnect Moodle from the app without touching any other file.
 */

import { adminApi } from '../../services/adminApi';
import type { MoodleInstance, MoodleCourse, MoodleOfflinePackage, MoodleCourseMap } from '../../types';
import type { MoodleInstanceFormData, MoodleCourseFormData, MoodlePackageFormData, MoodleMapFormData } from '../../schemas/moodle';

// ── Moodle Instances ───────────────────────────────────────────────────────

export const listMoodleInstances = (): Promise<{ items: MoodleInstance[] }> => adminApi.listMoodleInstances();
export const getMoodleInstance = (id: string): Promise<MoodleInstance | null> => adminApi.getMoodleInstance(id);
export const createMoodleInstance = (data: MoodleInstanceFormData): Promise<MoodleInstance> => adminApi.createMoodleInstance(data);
export const updateMoodleInstance = (id: string, data: MoodleInstanceFormData): Promise<MoodleInstance> => adminApi.updateMoodleInstance(id, data);
export const deleteMoodleInstance = (id: string): Promise<boolean> => adminApi.deleteMoodleInstance(id);

// ── Moodle Courses ─────────────────────────────────────────────────────────

export const listMoodleCourses = (): Promise<{ items: MoodleCourse[] }> => adminApi.listMoodleCourses();
export const getMoodleCourse = (id: string): Promise<MoodleCourse | null> => adminApi.getMoodleCourse(id);
export const createMoodleCourse = (data: MoodleCourseFormData): Promise<MoodleCourse> => adminApi.createMoodleCourse(data);
export const updateMoodleCourse = (id: string, data: MoodleCourseFormData): Promise<MoodleCourse> => adminApi.updateMoodleCourse(id, data);
export const deleteMoodleCourse = (id: string): Promise<boolean> => adminApi.deleteMoodleCourse(id);

// ── Moodle Packages ────────────────────────────────────────────────────────

export const listMoodlePackages = (): Promise<{ items: MoodleOfflinePackage[] }> => adminApi.listMoodlePackages();
export const getMoodlePackage = (id: string): Promise<MoodleOfflinePackage | null> => adminApi.getMoodlePackage(id);
export const createMoodlePackage = (data: MoodlePackageFormData): Promise<MoodleOfflinePackage> => adminApi.createMoodlePackage(data);
export const updateMoodlePackage = (id: string, data: MoodlePackageFormData): Promise<MoodleOfflinePackage> => adminApi.updateMoodlePackage(id, data);
export const deleteMoodlePackage = (id: string): Promise<boolean> => adminApi.deleteMoodlePackage(id);
export const uploadMoodlePackage = (courseId: string, file: File): Promise<MoodleOfflinePackage> => adminApi.uploadMoodlePackage(courseId, file);

// ── Moodle Maps ────────────────────────────────────────────────────────────

export const listMoodleMaps = (): Promise<{ items: MoodleCourseMap[] }> => adminApi.listMoodleMaps();
export const getMoodleMap = (id: string): Promise<MoodleCourseMap | null> => adminApi.getMoodleMap(id);
export const createMoodleMap = (data: MoodleMapFormData): Promise<MoodleCourseMap> => adminApi.createMoodleMap(data);
export const updateMoodleMap = (id: string, data: MoodleMapFormData): Promise<MoodleCourseMap> => adminApi.updateMoodleMap(id, data);
export const deleteMoodleMap = (id: string): Promise<boolean> => adminApi.deleteMoodleMap(id);
