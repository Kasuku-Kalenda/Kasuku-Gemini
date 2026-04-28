/**
 * api/src/routes/featured.ts
 *
 * GET  /api/v1/featured       — items actifs (public), enrichis avec event/timeline/module
 * GET  /api/v1/featured/all   — tous les items [admin]
 * POST /api/v1/featured       [admin]
 * PUT  /api/v1/featured/:id   [admin]
 * DELETE /api/v1/featured/:id [admin]
 */

import type { FastifyInstance } from 'fastify';
import { FeaturedItem, Event, Timeline, TrainingModule } from '../models';
import { requireAdmin } from '../middleware/auth';

export async function featuredRoutes(app: FastifyInstance) {

  // GET / — items actifs enrichis (public)
  app.get('/', async (_req, reply) => {
    const today = new Date().toISOString().split('T')[0];

    const items = await FeaturedItem.find({
      active: true,
      startDate: { $lte: today },
      endDate:   { $gte: today },
    }).sort({ order: 1 }).lean();

    const [events, modules, timelines] = await Promise.all([
      Event.find().select('id slug dateISO period media').lean(),
      TrainingModule.find().select('id slug').lean(),
      Timeline.find().select('id slug thumbnail').lean(),
    ]);

    const stories = items.map(item => {
      const event    = item.eventId ? events.find(e => e._id.toString() === item.eventId) : null;
      const matchMod = modules.find(m => m.slug === item.ctaTo);
      const matchTl  = timelines.find(t => t.slug === item.ctaTo);

      const ctaType = matchMod ? 'module' : matchTl ? 'timeline' : null;

      const imageUrl = item.imageUrl
        || (matchTl as { thumbnail?: string } | null)?.thumbnail
        || (event?.media as Array<{ url: string }> | undefined)?.[0]?.url
        || undefined;

      return {
        id:       item._id.toString(),
        title:    item.title,
        subtitle: item.subtitle,
        imageUrl,
        eventSlug: (event as { slug?: string } | null)?.slug ?? null,
        dateISO:   (event as { dateISO?: string; period?: string } | null)?.dateISO
          ? new Date((event as { dateISO: string }).dateISO + 'T12:00:00Z')
              .toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
              .replace(/\./g, '').trim()
          : (event as { period?: string } | null)?.period ?? null,
        ctaType,
        ctaLabel: item.ctaLabel,
        ctaTo:    item.ctaTo,
      };
    });

    return reply.send(stories);
  });

  // GET /all [admin]
  app.get('/all', { preHandler: requireAdmin }, async (_req, reply) => {
    const items = await FeaturedItem.find().sort({ order: 1 }).lean();
    return reply.send({ items: items.map(i => ({ ...i, id: i._id.toString() })) });
  });

  // POST / [admin]
  app.post<{ Body: Record<string, unknown> }>('/', { preHandler: requireAdmin }, async (req, reply) => {
    const item = await FeaturedItem.create(req.body);
    return reply.status(201).send({ ...item.toObject(), id: item._id.toString() });
  });

  // PUT /:id [admin]
  app.put<{ Params: { id: string }; Body: Record<string, unknown> }>('/:id', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    const item = await FeaturedItem.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!item) return reply.status(404).send({ error: 'Item introuvable' });
    return reply.send({ ...item, id: item._id.toString() });
  });

  // DELETE /:id [admin]
  app.delete<{ Params: { id: string } }>('/:id', { preHandler: requireAdmin }, async (req, reply) => {
    const result = await FeaturedItem.findByIdAndDelete(req.params.id);
    if (!result) return reply.status(404).send({ error: 'Item introuvable' });
    return reply.status(204).send();
  });
}
