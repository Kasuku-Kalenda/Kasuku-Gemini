/**
 * modules/moodle/index.ts — Moodle module manifest
 *
 * The Moodle admin management pages (Instances / Courses / Packages / Maps)
 * have been removed from the nav — they added complexity without benefit
 * for the current setup.
 *
 * Moodle integration is still available in the module form (moodleMode field)
 * and offline players (SCORM / H5P) remain accessible from module pages.
 *
 * Set `enabled: false` to fully disconnect Moodle (including offline players).
 */

import type { KasukuModule } from '../_types';
export * from './service';

export const moodleModule: KasukuModule = {
  id: 'moodle',
  label: 'Moodle',
  emoji: '🔗',
  version: '1.0.0',
  enabled: true,
  // Offline players remain available via module page navigation
  userViews: ['offlineScorm', 'offlineH5p'],
  // Admin management pages removed from nav (code preserved for future use)
  adminViews: [],
  adminNavItems: [], // ← no Moodle items in admin sidebar
};
