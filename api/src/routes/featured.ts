/**
 * GET    /api/v1/featured/all  — liste des éléments "À la une" [admin]
 * GET    /api/v1/featured/:id  — détail
 * POST   /api/v1/featured      — marquer un événement comme "À la une" [admin]
 * PUT    /api/v1/featured/:id  — modifier la position / activer [admin]
 * DELETE /api/v1/featured/:id  — retirer de "À la une" [admin]
 *
 * Note : "À la une" = events WHERE featured = true.
 * Pas de table séparée — on s'appuie sur les colonnes featured / featured_position
 * de la table events.
 */

import type { FastifyInstance } from 'fastify';
import sql from '../db';
import { requireAdmin } from '../middleware/auth';

export async function featuredRoutes(app: FastifyInstance) {

  // ── GET /all — liste admin ────────────────────────────────────────────────
  app.get('/all', { preHandler: requireAdmin }, async (_req, reply) => {
    const items = await sql`
      SELECT
        e.id,
        e.title,
        COALESCE(e.summary, '') AS subtitle,
        e.slug,
        e.featured_position     AS "order",
        e.featured              AS active,
        e.start_date            AS "startDate",
        e.end_date              AS "endDate",
        e.id                    AS "eventId",
        COALESCE(
          (SELECT m.url FROM event_media em
           JOIN media m ON m.id = em.media_id
           WHERE em.event_id = e.id AND em.is_cover = true
           LIMIT 1),
          ''
        )                       AS "imageUrl",
        'En savoir plus'        AS "ctaLabel",
        '/events/' || e.slug    AS "ctaTo"
      FROM events e
      WHERE e.featured = true AND e.deleted_at IS NULL
      ORDER BY COALESCE(e.featured_position, 999) ASC, e.title ASC
    `;
    return reply.send({ items });
  });

  // ── GET /:id ──────────────────────────────────────────────────────────────
  app.get('/:id', { preHandler: requireAdmin }, async (req: any, reply) => {
    const [event] = await sql`
      SELECT id, title, summary AS subtitle, slug,
             featured_position AS "order", featured AS active,
             start_date AS "startDate", end_date AS "endDate"
      FROM events WHERE id = ${req.params.id} AND deleted_at IS NULL
    `;
    if (!event) return reply.status(404).send({ error: 'Introuvable' });
    return reply.send({ ...event, eventId: event.id, ctaLabel: 'En savoir plus', ctaTo: `/events/${event.slug}`, imageUrl: '' });
  });

  // ── POST / — mettre un événement À la une ─────────────────────────────────
  app.post('/', { preHandler: requireAdmin }, async (req: any, reply) => {
    const { eventId, order = 0 } = req.body as { eventId: string; order?: number };
    if (!eventId) return reply.status(400).send({ error: 'eventId requis' });

    const [updated] = await sql`
      UPDATE events
      SET featured = true, featured_position = ${order}
      WHERE id = ${eventId} AND deleted_at IS NULL
      RETURNING id, title, featured_position AS "order", featured AS active
    `;
    if (!updated) return reply.status(404).send({ error: 'Événement introuvable' });
    return reply.status(201).send(updated);
  });

  // ── PUT /:id — modifier position / activer ────────────────────────────────
  app.put('/:id', { preHandler: requireAdmin }, async (req: any, reply) => {
    const body = req.body as Record<string, any>;

    const [updated] = await sql`
      UPDATE events
      SET
        featured          = ${body.active          ?? true},
        featured_position = ${body.order           ?? body.featuredPosition ?? null}
      WHERE id = ${req.params.id} AND deleted_at IS NULL
      RETURNING id, title, featured_position AS "order", featured AS active
    `;
    if (!updated) return reply.status(404).send({ error: 'Introuvable' });
    return reply.send(updated);
  });

  // ── DELETE /:id — retirer de "À la une" ───────────────────────────────────
  app.delete('/:id', { preHandler: requireAdmin }, async (req: any, reply) => {
    await sql`
      UPDATE events
      SET featured = false, featured_position = NULL
      WHERE id = ${req.params.id}
    `;
    return reply.status(204).send();
  });
}
