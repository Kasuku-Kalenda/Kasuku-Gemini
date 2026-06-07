
import { z } from 'zod';

export const mediaSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["image","video"]),
  // Accepte : http(s)://, data: (base64 upload), /, blob:
  url: z.string().min(1, "Une URL ou un fichier est requis").refine(
    v => v.startsWith('data:') || v.startsWith('http://') || v.startsWith('https://') || v.startsWith('/') || v.startsWith('blob:'),
    { message: "URL invalide — utilisez https:// ou chargez un fichier" }
  ),
  caption: z.string().optional().nullable(),
  credit: z.string().optional().nullable(),
});

export const sourceSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, { message: "Le label est requis" }),
  url: z.string().min(1, "L'URL est requise").refine(
    v => v.startsWith('http://') || v.startsWith('https://') || v.startsWith('/'),
    { message: "URL invalide — utilisez https://" }
  ),
});

export const eventFormSchema = z.object({
  title: z.string().min(3, { message: "Le titre doit avoir au moins 3 caractères" }),
  slug: z.string().min(3, { message: "Le slug doit avoir au moins 3 caractères" }),
  summary: z.string().min(40, { message: "Le résumé doit avoir au moins 40 caractères" }),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  // Les champs optionnels acceptent "" (chaîne vide HTML) grâce à !v dans le refine
  dateISO: z.string()
    .refine(v => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), { message: "Format requis : AAAA-MM-JJ (ex: 1960-04-04)" })
    .nullable().optional(),
  year: z.coerce.number().int().nullable().optional(),
  period: z.string().nullable().optional(),
  countryCode: z.string()
    .refine(v => !v || v.length === 2, { message: "Code pays : 2 lettres (ex: SN)" })
    .nullable().optional(),
  themeIds: z.array(z.string()).default([]),
  personIds: z.array(z.string()).default([]),
  heritageItemIds: z.array(z.string()).default([]),
  media: z.array(mediaSchema).default([]),
  sources: z.array(sourceSchema).default([]),
  // Champs avancés (correspondant aux colonnes DB)
  temporalType: z.enum(['exact_date', 'date_range', 'approximate', 'unknown']).default('exact_date'),
  displayDate: z.string().nullable().optional(),       // ex: "XVe siècle", "Vers 1450"
  endDate: z.string().nullable().optional(),           // pour date_range
  approxCentury: z.coerce.number().int().nullable().optional(),
  approxDecade: z.coerce.number().int().nullable().optional(),
  annualRecurrence: z.boolean().default(false),
  reliability: z.enum(['confirmed', 'probable', 'contested', 'unknown']).default('confirmed'),
  content: z.string().nullable().optional(),           // description longue
  contributors: z.array(z.string()).default([]),
});

export const themeFormSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit avoir au moins 2 caractères" }),
  slug: z.string().min(2, { message: "Le slug doit avoir au moins 2 caractères" }),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, { message: "Couleur hex invalide (ex: #E57C3C)" })
    .default('#6B7280'),
  emoji: z.string().max(4, { message: "Un seul emoji" }).optional().default(''),
});

// ─── Quiz schemas ────────────────────────────────────────────────────────────
export const quizQuestionSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(1, 'La question ne peut pas être vide'),
  type: z.enum(['multiple_choice', 'true_false']),
  options: z.array(z.string()).optional(),
  correctIndex: z.coerce.number().int().optional().nullable(),
  correctBool: z.boolean().optional().nullable(),
  explanation: z.string().optional().nullable(),
});

export const quizSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional().nullable(),
  passingScore: z.coerce.number().int().min(0).max(100).default(70),
  questions: z.array(quizQuestionSchema).default([]),
});

// ─── Course resource schema ───────────────────────────────────────────────────
export const courseResourceSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['audio', 'video', 'image', 'pdf', 'link', 'event', 'timeline']),
  title: z.string().min(2, 'Titre requis'),
  url: z.string().optional().nullable(),
  eventId: z.string().optional().nullable(),
  timelineSlug: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

