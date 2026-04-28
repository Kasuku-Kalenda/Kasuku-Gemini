import Dexie, { type Table } from 'dexie';
import type {
  Event,
  TrainingModule,
  TimelineNarrative,
  Theme,
  FeaturedItem,
  Kalenda,
  MoodleInstance,
  MoodleCourse,
  MoodleOfflinePackage,
  MoodleCourseMap,
} from '../types';

// Source locale par défaut — tous les contenus créés manuellement en admin
const LOCAL_SOURCE = { type: 'local' as const, id: 'local_admin' };

export class KasukuDB extends Dexie {
  events!: Table<Event>;
  modules!: Table<TrainingModule>;
  timelines!: Table<TimelineNarrative>;
  themes!: Table<Theme>;
  featured!: Table<FeaturedItem>;
  kalendas!: Table<Kalenda>;
  moodleInstances!: Table<MoodleInstance>;
  moodleCourses!: Table<MoodleCourse>;
  moodlePackages!: Table<MoodleOfflinePackage>;
  moodleMaps!: Table<MoodleCourseMap>;

  constructor() {
    super('kasuku-db');

    // ── Version 1 (schéma initial) ──────────────────────────────────────────
    this.version(1).stores({
      events:         'id, slug, year, countryCode',
      modules:        'id, slug, updatedAt',
      timelines:      'id, slug, status',
      themes:         'id, slug',
      featured:       'id, order',
      moodleInstances:'id, createdAt',
      moodleCourses:  'id, instanceId, createdAt',
      moodlePackages: 'id, courseId, createdAt',
      moodleMaps:     'id, moduleId, createdAt',
    });

    // ── Version 2 : gouvernance hybride ─────────────────────────────────────
    // Ajout de la table "kalendas" (projets déployés ciblés)
    // Les contenus existants reçoivent automatiquement source = local_admin
    this.version(2).stores({
      events:         'id, slug, year, countryCode',
      modules:        'id, slug, updatedAt',
      timelines:      'id, slug, status',
      themes:         'id, slug',
      featured:       'id, order',
      kalendas:       'id, slug, status, updatedAt',
      moodleInstances:'id, createdAt',
      moodleCourses:  'id, instanceId, createdAt',
      moodlePackages: 'id, courseId, createdAt',
      moodleMaps:     'id, moduleId, createdAt',
    }).upgrade(async tx => {
      // Migrer les contenus existants sans source → source locale
      await Promise.all([
        tx.table('events').toCollection().modify(item => {
          if (!item.source) item.source = LOCAL_SOURCE;
        }),
        tx.table('modules').toCollection().modify(item => {
          if (!item.source) item.source = LOCAL_SOURCE;
        }),
        tx.table('timelines').toCollection().modify(item => {
          if (!item.source) item.source = LOCAL_SOURCE;
        }),
        tx.table('themes').toCollection().modify(item => {
          if (!item.source) item.source = LOCAL_SOURCE;
        }),
      ]);
    });
  }
}

export const db = new KasukuDB();
