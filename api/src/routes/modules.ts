/**
 * GET    /api/v1/modules           — liste publique paginée
 * GET    /api/v1/modules/all       — liste admin
 * GET    /api/v1/modules/slug/:slug — détail par slug
 * GET    /api/v1/modules/:id       — détail par ID
 * POST   /api/v1/modules           — créer [admin]
 * PUT    /api/v1/modules/:id       — modifier [admin]
 * DELETE /api/v1/modules/:id       — soft delete [admin]
 */

import type { FastifyInstance } from 'fastify';
import sql from '../db';
import { requireAdmin } from '../middleware/auth';
import { parsePagination, paginate } from '../utils/pagination';
import { uniqueSlug } from '../utils/slug';
import { findBase64Fields } from '../utils/validation';

export async function modulesRoutes(app: FastifyInstance) {

  // ── GET / — liste publique ────────────────────────────────────────────────
  app.get('/', async (req, reply) => {
    const q      = req.query as Record<string, string>;
    const pg     = parsePagination(q);
    const search = q.q?.trim() ?? '';
    const lang   = q.lang?.trim() ?? '';
    const level  = q.level?.trim() ?? '';

    const [{ count }] = await sql`
      SELECT COUNT(*)::int AS count FROM modules m
      WHERE m.status = 'published' AND m.deleted_at IS NULL
        AND (${search} = '' OR m.search_vector @@ plainto_tsquery('french', unaccent(${search})))
        AND (${lang}  = '' OR m.lang = ${lang})
        AND (${level} = '' OR m.level = ${level})
    `;

    const items = await sql`
      SELECT m.id, m.slug, m.lang, m.title, m.summary, m.thumbnail_url,
             m.duration_minutes, m.level, m.contributors, m.published_at, m.created_at,
             COALESCE(JSON_AGG(DISTINCT JSONB_BUILD_OBJECT(
               'id', t.id, 'slug', t.slug, 'name', t.name, 'color', t.color
             )) FILTER (WHERE t.id IS NOT NULL), '[]') AS themes
      FROM modules m
      LEFT JOIN module_themes mt ON mt.module_id = m.id
      LEFT JOIN themes t         ON t.id = mt.theme_id
      WHERE m.status = 'published' AND m.deleted_at IS NULL
        AND (${search} = '' OR m.search_vector @@ plainto_tsquery('french', unaccent(${search})))
        AND (${lang}  = '' OR m.lang = ${lang})
        AND (${level} = '' OR m.level = ${level})
      GROUP BY m.id
      ORDER BY m.published_at DESC NULLS LAST
      LIMIT ${pg.limit} OFFSET ${pg.offset}
    `;

    return reply.send(paginate(items, count, pg));
  });

  // ── GET /all — liste admin ────────────────────────────────────────────────
  app.get('/all', { preHandler: requireAdmin }, async (req, reply) => {
    const q      = req.query as Record<string, string>;
    const pg     = parsePagination(q);
    const search = q.q?.trim() ?? '';
    const status = q.status?.trim() ?? '';

    const [{ count }] = await sql`
      SELECT COUNT(*)::int AS count FROM modules m
      WHERE m.deleted_at IS NULL
        AND (${search} = '' OR m.search_vector @@ plainto_tsquery('french', unaccent(${search})))
        AND (${status} = '' OR m.status::text = ${status})
    `;

    const items = await sql`
      SELECT m.id, m.slug, m.lang, m.title, m.status, m.level,
             m.duration_minutes, m.published_at, m.created_at, m.updated_at
      FROM modules m
      WHERE m.deleted_at IS NULL
        AND (${search} = '' OR m.search_vector @@ plainto_tsquery('french', unaccent(${search})))
        AND (${status} = '' OR m.status::text = ${status})
      ORDER BY m.updated_at DESC
      LIMIT ${pg.limit} OFFSET ${pg.offset}
    `;

    return reply.send(paginate(items, count, pg));
  });

  // ── GET /slug/:slug ───────────────────────────────────────────────────────
  app.get('/slug/:slug', async (req: any, reply) => {
    const [module] = await sql`
      SELECT m.*, COALESCE(JSON_AGG(DISTINCT JSONB_BUILD_OBJECT(
        'id', t.id, 'slug', t.slug, 'name', t.name, 'color', t.color
      )) FILTER (WHERE t.id IS NOT NULL), '[]') AS themes
      FROM modules m
      LEFT JOIN module_themes mt ON mt.module_id = m.id
      LEFT JOIN themes t         ON t.id = mt.theme_id
      WHERE m.slug = ${req.params.slug}
        AND m.status = 'published' AND m.deleted_at IS NULL
      GROUP BY m.id
    `;
    if (!module) return reply.status(404).send({ error: 'Module introuvable' });
    return reply.send(module);
  });

  // ── GET /:id ──────────────────────────────────────────────────────────────
  app.get('/:id', async (req: any, reply) => {
    const [module] = await sql`SELECT * FROM modules WHERE id = ${req.params.id} AND deleted_at IS NULL`;
    if (!module) return reply.status(404).send({ error: 'Module introuvable' });
    return reply.send(module);
  });

  // ── POST / — créer ────────────────────────────────────────────────────────
  app.post('/', { preHandler: requireAdmin }, async (req, reply) => {
    const body = req.body as Record<string, any>;
    const b64  = findBase64Fields(body);
    if (b64.length > 0) {
      return reply.status(400).send({ error: `Données base64 non autorisées : ${b64.join(', ')}` });
    }

    const slug = await uniqueSlug('modules', String(body.title ?? ''));

    const [module] = await sql`
      INSERT INTO modules (slug, lang, title, summary, thumbnail_url, duration_minutes, level, content, contributors, status, created_by, updated_by)
      VALUES (
        ${slug}, ${body.lang ?? 'fr'}, ${body.title},
        ${body.summary ?? null}, ${body.thumbnailUrl ?? null},
        ${body.durationMinutes ?? null}, ${body.level ?? null},
        ${JSON.stringify(body.content ?? [])},
        ${JSON.stringify(body.contributors ?? [])},
        ${body.status ?? 'draft'},
        ${req.authUser!.id}, ${req.authUser!.id}
      )
      RETURNING *
    `;

    if (Array.isArray(body.themeIds) && body.themeIds.length > 0) {
      await sql`
        INSERT INTO module_themes (module_id, theme_id)
        SELECT ${module.id}, UNNEST(${body.themeIds}::uuid[])
        ON CONFLICT DO NOTHING
      `;
    }

    return reply.status(201).send(module);
  });

  // ── PUT /:id — modifier ───────────────────────────────────────────────────
  app.put('/:id', { preHandler: requireAdmin }, async (req: any, reply) => {
    const body = req.body as Record<string, any>;
    const { id } = req.params;

    const b64 = findBase64Fields(body);
    if (b64.length > 0) {
      return reply.status(400).send({ error: `Données base64 non autorisées : ${b64.join(', ')}` });
    }

    const [existing] = await sql`SELECT id FROM modules WHERE id = ${id} AND deleted_at IS NULL`;
    if (!existing) return reply.status(404).send({ error: 'Module introuvable' });

    const slug = body.title ? await uniqueSlug('modules', String(body.title), id) : undefined;

    const [module] = await sql`
      UPDATE modules SET
        ${slug ? sql`slug = ${slug},` : sql``}
        lang             = ${body.lang ?? 'fr'},
        title            = ${body.title},
        summary          = ${body.summary ?? null},
        thumbnail_url    = ${body.thumbnailUrl ?? null},
        duration_minutes = ${body.durationMinutes ?? null},
        level            = ${body.level ?? null},
        content          = ${JSON.stringify(body.content ?? [])},
        contributors     = ${JSON.stringify(body.contributors ?? [])},
        status           = ${body.status ?? 'draft'},
        updated_by       = ${req.authUser!.id}
      WHERE id = ${id}
      RETURNING *
    `;

    if (Array.isArray(body.themeIds)) {
      await sql`DELETE FROM module_themes WHERE module_id = ${id}`;
      if (body.themeIds.length > 0) {
        await sql`
          INSERT INTO module_themes (module_id, theme_id)
          SELECT ${id}, UNNEST(${body.themeIds}::uuid[])
          ON CONFLICT DO NOTHING
        `;
      }
    }

    return reply.send(module);
  });

  // ── DELETE /:id — soft delete ─────────────────────────────────────────────
  app.delete('/:id', { preHandler: requireAdmin }, async (req: any, reply) => {
    const [m] = await sql`
      UPDATE modules SET deleted_at = now(), updated_by = ${req.authUser!.id}
      WHERE id = ${req.params.id} AND deleted_at IS NULL
      RETURNING id
    `;
    if (!m) return reply.status(404).send({ error: 'Module introuvable' });
    return reply.send({ success: true });
  });
}
