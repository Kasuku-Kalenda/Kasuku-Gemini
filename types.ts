
export interface Media {
  id?: string;
  type: "image" | "video";
  url: string;
  caption?: string;
  credit?: string;
}

export interface Source {
  id?: string;
  label: string;
  url: string;
}

export interface Theme {
  id: string;
  name: string;
  slug: string;
}

export interface Creator {
  id: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  links?: string[];
}

export interface Sponsor {
  id: string;
  name: string;
  logoUrl?: string;
  linkUrl?: string;
}

export interface Lesson {
  id: string;
  title: string;
  type: "video" | "audio" | "pdf" | "quiz";
  durationMin?: number;
  url?: string;
  transcript?: string;
  order: number;
}

export interface Section {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface TrainingModule {
  id: string;
  title: string;
  slug: string;
  summary: string;
  durationMin?: number | null;
  level?: "Débutant" | "Intermédiaire" | "Avancé" | "Beginner" | "Intermediate" | "Advanced" | null;
  objectives: string[];
  language?: string;
  thumbnail?: string;
  creators: Creator[];
  sponsors: Sponsor[];
  sections?: Section[];
  updatedAt: string;
  eventIds: string[];
  tags?: string[];
  moduleType?: 'internal' | 'moodle';
  moodleCourseUrl?: string;
}

// MODÈLE CALENDRIER CORRIGÉ
export interface Event {
  id: string;
  title: string;
  slug: string;
  summary: string;
  dateISO?: string; // "YYYY-MM-DD"
  year?: number;
  period?: string;
  countryCode?: string;
  themes: Theme[];
  media: Media[];
  sources: Source[];
  trainingModules?: TrainingModule[];
  // Liens vers le parcours
  timelineId?: string;
  timelineMomentId?: string;
  timelineSlug?: string; // Pour compatibilité navigation actuelle
}

// MODÈLE NARRATIF COMPLET
export type TimelineType = 'personnage' | 'evenement';
export type TimelineStatus = 'draft' | 'published';
export type TimeType = 'date' | 'period';

export interface TimelineMoment {
  id: string;
  timelineId: string;
  title: string;
  narrative: string;
  timeType: TimeType;
  dateExact?: string;
  periodText?: string;
  position: number;
  media: Media[];
}

export interface TimelineNarrative {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  type: TimelineType;
  shortDescription: string;
  longDescription?: string;
  thumbnail: string; // cover_image_url
  periodLabel: string;
  status: TimelineStatus;
  eventCount: number;
  moments?: TimelineMoment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface FavItem {
  type: "event" | "module";
  id: string;
  slug: string;
  title: string;
  thumbnail?: string;
}

export type AuthRole = "SUPERADMIN" | "EDITOR" | "VIEWER";

export interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: AuthRole;
  passwordHash?: string;
}

export interface FeaturedItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  eventId: string;
  active: boolean;
  startDate: string;
  endDate: string;
  order: number;
  ctaLabel: string;
  ctaTo: string;
}

export interface FeaturedStory {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  eventSlug: string;
  dateISO?: string | null;
  moduleSlug?: string | null;
  ctaLabel: string;
  ctaTo: string;
}

// Moodle Integration
export interface MoodleInstance {
  id: string;
  name: string;
  baseUrl: string;
  ltiIssuer?: string | null;
  ltiClientId?: string | null;
  ltiAuthUrl?: string | null;
  ltiTokenUrl?: string | null;
  ltiKeySetUrl?: string | null;
  ltiDeploymentId?: string | null;
  apiToken?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MoodleCourse {
  id: string;
  instanceId: string;
  remoteCourseId: number;
  shortname: string;
  fullname: string;
  summary?: string | null;
  language?: string | null;
  createdAt: string;
  updatedAt: string;
  Instance?: MoodleInstance;
}

export type MoodlePackageType = "SCORM" | "H5P" | "IMSCC";

export interface MoodleOfflinePackage {
  id: string;
  courseId: string;
  type: MoodlePackageType;
  title: string;
  version?: string | null;
  storagePath: string;
  manifestPath?: string | null;
  sizeBytes?: number | null;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  Course?: MoodleCourse;
}

export type MoodleMapMode = "LTI" | "REST" | "OFFLINE";

export interface MoodleCourseMap {
  id: string;
  moduleId: string;
  courseId?: string | null;
  packageId?: string | null;
  mode: MoodleMapMode;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}
