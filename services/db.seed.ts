import { db } from './db';
import {
  THEMES,
  EVENTS,
  ALL_TRAINING_MODULES,
  FEATURED_ITEMS,
  TIMELINES,
  MOODLE_INSTANCES,
  MOODLE_COURSES,
  MOODLE_PACKAGES,
  MOODLE_MAPS,
} from '../constants';

const SEED_FLAG = 'kasuku-db-seeded-v1';

/**
 * Peuple IndexedDB avec les données initiales de constants.ts.
 * S'exécute une seule fois (flag dans localStorage).
 * Pour re-seeder : supprimer le flag dans DevTools → Application → localStorage.
 */
export async function seedDatabase(): Promise<void> {
  if (localStorage.getItem(SEED_FLAG)) return;

  await db.transaction('rw', [
    db.themes,
    db.events,
    db.modules,
    db.featured,
    db.timelines,
    db.moodleInstances,
    db.moodleCourses,
    db.moodlePackages,
    db.moodleMaps,
  ], async () => {
    await db.themes.bulkPut(THEMES);
    await db.events.bulkPut(EVENTS);
    await db.modules.bulkPut(ALL_TRAINING_MODULES);
    await db.featured.bulkPut(FEATURED_ITEMS);
    await db.timelines.bulkPut(
      TIMELINES.map(t => ({
        ...t,
        createdAt: t.createdAt ?? new Date().toISOString(),
        updatedAt: t.updatedAt ?? new Date().toISOString(),
      }))
    );
    await db.moodleInstances.bulkPut(MOODLE_INSTANCES);
    await db.moodleCourses.bulkPut(MOODLE_COURSES);
    await db.moodlePackages.bulkPut(MOODLE_PACKAGES);
    await db.moodleMaps.bulkPut(MOODLE_MAPS);
  });

  localStorage.setItem(SEED_FLAG, '1');
  console.log('[Kasuku] Base de données initialisée avec les données seed.');
}
