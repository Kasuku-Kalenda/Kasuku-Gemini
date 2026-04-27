/**
 * modules/moodle/index.ts — Moodle module manifest
 *
 * Set `enabled: false` to completely disconnect Moodle from the app
 * without touching any other file.
 */

import type { KasukuModule } from '../_types';
export * from './service';

export const moodleModule: KasukuModule = {
  id: 'moodle',
  label: 'Moodle',
  emoji: '🔗',
  version: '1.0.0',
  enabled: true, // ← set false to disconnect Moodle entirely
  userViews: ['offlineScorm', 'offlineH5p'],
  adminViews: [
    'adminMoodleInstances', 'adminNewMoodleInstance', 'adminEditMoodleInstance',
    'adminMoodleCourses', 'adminNewMoodleCourse', 'adminEditMoodleCourse',
    'adminMoodlePackages', 'adminNewMoodlePackage', 'adminEditMoodlePackage', 'adminMoodlePackageUpload',
    'adminMoodleMaps', 'adminNewMoodleMap', 'adminEditMoodleMap',
  ],
  adminNavItems: [
    { view: 'adminMoodleInstances', label: 'Moodle Instances', emoji: '🔗' },
    { view: 'adminMoodleCourses', label: 'Moodle Courses', emoji: '📚' },
    { view: 'adminMoodlePackages', label: 'Moodle Packages', emoji: '📦' },
    { view: 'adminMoodleMaps', label: 'Moodle Maps', emoji: '🔀' },
  ],
};
