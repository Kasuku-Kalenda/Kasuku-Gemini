
// ─── Gouvernance : provenance du contenu ─────────────────────────────────────

export type ContentSourceType = 'central' | 'local' | 'imported_csv';

export interface ContentSource {
  type: ContentSourceType;
  /** Identifiant de l'origine : 'kasuku_core', 'local_admin', 'kalenda_bujumbura_01', 'import_2026_04'… */
  id: string;
  syncedAt?: string;   // ISO date (si vient d'une sync centrale)
  version?: string;    // version du paquet source
}

// ─── Kalenda : version déployée ciblée ───────────────────────────────────────

export type KalendasStatus = 'draft' | 'published';

export interface Kalenda {
  id: string;
  name: string;             // "Kalenda Éducation Sénégal"
  slug: string;
  description: string;
  region?: string;          // "Sénégal", "RDC", "Burundi"…
  themeLabel?: string;      // "Éducation", "Culture", "Formation"…
  coverUrl?: string;
  // Compteurs (liste /all) — arrays (détail /:id)
  eventCount?: number;
  storyCount?: number;
  moduleCount?: number;
  themeCount?: number;
  eventIds?: string[];
  storyIds?: string[];
  moduleIds?: string[];
  themeIds?: string[];
  // Méta
  version: string;          // "1.0.0"
  status: KalendasStatus;
  notes?: string;           // notes de version
  createdAt: string;
  updatedAt: string;
}

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
  color?: string;   // hex ex: "#E57C3C"
  emoji?: string;   // ex: "🎵"
  source?: ContentSource;
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

// ─── Quiz ────────────────────────────────────────────────────────────────────
export type QuizQuestionType = 'multiple_choice' | 'true_false';

export interface QuizQuestion {
  id?: string;
  question: string;
  type: QuizQuestionType;
  options?: string[];        // for multiple_choice (2-4 options)
  correctIndex?: number;     // 0-based index for multiple_choice
  correctBool?: boolean;     // for true_false
  explanation?: string;      // shown after answering
}

export interface Quiz {
  id?: string;
  title?: string;
  passingScore: number;      // 0-100 percentage required to pass
  questions: QuizQuestion[];
}

// ─── Course resources ────────────────────────────────────────────────────────
export type ResourceType = 'audio' | 'video' | 'image' | 'pdf' | 'link' | 'event' | 'timeline';

export interface CourseResource {
  id?: string;
  type: ResourceType;
  title: string;
  url?: string;              // for audio/video/image/pdf/link
  eventId?: string;          // for event resources
  timelineSlug?: string;     // for timeline resources
  description?: string;
}

// ─── Lessons & Sections ──────────────────────────────────────────────────────
export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'audio' | 'pdf' | 'text' | 'quiz';
  durationMin?: number | null;
  url?: string | null;
  content?: string | null;   // rich text / markdown for 'text' type lessons
  transcript?: string | null;
  order: number;
  quiz?: Quiz | null;        // optional competency check after this lesson
}

export interface Section {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  lessons: Lesson[];
  quiz?: Quiz | null;        // optional section-level quiz
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
  // Associations
  timelineSlug?: string | null;
  // Moodle integration metadata
  moodleInstanceId?: string | null;
  moodleCourseId?: string | null;
  moodleMode?: 'lti' | 'offline' | 'url' | null;
  moodlePackageId?: string | null;
  // LMS features (internal modules)
  resources?: CourseResource[];
  finalQuiz?: Quiz | null;
  hasCertificate?: boolean;
  certificateName?: string | null;
  source?: ContentSource;
}

// ─── Champs natifs PostgreSQL (retournés par l'API après transform camelCase) ─
// Valeurs alignées sur les enums PostgreSQL temporal_type et reliability_type
export type TemporalType   = 'exact_date' | 'date_range' | 'approximate' | 'unknown';
export type ReliabilityType = 'confirmed' | 'probable' | 'contested' | 'unknown';
export type ContentStatus = 'draft' | 'published' | 'archived';

// MODÈLE CALENDRIER
export interface Event {
  id: string;
  title: string;
  slug: string;
  summary: string;
  lang?: string;

  // ── Champs natifs API (PostgreSQL) ────────────────────────────────────────
  startDate?: string;                  // ISO string "YYYY-MM-DDT..."
  endDate?: string;
  displayDate?: string;                // Affichage libre ex: "XVe siècle"
  temporalType?: TemporalType;
  approxCentury?: number | null;
  approxDecade?: number | null;
  annualRecurrence?: boolean;
  primaryCountryCode?: string;         // code ISO 2 lettres
  primaryPlaceName?: string;
  thumbnailUrl?: string;               // image de couverture (MinIO)
  sourceLabel?: string;
  sourceUrl?: string;
  reliability?: ReliabilityType;
  contributors?: string[];  // tableau de noms (ex: ["Jean Dupont", "Marie Curie"])
  featured?: boolean;
  status?: ContentStatus;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;

