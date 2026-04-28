/**
 * api/src/routes/timelines.ts
 *
 * GET  /api/v1/timelines             — liste (publiées)
 * GET  /api/v1/timelines/all         — liste complète [admin]
 * GET  /api/v1/timelines/:id         — détail par ID
 * GET  /api/v1/timelines/slug/:slug  — détail par slug
 * POST /api/v1/timelines             — créer [admin]
 * PUT  /api/v1/timelines/:id         — modifier [admin]
 * DELETE /api/v1/timelines/:id       — supprimer [admin]
 */

import type { FastifyInstance } from 'fastify';
import { Timeline }     from '../models';
import { requireAdmin } from '../middleware/auth';
import slugify from 'slugify';

function toSlug(title: string) {
  return slugify(title, { lower: true, strict: true, locale: 'fr' });
}

function sortMoments(moments: Array<Record<string, unknown>>) {
  return [...moments].sort((a, b) => {
    const ta = momentTs(a);
    const tb = momentTs(b);
    if (ta !== tb) return ta - tb;
    return ((a.position as number) ?? 0) - ((b.position as number) ?? 0);
  }).map((m, i) => ({ ...m, position: i }));
}

function momentTs(m: Record<string, unknown>): number {
  if (m.dateExact) {
    const ts = new Date(`${m.dateExact as string}T12:00:00Z`).getTime();
    if (!isNaN(ts)) return ts;
  }
  if (m.periodText) {
    const match = (m.periodText as string).match(/\b(\d{3,4})\b/);
    if (match) {
      const y = parseInt(match[1], 10);
      if (y >= 100 && y <= 2200) return new Date(`${y}-07-01T12:00:00Z`).getTime();
    }
  }
  return Infinity;
}

export async function timelinesRoutes(app: FastifyInstance) {

  // GET / — timelines publiées (public)
  app.get('/', async (_req, reply) => {
    const items = await Timeline.find({ status: 'published' })
      .select('-moments')
      .sort({ createdAt: -1 })
      .lean();

    return reply.send(items.map(t => ({ ...t, id: t._id.toString() })));
  });

  // GET /all — toutes [admin]
  app.get('/all', { preHandler: requireAdmin }, async (_req, reply) => {
    const items = await Timeline.find().select('-moments').sort({ createdAt: -1 }).lean();
    return reply.send({ items: items.map(t => ({ ...t, id: t._id.toString() })) });
  });

  // GET /slug/:slug
  app.get<{ Params: { slug: string } }>('/slug/:slug', async (req, reply) => {
    const timeline = await Timeline.findOne({ slug: req.params.slug }).lean();
    if (!timeline) return reply.status(404).send({ error: 'Timeline introuvable' });
    return reply.send({ ...timeline, id: timeline._id.toString() });
  });

  // GET /:id
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const timeline = await Timeline.findById(req.params.id).lean();
    if (!timeline) return reply.status(404).send({ error: 'Timeline introuvable' });
    return reply.send({ ...timeline, id: timeline._id.toString() });
  });

  // POST / [admin]
  app.post<{ Body: Record<string, unknown> }>('/', { preHandler: requireAdmin }, async (req, reply) => {
    const body    = req.body;
    const slug    = (body.slug as string) || toSlug(body.title as string);
    const moments = sortMoments((body.moments as Array<Record<string, unknown>>) ?? []);

    const existing = await Timeline.findOne({ slug });
    if (existing) return reply.status(409).send({ error: `Slug "${slug}" déjà utilisé` });

    const timeline = await Timeline.create({
      ...body,
      slug,
      moments,
      eventCount: moments.length,
      source: { type: 'local', id: 'local_admin' },
    });

    return reply.status(201).send({ ...timeline.toObject(), id: timeline._id.toString() });
  });

  // PUT /:id [admin]
  app.put<{ Params: { id: string }; Body: Record<string, unknown> }>('/:id', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    const body    = req.body;
    const moments = sortMoments((body.moments as Array<Record<string, unknown>>) ?? []);

    const timeline = await Timeline.findByIdAndUpdate(
      req.params.id,
      { ...body, moments, eventCount: moments.length, updatedAt: new Date() },
      { new: true, runValidators: true },
    ).lean();

    if (!timeline) return reply.status(404).send({ error: 'Timeline introuvable' });
    return reply.send({ ...timeline, id: timeline._id.toString() });
  });

  // DELETE /:id [admin]
  app.delete<{ Params: { id: string } }>('/:id', { preHandler: requireAdmin }, async (req, reply) => {
    const result = await Timeline.findByIdAndDelete(req.params.id);
    if (!result) return reply.status(404).send({ error: 'Timeline introuvable' });
    return reply.status(204).send();
  });
}
