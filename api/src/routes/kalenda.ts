/**
 * GET    /api/v1/kalendas/all   — liste admin
 * GET    /api/v1/kalendas/:id   — détail
 * POST   /api/v1/kalendas       — créer [admin]
 * PUT    /api/v1/kalendas/:id   — modifier [admin]
 * DELETE /api/v1/kalendas/:id   — supprimer [admin]
 */

import type { FastifyInstance } from 'fastify';
import sql from '../db';
import { requireAdmin } from '../middleware/auth';
import { uniqueSlug } from '../utils/slug';

export async function kalendaRoutes(app: FastifyInstance) {

  // ── GET /all ──────────────────────────────────────────────────────────────
  app.get('/all', { preHandler: requireAdmin }, async (_req, reply) => {
    const items = await sql`
      SELECT k.*,
        COUNT(DISTINCT ke.event_id)::int  AS event_count,
        COUNT(DISTINCT ks.story_id)::int  AS story_count,
        COUNT(DISTINCT km.module_id)::int AS module_count,
        COUNT(DISTINCT kt.theme_id)::int  AS theme_count
      FROM kalendas k
      LEFT JOIN kalenda_events  ke ON ke.kalenda_id = k.id
      LEFT JOIN kalenda_stories ks ON ks.kalenda_id = k.id
      LEFT JOIN kalenda_modules km ON km.kalenda_id = k.id
      LEFT JOIN kalenda_themes  kt ON kt.kalenda_id = k.id
      GROUP BY k.id
      ORDER BY k.updated_at DESC
    `;
    return reply.send({ items });
  });

  // ── GET /:id ──────────────────────────────────────────────────────────────
  app.get('/:id', { preHandler: requireAdmin }, async (req: any, reply) => {
    const [kalenda] = await sql`SELECT * FROM kalendas WHERE id = ${req.params.id}`;
    if (!kalenda) return reply.status(404).send({ error: 'Kalenda introuvable' });

    const [eventIds, storyIds, moduleIds, themeIds] = await Promise.all([
      sql`SELECT event_id  AS id FROM kalenda_events  WHERE kalenda_id = ${req.params.id}`,
      sql`SELECT story_id  AS id FROM kalenda_stories WHERE kalenda_id = ${req.params.id}`,
      sql`SELECT module_id AS id FROM kalenda_modules WHERE kalenda_id = ${req.params.id}`,
      sql`SELECT theme_id  AS id FROM kalenda_themes  WHERE kalenda_id = ${req.params.id}`,
    ]);

    return reply.send({
      ...kalenda,
      eventIds:  eventIds.map((r: any)  => r.id),
      storyIds:  storyIds.map((r: any)  => r.id),
      moduleIds: moduleIds.map((r: any) => r.id),
      themeIds:  themeIds.map((r: any)  => r.id),
    });
  });

  // ── POST / — créer ────────────────────────────────────────────────────────
  app.post('/', { preHandler: requireAdmin }, async (req, reply) => {
    const body = req.body as Record<string, any>;
    const slug = await uniqueSlug('kalendas', String(body.name ?? ''));

    const [kalenda] = await sql`
      INSERT INTO kalendas (slug, name, description, version, region, cover_url, target_lang, status, created_by, updated_by)
      VALUES (
        ${slug}, ${body.name}, ${body.description ?? null},
        ${body.version ?? '1.0.0'}, ${body.region ?? null},
        ${body.coverUrl ?? null}, ${body.targetLang ?? null},
        ${body.status ?? 'draft'},
        ${req.authUser!.id}, ${req.authUser!.id}
      )
      RETURNING *
    `;

    await syncKalendaContent(kalenda.id, body);
    return reply.status(201).send(kalenda);
  });

  // ── PUT /:id — modifier ───────────────────────────────────────────────────
  app.put('/:id', { preHandler: requireAdmin }, async (req: any, reply) => {
    const body = req.body as Record<string, any>;
    const { id } = req.params;

    const [kalenda] = await sql`
      UPDATE kalendas SET
        name        = ${body.name},
        description = ${body.description ?? null},
        version     = ${body.version ?? '1.0.0'},
        region      = ${body.region ?? null},
        cover_url   = ${body.coverUrl ?? null},
        target_lang = ${body.targetLang ?? null},
        status      = ${body.status ?? 'draft'},
        updated_by  = ${req.authUser!.id}
      WHERE id = ${id}
      RETURNING *
    `;
    if (!kalenda) return reply.status(404).send({ error: 'Kalenda introuvable' });

    await syncKalendaContent(id, body);
    return reply.send(kalenda);
  });

  // ── DELETE /:id ───────────────────────────────────────────────────────────
  app.delete('/:id', { preHandler: requireAdmin }, async (req: any, reply) => {
    const [deleted] = await sql`DELETE FROM kalendas WHERE id = ${req.params.id} RETURNING id`;
    if (!deleted) return reply.status(404).send({ error: 'Kalenda introuvable' });
    return reply.send({ success: true });
  });
}

// ── Helper : synchronise les pivots de contenu d'un Kalenda ──────────────────
async function syncKalendaContent(id: string, body: Record<string, any>) {
  if (Array.isArray(body.eventIds)) {
    await sql`DELETE FROM kalenda_events WHERE kalenda_id = ${id}`;
    if (body.eventIds.length > 0) {
      await sql`INSERT INTO kalenda_events (kalenda_id, event_id) SELECT ${id}, UNNEST(${body.eventIds}::uuid[]) ON CONFLICT DO NOTHING`;
    }
  }
  if (Array.isArray(body.storyIds)) {
    await sql`DELETE FROM kalenda_stories WHERE kalenda_id = ${id}`;
    if (body.storyIds.length > 0) {
      await sql`INSERT INTO kalenda_stories (kalenda_id, story_id) SELECT ${id}, UNNEST(${body.storyIds}::uuid[]) ON CONFLICT DO NOTHING`;
    }
  }
  if (Array.isArray(body.moduleIds)) {
    await sql`DELETE FROM kalenda_modules WHERE kalenda_id = ${id}`;
    if (body.moduleIds.length > 0) {
      await sql`INSERT INTO kalenda_modules (kalenda_id, module_id) SELECT ${id}, UNNEST(${body.moduleIds}::uuid[]) ON CONFLICT DO NOTHING`;
    }
  }
  if (Array.isArray(body.themeIds)) {
    await sql`DELETE FROM kalenda_themes WHERE kalenda_id = ${id}`;
    if (body.themeIds.length > 0) {
      await sql`INSERT INTO kalenda_themes (kalenda_id, theme_id) SELECT ${id}, UNNEST(${body.themeIds}::uuid[]) ON CONFLICT DO NOTHING`;
    }
  }
}
