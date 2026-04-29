/**
 * api/src/routes/kalenda.ts
 *
 * GET    /api/v1/kalendas          — liste (publiées, public)
 * GET    /api/v1/kalendas/all      — toutes [admin]
 * GET    /api/v1/kalendas/:id      — détail
 * POST   /api/v1/kalendas          [admin]
 * PUT    /api/v1/kalendas/:id      [admin]
 * DELETE /api/v1/kalendas/:id      [admin]
 * GET    /api/v1/kalendas/:id/export — exporter le contenu sélectionné [admin]
 */

import type { FastifyInstance } from 'fastify';
import { Kalenda, Event, Timeline, TrainingModule, Theme } from '../models';
import { requireAdmin } from '../middleware/auth';
import slugify from 'slugify';

export async function kalendaRoutes(app: FastifyInstance) {

  // GET / (public)
  app.get('/', async (_req, reply) => {
    const items = await Kalenda.find({ status: 'published' }).sort({ createdAt: -1 }).lean();
    return reply.send(items.map(k => ({ ...k, id: k._id.toString() })));
  });

  // GET /all [admin]
  app.get('/all', { preHandler: requireAdmin }, async (_req, reply) => {
    const items = await Kalenda.find().sort({ createdAt: -1 }).lean();
    return reply.send({ items: items.map(k => ({ ...k, id: k._id.toString() })) });
  });

  // GET /:id
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const k = await Kalenda.findById(req.params.id).lean();
    if (!k) return reply.status(404).send({ error: 'Kalenda introuvable' });
    return reply.send({ ...k, id: k._id.toString() });
  });

  // POST / [admin]
  app.post<{ Body: Record<string, unknown> }>('/', { preHandler: requireAdmin }, async (req, reply) => {
    const body = req.body;
    const slug = (body.slug as string) || slugify(body.name as string, { lower: true, strict: true, locale: 'fr' });

    const existing = await Kalenda.findOne({ slug });
    if (existing) return reply.status(409).send({ error: `Slug "${slug}" déjà utilisé` });

    const k = await Kalenda.create({ ...body, slug });
    return reply.status(201).send({ ...k.toObject(), id: k._id.toString() });
  });

  // PUT /:id [admin]
  app.put<{ Params: { id: string }; Body: Record<string, unknown> }>('/:id', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    const k = await Kalenda.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!k) return reply.status(404).send({ error: 'Kalenda introuvable' });
    return reply.send({ ...k, id: k._id.toString() });
  });

  // DELETE /:id [admin]
  app.delete<{ Params: { id: string } }>('/:id', { preHandler: requireAdmin }, async (req, reply) => {
    const result = await Kalenda.findByIdAndDelete(req.params.id);
    if (!result) return reply.status(404).send({ error: 'Kalenda introuvable' });
    return reply.status(204).send();
  });

  // GET /:id/export — snapshot du contenu sélectionné pour distribution offline [admin]
  app.get<{ Params: { id: string } }>('/:id/export', { preHandler: requireAdmin }, async (req, reply) => {
    const k = await Kalenda.findById(req.params.id).lean();
    if (!k) return reply.status(404).send({ error: 'Kalenda introuvable' });

    const [events, timelines, modules, themes] = await Promise.all([
      Event.find({ _id: { $in: k.eventIds } }).lean(),
      Timeline.find({ _id: { $in: k.timelineIds } }).lean(),
      TrainingModule.find({ _id: { $in: k.moduleIds } }).lean(),
      Theme.find({ _id: { $in: k.themeIds } }).lean(),
    ]);

    return reply.send({
      kalenda:   { ...k, id: k._id.toString() },
      events:    events.map(e => ({ ...e, id: e._id.toString() })),
      timelines: timelines.map(t => ({ ...t, id: t._id.toString() })),
      modules:   modules.map(m => ({ ...m, id: m._id.toString() })),
      themes:    themes.map(t => ({ ...t, id: t._id.toString() })),
      exportedAt: new Date().toISOString(),
    });
  });
}
