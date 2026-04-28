/**
 * api/src/routes/events.ts
 *
 * GET  /api/v1/events           — liste (filtrée, paginée)
 * GET  /api/v1/events/:id       — détail par ID
 * GET  /api/v1/events/slug/:slug — détail par slug
 * POST /api/v1/events           — créer  [admin]
 * PUT  /api/v1/events/:id       — modifier [admin]
 * DELETE /api/v1/events/:id     — supprimer [admin]
 */

import type { FastifyInstance } from 'fastify';
import { Event }      from '../models';
import { requireAdmin } from '../middleware/auth';
import slugify from 'slugify';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(title: string) {
  return slugify(title, { lower: true, strict: true, locale: 'fr' });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function eventsRoutes(app: FastifyInstance) {

  // GET /events — liste filtrée
  app.get<{
    Querystring: {
      q?: string; theme?: string; country?: string;
      year?: string; date?: string; page?: string; limit?: string;
    }
  }>('/', async (req, reply) => {
    const { q, theme, country, year, date, page = '1', limit = '20' } = req.query;

    const filter: Record<string, unknown> = {};

    if (q) {
      filter.$text = { $search: q };
    }
    if (theme)   filter['themes.slug'] = theme;
    if (country) filter.countryCode   = country;
    if (year)    filter.year          = parseInt(year, 10);
    if (date) {
      const d = new Date(date);
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day   = String(d.getDate()).padStart(2, '0');
      // Match les événements dont dateISO se termine par -MM-DD (même jour/mois toutes années)
      filter.dateISO = { $regex: `-${month}-${day}$` };
    }

    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, parseInt(limit, 10));
    const skip     = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Event.find(filter).sort({ dateISO: -1 }).skip(skip).limit(limitNum).lean(),
      Event.countDocuments(filter),
    ]);

    return reply.send({
      items: items.map(e => ({ ...e, id: e._id.toString() })),
      page:       pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
    });
  });

  // GET /events/slug/:slug
  app.get<{ Params: { slug: string } }>('/slug/:slug', async (req, reply) => {
    const event = await Event.findOne({ slug: req.params.slug }).lean();
    if (!event) return reply.status(404).send({ error: 'Événement introuvable' });
    return reply.send({ ...event, id: event._id.toString() });
  });

  // GET /events/:id
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const event = await Event.findById(req.params.id).lean();
    if (!event) return reply.status(404).send({ error: 'Événement introuvable' });
    return reply.send({ ...event, id: event._id.toString() });
  });

  // POST /events [admin]
  app.post<{ Body: Record<string, unknown> }>('/', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    const body = req.body;
    const slug = (body.slug as string) || toSlug(body.title as string);

    const existing = await Event.findOne({ slug });
    if (existing) {
      return reply.status(409).send({ error: `Le slug "${slug}" est déjà utilisé` });
    }

    const event = await Event.create({ ...body, slug, source: { type: 'local', id: 'local_admin' } });
    return reply.status(201).send({ ...event.toObject(), id: event._id.toString() });
  });

  // PUT /events/:id [admin]
  app.put<{ Params: { id: string }; Body: Record<string, unknown> }>('/:id', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true },
    ).lean();

    if (!event) return reply.status(404).send({ error: 'Événement introuvable' });
    return reply.send({ ...event, id: event._id.toString() });
  });

  // DELETE /events/:id [admin]
  app.delete<{ Params: { id: string } }>('/:id', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    const result = await Event.findByIdAndDelete(req.params.id);
    if (!result) return reply.status(404).send({ error: 'Événement introuvable' });
    return reply.status(204).send();
  });
}
