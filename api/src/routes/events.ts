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
import type { RedisClientType } from 'redis';
import { Event, Timeline } from '../models';
import { requireAdmin } from '../middleware/auth';
import slugify from 'slugify';
import { findBase64Fields } from '../utils/validation';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(title: string) {
  return slugify(title, { lower: true, strict: true, locale: 'fr' });
}

type TimelineInfo = { slug: string; title: string; thumbnail?: string };
type TimelineMap = { byId: Record<string, TimelineInfo>; byEventId: Record<string, TimelineInfo> };

const TIMELINE_MAP_TTL = 60; // secondes
const TIMELINE_MAP_KEY = 'kasuku:timeline_map';

/**
 * Charge la map timeline depuis Redis ou MongoDB.
 * TTL 60 s — invalidée automatiquement. En cas d'erreur Redis,
 * on tombe silencieusement sur MongoDB.
 */
async function getTimelineMap(redis: RedisClientType): Promise<TimelineMap> {
  // Tentative cache Redis
  try {
    const cached = await redis.get(TIMELINE_MAP_KEY);
    if (cached) return JSON.parse(cached) as TimelineMap;
  } catch { /* Redis indisponible — continue sans cache */ }

  // Chargement MongoDB
  const timelines = await Timeline
    .find({})
    .select('_id slug title thumbnail moments')
    .lean();

  const byId: Record<string, TimelineInfo> = {};
  const byEventId: Record<string, TimelineInfo> = {};

  timelines.forEach(t => {
    const info: TimelineInfo = { slug: t.slug, title: t.title, thumbnail: (t as any).thumbnail };
    byId[t._id.toString()] = info;
    ((t as any).moments ?? []).forEach((m: any) => {
      if (m.eventId) byEventId[String(m.eventId)] = info;
    });
  });

  const map: TimelineMap = { byId, byEventId };

  // Mise en cache Redis
  try {
    await redis.set(TIMELINE_MAP_KEY, JSON.stringify(map), { EX: TIMELINE_MAP_TTL });
  } catch { /* ignoré */ }

  return map;
}

/**
 * Résolution bidirectionnelle des associations timeline ↔ événement.
 * Utilise un cache Redis (TTL 60 s) pour éviter les requêtes MongoDB
 * répétées sur chaque appel GET /events.
 */
async function resolveTimelineSlugs<T extends { id?: unknown; timelineId?: unknown; timelineSlug?: unknown }>(
  events: T[],
  redis: RedisClientType,
): Promise<T[]> {
  if (events.length === 0) return events;

  const { byId, byEventId } = await getTimelineMap(redis);

  return events.map(e => {
    if (e.timelineSlug) return e;

    if (e.timelineId) {
      const info = byId[e.timelineId as string];
      if (info) return { ...e, timelineSlug: info.slug, timelineTitle: info.title, timelineThumbnail: info.thumbnail };
    }

    const info = byEventId[e.id as string];
    if (info) return { ...e, timelineSlug: info.slug, timelineTitle: info.title, timelineThumbnail: info.thumbnail };

    return e;
  });
}

/** Détecte récursivement les data URLs base64 dans un objet/tableau */
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
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
      if (!match) {
        return reply.status(400).send({ error: 'Format date invalide. Utilisez YYYY-MM-DD.' });
      }
      const [, , month, day] = match;
      const monthNum = parseInt(month, 10);
      const dayNum = parseInt(day, 10);
      if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
        return reply.status(400).send({ error: 'Date invalide.' });
      }
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
    const items  = await resolveTimelineSlugs(mapped, app.redis);

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
    const [resolved] = await resolveTimelineSlugs([{ ...event, id: event._id.toString() }], app.redis);
    return reply.send(resolved);
  });

  // GET /events/:id
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const event = await Event.findById(req.params.id).lean();
    if (!event) return reply.status(404).send({ error: 'Événement introuvable' });
    const [resolved] = await resolveTimelineSlugs([{ ...event, id: event._id.toString() }], app.redis);
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
