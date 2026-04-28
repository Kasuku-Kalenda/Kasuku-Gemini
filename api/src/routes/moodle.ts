/**
 * api/src/routes/moodle.ts — Intégration Moodle (LTI + offline)
 *
 * /api/v1/moodle/instances   — CRUD instances Moodle
 * /api/v1/moodle/courses     — CRUD cours Moodle
 * /api/v1/moodle/packages    — CRUD paquets offline (SCORM/H5P)
 * /api/v1/moodle/maps        — CRUD mappings module ↔ cours
 *
 * Toutes les routes nécessitent le rôle ADMIN ou SUPERADMIN.
 */

import type { FastifyInstance } from 'fastify';
import {
  MoodleInstance,
  MoodleCourse,
  MoodleOfflinePackage,
  MoodleCourseMap,
} from '../models';
import { requireAdmin } from '../middleware/auth';

// ─── Helper ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toId(doc: any) {
  return { ...doc, id: String(doc._id) };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function moodleRoutes(app: FastifyInstance) {

  // ══ Instances ══════════════════════════════════════════════════════════════

  /** GET /moodle/instances — liste toutes les instances */
  app.get('/instances', { preHandler: requireAdmin }, async (_req, reply) => {
    const items = await MoodleInstance.find().sort({ name: 1 }).lean();
    return reply.send({ items: items.map(toId) });
  });

  /** GET /moodle/instances/:id */
  app.get<{ Params: { id: string } }>('/instances/:id', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    const doc = await MoodleInstance.findById(req.params.id).lean();
    if (!doc) return reply.status(404).send({ error: 'Instance introuvable' });
    return reply.send(toId(doc));
  });

  /** POST /moodle/instances */
  app.post<{ Body: Record<string, unknown> }>('/instances', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    const doc = await MoodleInstance.create(req.body);
    return reply.status(201).send(toId(doc.toObject()));
  });

  /** PUT /moodle/instances/:id */
  app.put<{ Params: { id: string }; Body: Record<string, unknown> }>('/instances/:id', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    const doc = await MoodleInstance.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true },
    ).lean();
    if (!doc) return reply.status(404).send({ error: 'Instance introuvable' });
    return reply.send(toId(doc));
  });

  /** DELETE /moodle/instances/:id */
  app.delete<{ Params: { id: string } }>('/instances/:id', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    const result = await MoodleInstance.findByIdAndDelete(req.params.id);
    if (!result) return reply.status(404).send({ error: 'Instance introuvable' });
    return reply.status(204).send();
  });

  // ══ Courses ════════════════════════════════════════════════════════════════

  /** GET /moodle/courses */
  app.get('/courses', { preHandler: requireAdmin }, async (_req, reply) => {
    const items = await MoodleCourse.find().sort({ fullname: 1 }).lean();
    return reply.send({ items: items.map(toId) });
  });

  /** GET /moodle/courses/:id */
  app.get<{ Params: { id: string } }>('/courses/:id', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    const doc = await MoodleCourse.findById(req.params.id).lean();
    if (!doc) return reply.status(404).send({ error: 'Cours introuvable' });
    return reply.send(toId(doc));
  });

  /** POST /moodle/courses */
  app.post<{ Body: Record<string, unknown> }>('/courses', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    const doc = await MoodleCourse.create(req.body);
    return reply.status(201).send(toId(doc.toObject()));
  });

  /** PUT /moodle/courses/:id */
  app.put<{ Params: { id: string }; Body: Record<string, unknown> }>('/courses/:id', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    const doc = await MoodleCourse.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true },
    ).lean();
    if (!doc) return reply.status(404).send({ error: 'Cours introuvable' });
    return reply.send(toId(doc));
  });

  /** DELETE /moodle/courses/:id */
  app.delete<{ Params: { id: string } }>('/courses/:id', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    const result = await MoodleCourse.findByIdAndDelete(req.params.id);
    if (!result) return reply.status(404).send({ error: 'Cours introuvable' });
    return reply.status(204).send();
  });

  // ══ Packages offline ═══════════════════════════════════════════════════════

  /** GET /moodle/packages */
  app.get('/packages', { preHandler: requireAdmin }, async (_req, reply) => {
    const items = await MoodleOfflinePackage.find().sort({ createdAt: -1 }).lean();
    return reply.send({ items: items.map(toId) });
  });

  /** GET /moodle/packages/:id */
  app.get<{ Params: { id: string } }>('/packages/:id', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    const doc = await MoodleOfflinePackage.findById(req.params.id).lean();
    if (!doc) return reply.status(404).send({ error: 'Paquet introuvable' });
    return reply.send(toId(doc));
  });

  /** POST /moodle/packages — création directe (métadonnées déjà uploadées sur MinIO) */
  app.post<{ Body: Record<string, unknown> }>('/packages', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    const doc = await MoodleOfflinePackage.create(req.body);
    return reply.status(201).send(toId(doc.toObject()));
  });

  /** PUT /moodle/packages/:id */
  app.put<{ Params: { id: string }; Body: Record<string, unknown> }>('/packages/:id', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    const doc = await MoodleOfflinePackage.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true },
    ).lean();
    if (!doc) return reply.status(404).send({ error: 'Paquet introuvable' });
    return reply.send(toId(doc));
  });

  /** DELETE /moodle/packages/:id */
  app.delete<{ Params: { id: string } }>('/packages/:id', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    const result = await MoodleOfflinePackage.findByIdAndDelete(req.params.id);
    if (!result) return reply.status(404).send({ error: 'Paquet introuvable' });
    return reply.status(204).send();
  });

  // ══ Mappings module ↔ cours ════════════════════════════════════════════════

  /** GET /moodle/maps */
  app.get('/maps', { preHandler: requireAdmin }, async (_req, reply) => {
    const items = await MoodleCourseMap.find().sort({ createdAt: -1 }).lean();
    return reply.send({ items: items.map(toId) });
  });

  /** GET /moodle/maps/:id */
  app.get<{ Params: { id: string } }>('/maps/:id', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    const doc = await MoodleCourseMap.findById(req.params.id).lean();
    if (!doc) return reply.status(404).send({ error: 'Mapping introuvable' });
    return reply.send(toId(doc));
  });

  /** POST /moodle/maps */
  app.post<{ Body: Record<string, unknown> }>('/maps', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    const doc = await MoodleCourseMap.create(req.body);
    return reply.status(201).send(toId(doc.toObject()));
  });

  /** PUT /moodle/maps/:id */
  app.put<{ Params: { id: string }; Body: Record<string, unknown> }>('/maps/:id', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    const doc = await MoodleCourseMap.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true },
    ).lean();
    if (!doc) return reply.status(404).send({ error: 'Mapping introuvable' });
    return reply.send(toId(doc));
  });

  /** DELETE /moodle/maps/:id */
  app.delete<{ Params: { id: string } }>('/maps/:id', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    const result = await MoodleCourseMap.findByIdAndDelete(req.params.id);
    if (!result) return reply.status(404).send({ error: 'Mapping introuvable' });
    return reply.status(204).send();
  });

  // ══ Proxy LTI (futur) ══════════════════════════════════════════════════════
  // Les routes LTI 1.3 (launch, auth, JWKS) seront ajoutées ici

}