// ─── Lesson & Section schemas ─────────────────────────────────────────────────
export const lessonSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2, 'Titre requis'),
  type: z.enum(['video', 'audio', 'pdf', 'text', 'quiz']),
  durationMin: z.coerce.number().int().optional().nullable(),
  url: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  transcript: z.string().optional().nullable(),
  order: z.coerce.number().int().min(0),
  quiz: quizSchema.optional().nullable(),
});

export const sectionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2, 'Titre requis'),
  description: z.string().optional().nullable(),
  order: z.coerce.number().int().min(0),
  lessons: z.array(lessonSchema).default([]),
  quiz: quizSchema.optional().nullable(),
});

export const moduleFormSchema = z.object({
  title: z.string().min(3, { message: "Le titre doit avoir au moins 3 caractères" }),
  slug: z.string().min(3, { message: "Le slug doit avoir au moins 3 caractères" }),
  summary: z.string().min(40, { message: "Le résumé doit avoir au moins 40 caractères" }),
  objectives: z.array(z.string().min(3, { message: "Objectif trop court" })).min(1, { message: "Au moins un objectif requis" }),
  level: z.enum(["Débutant","Intermédiaire","Avancé", "Beginner", "Intermediate", "Advanced"]).optional().nullable(),
  durationMin: z.coerce.number().int().optional().nullable(),
  language: z.enum(["fr","en"]).optional().nullable(),
  thumbnail: z.string().optional().nullable().refine(
    v => !v || v.startsWith('data:') || v.startsWith('http://') || v.startsWith('https://') || v.startsWith('/'),
    { message: "URL invalide" }
  ),
  tags: z.array(z.string()).default([]),
  eventIds: z.array(z.string()).default([]),
  creatorIds: z.array(z.string()).default([]),
  sponsorIds: z.array(z.string()).default([]),
  sections: z.array(sectionSchema).optional().default([]),
  moduleType: z.enum(['internal', 'moodle']).default('internal'),
  // Moodle fields
  moodleMode: z.enum(['url', 'lti', 'offline']).optional().nullable(),
  moodleCourseUrl: z.string().optional().nullable(),
  moodleInstanceId: z.string().optional().nullable(),
  moodleCourseId: z.string().optional().nullable(),
  moodlePackageId: z.string().optional().nullable(),
  // New course creation fields (used when creating a course inline)
  newCourseName: z.string().optional().nullable(),
  newCourseRemoteId: z.coerce.number().int().optional().nullable(),
  // Associations
  timelineSlug: z.string().optional().nullable(),
  // LMS features
  resources: z.array(courseResourceSchema).default([]),
  finalQuiz: quizSchema.optional().nullable(),
  hasCertificate: z.boolean().default(false),
  certificateName: z.string().optional().nullable(),
}).refine(data => {
  if (data.moduleType === 'moodle') {
    if (data.moodleMode === 'url') return !!data.moodleCourseUrl;
    if (data.moodleMode === 'lti' || data.moodleMode === 'offline') {
      return !!data.moodleInstanceId && !!(data.moodleCourseId || data.newCourseName);
    }
  }
  return true;
}, {
  message: "Veuillez compléter la configuration Moodle",
  path: ["moodleInstanceId"],
});

// ─── Timeline moment resource schema ─────────────────────────────────────────
export const momentResourceSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['audio', 'video', 'image', 'pdf', 'link']),
  title: z.string().min(1, 'Titre requis'),
  url: z.string().min(1, 'URL ou fichier requis'),
  caption: z.string().optional().nullable(),
});

