
import { z } from 'zod';

export const mediaSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["image","video"]),
  url: z.string().url({ message: "Invalid URL" }),
  caption: z.string().optional(),
  credit: z.string().optional(),
});

export const sourceSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(2, { message: "Label must be at least 2 characters" }),
  url: z.string().url({ message: "Invalid URL" }),
});

export const eventFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  slug: z.string().min(3, { message: "Slug must be at least 3 characters" }),
  summary: z.string().min(40, { message: "Summary must be at least 40 characters" }),
  dateISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be YYYY-MM-DD" }).optional().nullable(),
  year: z.coerce.number().int().optional().nullable(),
  period: z.string().optional().nullable(),
  countryCode: z.string().length(2, { message: "Country code must be 2 characters" }).optional().nullable(),
  themeIds: z.array(z.string()).default([]),
  media: z.array(mediaSchema).default([]),
  sources: z.array(sourceSchema).default([]),
  timelineId: z.string().optional().nullable(),
  timelineMomentId: z.string().optional().nullable()
});

export const themeFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  slug: z.string().min(2, { message: "Slug must be at least 2 characters" })
});

export const lessonSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3),
  type: z.enum(["video","audio","pdf","quiz"]),
  durationMin: z.coerce.number().int().optional().nullable(),
  url: z.string().url().optional().nullable(),
  transcript: z.string().optional().nullable(),
  order: z.coerce.number().int().min(0)
});

export const sectionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3),
  order: z.coerce.number().int().min(0),
  lessons: z.array(lessonSchema).default([])
});

export const moduleFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  slug: z.string().min(3, { message: "Slug must be at least 3 characters" }),
  summary: z.string().min(40, { message: "Summary must be at least 40 characters" }),
  objectives: z.array(z.string().min(3, { message: "Objective must be at least 3 characters" })).min(1, { message: "At least one objective is required" }),
  level: z.enum(["Débutant","Intermédiaire","Avancé", "Beginner", "Intermediate", "Advanced"]).optional().nullable(),
  durationMin: z.coerce.number().int().optional().nullable(),
  language: z.enum(["fr","en"]).optional().nullable(),
  thumbnail: z.string().url({ message: "Invalid URL" }).optional().nullable(),
  tags: z.array(z.string()).default([]),
  eventIds: z.array(z.string()).default([]),
  creatorIds: z.array(z.string()).default([]),
  sponsorIds: z.array(z.string()).default([]),
  sections: z.array(sectionSchema).optional().default([]),
  moduleType: z.enum(['internal', 'moodle']).default('internal'),
  moodleCourseUrl: z.string().url({ message: "Invalid Moodle URL" }).optional().nullable(),
}).refine(data => {
    if (data.moduleType === 'moodle') {
        return !!data.moodleCourseUrl && data.moodleCourseUrl.length > 0;
    }
    return true;
}, {
    message: "Moodle course URL is required for Moodle modules",
    path: ["moodleCourseUrl"],
});

// NOUVEAUX SCHÉMAS TIMELINE
export const timelineMomentSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3),
  narrative: z.string().min(20),
  timeType: z.enum(['date', 'period']),
  dateExact: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  periodText: z.string().optional().nullable(),
  position: z.coerce.number().int().min(0),
  media: z.array(mediaSchema).default([])
});

export const timelineFormSchema = z.object({
  title: z.string().min(3),
  subtitle: z.string().optional().nullable(),
  slug: z.string().min(3),
  type: z.enum(['personnage', 'evenement']),
  shortDescription: z.string().min(10).max(200),
  longDescription: z.string().optional().nullable(),
  thumbnail: z.string().url(),
  periodLabel: z.string().min(2),
  status: z.enum(['draft', 'published']),
  moments: z.array(timelineMomentSchema).default([])
});

export const featuredFormSchema = z.object({
  title: z.string().min(3),
  subtitle: z.string().min(10),
  imageUrl: z.string().url(),
  eventId: z.string().min(1, "Event ID is required"),
  ctaLabel: z.string().min(3),
  ctaTo: z.string().min(3, "Module slug is required"),
  active: z.boolean().default(true),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  order: z.coerce.number().int().min(0)
});

export type EventFormData = z.infer<typeof eventFormSchema>;
export type ThemeFormData = z.infer<typeof themeFormSchema>;
export type ModuleFormData = z.infer<typeof moduleFormSchema>;
export type FeaturedFormData = z.infer<typeof featuredFormSchema>;
export type TimelineFormData = z.infer<typeof timelineFormSchema>;
export type TimelineMomentFormData = z.infer<typeof timelineMomentSchema>;
