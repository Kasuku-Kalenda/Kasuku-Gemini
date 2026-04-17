import { z } from 'zod';

export const MediaSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['image', 'video']),
  url: z.string().url('URL invalide'),
  caption: z.string().optional(),
  credit: z.string().optional(),
});

export const SourceSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, 'Le libellé est requis'),
  url: z.string().url('URL invalide'),
});

export const EventSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, 'Le titre doit faire au moins 3 caractères'),
  slug: z.string().min(3, 'Le slug est requis'),
  summary: z.string().min(10, 'Le résumé doit faire au moins 10 caractères'),
  dateISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)').optional().or(z.literal('')),
  year: z.number().int().optional(),
  period: z.string().optional(),
  countryCode: z.string().length(2, 'Code pays à 2 caractères').optional().or(z.literal('')),
  themes: z.array(z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  })).default([]),
  media: z.array(MediaSchema).default([]),
  sources: z.array(SourceSchema).default([]),
  timelineId: z.string().optional(),
  timelineMomentId: z.string().optional(),
  timelineSlug: z.string().optional(),
});

export const ThemeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Le nom doit faire au moins 2 caractères'),
  slug: z.string().min(2, 'Le slug est requis'),
});

export const LessonSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, 'Titre requis'),
  type: z.enum(['video', 'audio', 'pdf', 'quiz']),
  durationMin: z.number().int().optional(),
  url: z.string().url('URL invalide').optional().or(z.literal('')),
  transcript: z.string().optional(),
  order: z.number().int(),
});

export const SectionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, 'Titre requis'),
  order: z.number().int(),
  lessons: z.array(LessonSchema).default([]),
});

export const TrainingModuleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, 'Titre requis'),
  slug: z.string().min(3, 'Slug requis'),
  summary: z.string().min(10, 'Résumé requis'),
  durationMin: z.number().int().nullable().optional(),
  level: z.enum(['Débutant', 'Intermédiaire', 'Avancé', 'Beginner', 'Intermediate', 'Advanced']).nullable().optional(),
  objectives: z.array(z.string()).default([]),
  language: z.string().optional(),
  thumbnail: z.string().url('URL invalide').optional().or(z.literal('')),
  moduleType: z.enum(['internal', 'moodle']).default('internal'),
  moodleCourseUrl: z.string().url('URL invalide').optional().or(z.literal('')),
  eventIds: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  sections: z.array(SectionSchema).default([]),
});

export const TimelineMomentSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, 'Titre requis'),
  narrative: z.string().min(10, 'Récit requis'),
  timeType: z.enum(['date', 'period']),
  dateExact: z.string().optional(),
  periodText: z.string().optional(),
  position: z.number().int(),
  media: z.array(MediaSchema).default([]),
});

export const TimelineNarrativeSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(3, 'Slug requis'),
  title: z.string().min(3, 'Titre requis'),
  subtitle: z.string().optional(),
  type: z.enum(['personnage', 'evenement']),
  shortDescription: z.string().min(10, 'Description courte requise'),
  longDescription: z.string().optional(),
  thumbnail: z.string().url('URL invalide'),
  periodLabel: z.string().min(2, 'Label de période requis'),
  status: z.enum(['draft', 'published']).default('draft'),
  moments: z.array(TimelineMomentSchema).default([]),
});

export type EventFormData = z.infer<typeof EventSchema>;
export type EventFormInput = z.input<typeof EventSchema>;

export type ThemeFormData = z.infer<typeof ThemeSchema>;
export type ThemeFormInput = z.input<typeof ThemeSchema>;

export type TrainingModuleFormData = z.infer<typeof TrainingModuleSchema>;
export type TrainingModuleFormInput = z.input<typeof TrainingModuleSchema>;

export type TimelineFormData = z.infer<typeof TimelineNarrativeSchema>;
export type TimelineFormInput = z.input<typeof TimelineNarrativeSchema>;

export type TimelineMomentFormData = z.infer<typeof TimelineMomentSchema>;
export type TimelineMomentFormInput = z.input<typeof TimelineMomentSchema>;
