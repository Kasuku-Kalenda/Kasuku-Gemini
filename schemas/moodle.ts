import { z } from 'zod';

export const moodleInstanceSchema = z.object({
  name: z.string().min(2),
  baseUrl: z.string().url(),
  ltiIssuer: z.string().url().optional().nullable(),
  ltiClientId: z.string().optional().nullable(),
  ltiAuthUrl: z.string().url().optional().nullable(),
  ltiTokenUrl: z.string().url().optional().nullable(),
  ltiKeySetUrl: z.string().url().optional().nullable(),
  ltiDeploymentId: z.string().optional().nullable(),
  apiToken: z.string().optional().nullable()
});

export const moodleCourseSchema = z.object({
  instanceId: z.string(),
  remoteCourseId: z.coerce.number().int(),
  shortname: z.string().min(1),
  fullname: z.string().min(1),
  summary: z.string().optional().nullable(),
  language: z.string().optional().nullable()
});

export const moodlePackageSchema = z.object({
  courseId: z.string(),
  type: z.enum(["SCORM","H5P","IMSCC"]),
  title: z.string().min(2),
  version: z.string().optional().nullable(),
  storagePath: z.string().min(1),
  manifestPath: z.string().optional().nullable(),
  sizeBytes: z.coerce.number().int().optional().nullable(),
  isAvailable: z.boolean().optional().default(false)
});

export const moodleMapSchema = z.object({
  moduleId: z.string(),
  courseId: z.string().optional().nullable(),
  packageId: z.string().optional().nullable(),
  mode: z.enum(["LTI","REST","OFFLINE"]),
  note: z.string().optional().nullable()
});

export type MoodleInstanceFormData = z.infer<typeof moodleInstanceSchema>;
export type MoodleCourseFormData = z.infer<typeof moodleCourseSchema>;
export type MoodlePackageFormData = z.infer<typeof moodlePackageSchema>;
export type MoodleMapFormData = z.infer<typeof moodleMapSchema>;