  // ── Aliases legacy (compatibilité composants existants) ───────────────────
  dateISO?: string;                    // = startDate.substring(0, 10)
  year?: number;                       // = parseInt(startDate, 10)
  period?: string;                     // = displayDate
  countryCode?: string;                // = primaryCountryCode

  // ── Relations (normalisées par le mapper) ─────────────────────────────────
  themes: Theme[];
  people?: Array<{ id: string; slug?: string; name: string; photoUrl?: string | null; role?: string | null }>;
  heritageItems?: Array<{ id: string; slug: string; title: string; category?: string; coverUrl?: string | null; summary?: string | null; countryCode?: string | null }>;
  media: Media[];                      // construit depuis thumbnailUrl
  sources: Source[];                   // construit depuis sourceLabel/sourceUrl
  trainingModules?: TrainingModule[];  // construit depuis modules[]

  // ── Liens vers parcours (résolu sur /events/slug/:slug) ───────────────────
  timelineId?: string | null;          // legacy — conservé pour compatibilité
  timelineMomentId?: string | null;    // legacy — conservé pour compatibilité
  timelineSlug?: string | null;
  timelineTitle?: string | null;
  timelineThumbnail?: string | null;

  source?: ContentSource;
}

// MODÈLE NARRATIF COMPLET
export type TimelineType = 'personnage' | 'evenement' | 'thematique';
export type TimelineStatus = 'draft' | 'published';
export type TimeType = 'date' | 'period';

export interface MomentResource {
  id?: string;
  type: 'audio' | 'video' | 'image' | 'pdf' | 'link';
  title: string;
  url: string;
  caption?: string | null;
}

export interface TimelineMoment {
  id: string;
  timelineId: string;
  eventId?: string | null;       // lien vers un événement du calendrier
  title: string;
  narrative: string;
  timeType: TimeType;
  dateExact?: string;
  periodText?: string;
  position: number;
  media: Media[];
  resources?: MomentResource[];  // ressources complémentaires du moment
}

export interface TimelineNarrative {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  type: TimelineType;
  summary: string;       // = stories.summary (anciennement shortDescription)
  coverUrl: string;      // = stories.cover_url (anciennement thumbnail)
  periodLabel: string;
  status: TimelineStatus;
  eventCount: number;
  moments?: TimelineMoment[];
  personIds?: string[];
  people?: Array<{ id: string; slug: string; name: string; photoUrl?: string | null }>;
  createdAt?: string;
  updatedAt?: string;
  source?: ContentSource;
}

export interface FavItem {
  type: "event" | "module" | "timeline";
  id: string;
  slug: string;
  title: string;
  thumbnail?: string;
}

export type AuthRole = "admin" | "editor" | "contributor" | "viewer";

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
  // Source
  sourceType: 'event' | 'story' | 'module';
  eventId?: string | null;
  storyId?: string | null;
  moduleId?: string | null;
  // Overrides (null = valeur héritée de la source)
  titleOverride?: string | null;
  subtitleOverride?: string | null;
  imageUrlOverride?: string | null;
  // Champs fusionnés (override ?? source) — retournés par l'API
  title: string;
  subtitle: string;
  imageUrl: string;
  // Source info (pour pré-remplir le formulaire)
  eventSlug?: string | null;
  eventTitle?: string | null;
  eventSummary?: string | null;
  eventImageUrl?: string | null;
  storySlug?: string | null;
  storyTitle?: string | null;
  storySummary?: string | null;
  storyImageUrl?: string | null;
  moduleSlug?: string | null;
  moduleTitle?: string | null;
  moduleSummary?: string | null;
  moduleImageUrl?: string | null;
  // CTA & planification
  ctaLabel: string;
  ctaTo: string;
  active: boolean;
  startDate: string;
  endDate: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeaturedStory {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  sourceType?: 'event' | 'story' | 'module';
  eventSlug?: string | null;
  storySlug?: string | null;
  moduleSlug?: string | null;
  dateISO?: string | null;
  ctaType?: 'module' | 'timeline' | null;
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

// ─── Heritage Items (Patrimoine culturel) ────────────────────────────────────

export type HeritageCategory = 'mask' | 'proverb' | 'symbol' | 'recipe' | 'craft' | 'music' | 'other';
export type HeritageResourceType = 'audio' | 'image' | 'video' | 'pdf' | 'link';

export interface HeritageResource {
  id?: string;
  type: HeritageResourceType;
  url: string;
  title?: string | null;
  credit?: string | null;
  position?: number;
}

export interface HeritageItem {
  id: string;
  slug: string;
  lang: string;
  title: string;
  category: HeritageCategory;
  summary?: string | null;
  period?: string | null;
  countryCode?: string | null;
  coverUrl?: string | null;
  status: ContentStatus;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  themes?: Array<{ id: string; slug: string; name: string; color?: string | null }>;
  people?: Array<{ id: string; slug: string; name: string; photoUrl?: string | null }>;
  resources?: HeritageResource[];
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