// NOUVEAUX SCHÉMAS TIMELINE
export const timelineMomentSchema = z.object({
  id: z.string().optional(),
  eventId: z.string().optional().nullable(),           // ← lien vers un événement existant
  title: z.string().min(3),
  narrative: z.string().min(10).or(z.literal('').transform(() => '')).nullable().optional().transform(v => v ?? ''),  // mapped to narrativeText before API call
  timeType: z.enum(['date', 'period']),
  dateExact: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  periodText: z.string().optional().nullable(),
  position: z.coerce.number().int().min(0),
  media: z.array(mediaSchema).default([]),             // illustration principale
  resources: z.array(momentResourceSchema).default([]), // ressources complémentaires
  // ── Champs story_events narratifs ──────────────────────────────────────────
  narrativeAudioUrl: z.string().nullable().optional(), // URL audio narratif
  narrativeVideoUrl: z.string().nullable().optional(), // URL vidéo narratif
  quote: z.string().optional().nullable(),             // citation d'époque
  quoteAuthor: z.string().optional().nullable(),       // auteur de la citation
  sourceStoryEventId: z.string().optional().nullable(), // ID du StoryEvent source (clonage)
});

export const timelineFormSchema = z.object({
  title: z.string().min(3),
  subtitle: z.string().optional().nullable(),
  slug: z.string().min(3),
  type: z.enum(['personnage', 'evenement', 'thematique']),
  summary: z.string().min(10).max(200),
  // Accepte : https://, http://, data: (base64), /, blob:
  coverUrl: z.string().min(1, "Une image de couverture est requise").refine(
    v => v.startsWith('data:') || v.startsWith('http://') || v.startsWith('https://') || v.startsWith('/') || v.startsWith('blob:'),
    { message: "URL invalide — utilisez https:// ou chargez un fichier" }
  ),
  periodLabel: z.string().min(2, "Le label de période est requis (min 2 car.)"),
  status: z.enum(['draft', 'published']),
  personIds: z.array(z.string()).default([]),
  moments: z.array(timelineMomentSchema).default([])
});

export const featuredFormSchema = z.object({
  // Source
  sourceType: z.enum(['event', 'story', 'module']),
  eventId:    z.string().uuid().nullable().optional(),
  storyId:    z.string().uuid().nullable().optional(),
  moduleId:   z.string().uuid().nullable().optional(),
  // Overrides éditoriaux (facultatifs — hérite de la source si absent)
  titleOverride:    z.string().min(3, "Titre trop court").nullable().optional().or(z.literal('')).transform(v => v || null),
  subtitleOverride: z.string().nullable().optional().or(z.literal('')).transform(v => v || null),
  imageUrlOverride: z.string().nullable().optional().refine(
    v => !v || v.startsWith('data:') || v.startsWith('http://') || v.startsWith('https://') || v.startsWith('/'),
    { message: "URL invalide" }
  ),
  // CTA & planification
  ctaLabel:  z.string().min(2, "Le texte du bouton est requis"),
  ctaTo:     z.string().min(2, "La destination est requise"),
  active:    z.boolean().default(true),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format : AAAA-MM-JJ"),
  endDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format : AAAA-MM-JJ"),
  order:     z.coerce.number().int().min(0),
}).refine(data => {
  const sources = [data.eventId, data.storyId, data.moduleId].filter(Boolean);
  return sources.length === 1;
}, { message: "Sélectionnez une source (événement, récit ou module)", path: ["sourceType"] })
.refine(data => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
  message: "La date de fin doit être après la date de début",
  path: ["endDate"],
});

export type QuizQuestionFormData = z.infer<typeof quizQuestionSchema>;
export type QuizFormData = z.infer<typeof quizSchema>;
export type CourseResourceFormData = z.infer<typeof courseResourceSchema>;
export type EventFormData = z.infer<typeof eventFormSchema>;
export type ThemeFormData = z.infer<typeof themeFormSchema>;
export type ModuleFormData = z.infer<typeof moduleFormSchema>;
export type FeaturedFormData = z.infer<typeof featuredFormSchema>;
export type TimelineFormData = z.infer<typeof timelineFormSchema>;
export type TimelineMomentFormData = z.infer<typeof timelineMomentSchema>;
