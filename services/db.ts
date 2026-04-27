import Dexie, { type Table } from 'dexie';
import type {
  Event,
  TrainingModule,
  TimelineNarrative,
  Theme,
  FeaturedItem,
  MoodleInstance,
  MoodleCourse,
  MoodleOfflinePackage,
  MoodleCourseMap,
} from '../types';

export class KasukuDB extends Dexie {
  events!: Table<Event>;
  modules!: Table<TrainingModule>;
  timelines!: Table<TimelineNarrative>;
  themes!: Table<Theme>;
  featured!: Table<FeaturedItem>;
  moodleInstances!: Table<MoodleInstance>;
  moodleCourses!: Table<MoodleCourse>;
  moodlePackages!: Table<MoodleOfflinePackage>;
  moodleMaps!: Table<MoodleCourseMap>;

  constructor() {
    super('kasuku-db');
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
  }
}

export const db = new KasukuDB();
