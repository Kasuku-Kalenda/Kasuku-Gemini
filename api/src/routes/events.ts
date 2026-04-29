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
import { Event, Timeline } from '../models';
import { requireAdmin } from '../middleware/auth';
import slugify from 'slugify';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(title: string) {
  return slugify(title, { lower: true, strict: true, locale: 'fr' });
}

/**
 * Résolution bidirectionnelle des associations timeline ↔ événement.
 *
 * Direction 1 — event.timelineId → timeline.slug (lien direct sur l'event)
 * Direction 2 — timeline.moments[].eventId → event._id (lien inverse via les moments)
 *
 * Les deux sont fusionnés pour que TOUS les événements dans un récit
 * affichent l'indicateur de timeline dans le calendrier.
 */
async function resolveTimelineSlugs<T extends { id?: unknown; timelineId?: unknown; timelineSlug?: unknown }>(
  events: T[],
): Promise<T[]> {
  if (events.length === 0) return events;

  const eventIds = events.map(e => e.id as string).filter(Boolean);

  // Direction 1 : event a timelineId mais pas de timelineSlug
  const directIds = [...new Set(
    events.filter(e => e.timelineId && !e.timelineSlug).map(e => e.timelineId as string),
  )];

  // Direction 2 : timelines qui référencent ces events dans leurs moments
  const [directTimelines, reverseTimelines] = await Promise.all([
    directIds.length > 0
      ? Timeline.find({ _id: { $in: directIds } }).select('_id slug title thumbnail').lean()
      : Promise.resolve([]),
    Timeline.find({ 'moments.eventId': { $in: eventIds } }).select('_id slug title thumbnail moments').lean(),
  ]);

  // Map timelineId → info
  const byId: Record<string, { slug: string; title: string; thumbnail?: string }> = {};
  [...directTimelines, ...reverseTimelines].forEach(t => {
    byId[t._id.toString()] = { slug: t.slug, title: t.title, thumbnail: (t as any).thumbnail };
  });

  // Map eventId → info (depuis les moments des timelines)
  const byEventId: Record<string, { slug: string; title: string; thumbnail?: string }> = {};
  reverseTimelines.forEach(t => {
    ((t as any).moments ?? []).forEach((m: any) => {
      if (m.eventId) byEventId[m.eventId] = byId[t._id.toString()];
    });
  });

  return events.map(e => {
    if (e.timelineSlug) return e; // déjà résolu

    // Direction 1
    if (e.timelineId) {
      const info = byId[e.timelineId as string];
      if (info) return { ...e, timelineSlug: info.slug, timelineTitle: info.title, timelineThumbnail: info.thumbnail };
    }

    // Direction 2
    const info = byEventId[e.id as string];
    if (info) return { ...e, timelineSlug: info.slug, timelineTitle: info.title, timelineThumbnail: info.thumbnail };

    return e;
  });
}

/** Détecte récursivement les data URLs base64 dans un objet/tableau */
function findBase64Fields(obj: unknown, path = ''): string[] {
  if (typeof obj === 'string') {
    return /^data:[a-z]+\/[a-z0-9.+-]+;base64,/i.test(obj) ? [path || '(racine)'] : [];
  }
  if (Array.isArray(obj)) {
    return obj.flatMap((item, i) => findBase64Fields(item, `${path}[${i}]`));
  }
  if (obj && typeof obj === 'object') {
    return Object.entries(obj).flatMap(([k, v]) => findBase64Fields(v, path ? `${path}.${k}` : k));
  }
  return [];
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

    const [rawItems, total] = await Promise.all([
      Event.find(filter).sort({ dateISO: -1 }).skip(skip).limit(limitNum).lean(),
      Event.countDocuments(filter),
    ]);

    const mapped = rawItems.map(e => ({ ...e, id: e._id.toString() }));
    const items  = await resolveTimelineSlugs(mapped);

    return reply.send({
      items,
      page:       pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
    });
  });

  // GET /events/slug/:slug
  app.get<{ Params: { slug: string } }>('/slug/:slug', async (req, reply) => {
    const event = await Event.findOne({ slug: req.params.slug }).lean();
    if (!event) return reply.status(404).send({ error: 'Événement introuvable' });
    const [resolved] = await resolveTimelineSlugs([{ ...event, id: event._id.toString() }]);
    return reply.send(resolved);
  });

  // GET /events/:id
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const event = await Event.findById(req.params.id).lean();
    if (!event) return reply.status(404).send({ error: 'Événement introuvable' });
    const [resolved] = await resolveTimelineSlugs([{ ...event, id: event._id.toString() }]);
    return reply.send(resolved);
  });

  // POST /events [admin]
  app.post<{ Body: Record<string, unknown> }>('/', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    const base64Fields = findBase64Fields(req.body);
    if (base64Fields.length > 0) {
      return reply.status(400).send({
        error: `Fichiers base64 dans : ${base64Fields.join(', ')}. Supprimez ces médias et ré-uploadez-les (bouton 📁).`,
        fields: base64Fields,
      });
    }

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
    const base64Fields = findBase64Fields(req.body);
    if (base64Fields.length > 0) {
      return reply.status(400).send({
        error: `Fichiers base64 dans : ${base64Fields.join(', ')}. Supprimez ces médias et ré-uploadez-les (bouton 📁).`,
        fields: base64Fields,
      });
    }

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
