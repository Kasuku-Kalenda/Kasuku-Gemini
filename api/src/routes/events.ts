/**
 * GET    /api/v1/events              — liste publique (filtrée, paginée)
 * GET    /api/v1/events/calendar     — anniversaires du jour
 * GET    /api/v1/events/all          — liste admin (tous statuts)
 * GET    /api/v1/events/slug/:slug   — détail par slug
 * GET    /api/v1/events/:id          — détail par ID
 * POST   /api/v1/events              — créer [admin]
 * PUT    /api/v1/events/:id          — modifier [admin]
 * DELETE /api/v1/events/:id          — soft delete [admin]
 */

import type { FastifyInstance } from 'fastify';
import sql from '../db';
import { requireAdmin } from '../middleware/auth';
import { parsePagination, paginate } from '../utils/pagination';
import { uniqueSlug } from '../utils/slug';
import { findBase64Fields } from '../utils/validation';

export async function eventsRoutes(app: FastifyInstance) {

  // ── GET / — liste publique ────────────────────────────────────────────────
  app.get('/', async (req, reply) => {
    const q        = req.query as Record<string, string>;
    const pg       = parsePagination(q);
    const search   = q.q?.trim() ?? '';
    const country  = q.country?.trim() ?? '';
    const theme    = q.theme?.trim() ?? '';
    const lang     = q.lang?.trim() ?? '';
    const year     = q.year ? parseInt(q.year, 10) : null;
    const temporal = q.temporal ?? '';

    const [{ count }] = await sql`
      SELECT COUNT(*)::int AS count
      FROM events e
      WHERE e.status = 'published' AND e.deleted_at IS NULL
        AND (${search}   = '' OR e.search_vector @@ plainto_tsquery('french', unaccent(${search})))
        AND (${country}  = '' OR e.primary_country_code = ${country})
        AND (${lang}     = '' OR e.lang = ${lang})
        AND (${temporal} = '' OR e.temporal_type::text = ${temporal})
        AND (${year}::int IS NULL OR EXTRACT(YEAR FROM e.start_date)::int = ${year}::int)
        AND (${theme} = '' OR EXISTS (
          SELECT 1 FROM event_themes et JOIN themes t ON t.id = et.theme_id
          WHERE et.event_id = e.id AND t.slug = ${theme}
        ))
    `;

    const items = await sql`
      SELECT
        e.id, e.slug, e.lang, e.title, e.summary,
        e.temporal_type, e.start_date, e.end_date, e.display_date,
        e.approx_century, e.approx_decade, e.annual_recurrence,
        e.primary_country_code, e.featured, e.featured_position,
        e.reliability, e.contributors, e.published_at, e.created_at,
        p.name AS primary_place_name,
        COALESCE(JSON_AGG(DISTINCT JSONB_BUILD_OBJECT(
          'id', t.id, 'slug', t.slug, 'name', t.name, 'color', t.color
        )) FILTER (WHERE t.id IS NOT NULL), '[]') AS themes
      FROM events e
      LEFT JOIN places p        ON p.id = e.primary_place_id
      LEFT JOIN event_themes et ON et.event_id = e.id
      LEFT JOIN themes t        ON t.id = et.theme_id
      WHERE e.status = 'published' AND e.deleted_at IS NULL
        AND (${search}   = '' OR e.search_vector @@ plainto_tsquery('french', unaccent(${search})))
        AND (${country}  = '' OR e.primary_country_code = ${country})
        AND (${lang}     = '' OR e.lang = ${lang})
        AND (${temporal} = '' OR e.temporal_type::text = ${temporal})
        AND (${year}::int IS NULL OR EXTRACT(YEAR FROM e.start_date)::int = ${year}::int)
        AND (${theme} = '' OR EXISTS (
          SELECT 1 FROM event_themes et2 JOIN themes t2 ON t2.id = et2.theme_id
          WHERE et2.event_id = e.id AND t2.slug = ${theme}
        ))
      GROUP BY e.id, p.name
      ORDER BY e.start_date DESC NULLS LAST
      LIMIT ${pg.limit} OFFSET ${pg.offset}
    `;

    return reply.send(paginate(items, count, pg));
  });

  // ── GET /calendar — anniversaires du jour ─────────────────────────────────
  app.get('/calendar', async (req, reply) => {
    const q     = req.query as Record<string, string>;
    const month = q.month ? parseInt(q.month, 10) : new Date().getMonth() + 1;
    const day   = q.day   ? parseInt(q.day,   10) : new Date().getDate();

    const items = await sql`
      SELECT e.id, e.slug, e.lang, e.title, e.summary,
             e.start_date, e.primary_country_code, e.reliability,
             EXTRACT(YEAR FROM e.start_date)::int AS original_year
      FROM events e
      WHERE e.annual_recurrence = TRUE
        AND e.status = 'published' AND e.deleted_at IS NULL
        AND EXTRACT(MONTH FROM e.start_date)::int = ${month}
        AND EXTRACT(DAY   FROM e.start_date)::int = ${day}
      ORDER BY e.start_date ASC
    `;

    return reply.send({ items, month, day });
  });

  // ── GET /all — liste admin ────────────────────────────────────────────────
  app.get('/all', { preHandler: requireAdmin }, async (req, reply) => {
    const q      = req.query as Record<string, string>;
    const pg     = parsePagination(q);
    const search = q.q?.trim() ?? '';
    const status = q.status?.trim() ?? '';

    const [{ count }] = await sql`
      SELECT COUNT(*)::int AS count FROM events e
      WHERE e.deleted_at IS NULL
        AND (${search} = '' OR e.search_vector @@ plainto_tsquery('french', unaccent(${search})))
        AND (${status} = '' OR e.status::text = ${status})
    `;

    const items = await sql`
      SELECT e.id, e.slug, e.lang, e.title, e.status,
             e.temporal_type, e.start_date, e.reliability,
             e.primary_country_code, e.featured, e.published_at,
             e.created_at, e.updated_at
      FROM events e
      WHERE e.deleted_at IS NULL
        AND (${search} = '' OR e.search_vector @@ plainto_tsquery('french', unaccent(${search})))
        AND (${status} = '' OR e.status::text = ${status})
      ORDER BY e.updated_at DESC
      LIMIT ${pg.limit} OFFSET ${pg.offset}
    `;

    return reply.send(paginate(items, count, pg));
  });

  // ── GET /slug/:slug — détail par slug ─────────────────────────────────────
  app.get('/slug/:slug', async (req: any, reply) => {
    const [event] = await sql`
      SELECT e.*,
        p.name AS primary_place_name,
        COALESCE(JSON_AGG(DISTINCT JSONB_BUILD_OBJECT(
          'id', t.id, 'slug', t.slug, 'name', t.name, 'color', t.color
        )) FILTER (WHERE t.id IS NOT NULL), '[]') AS themes,
        COALESCE(JSON_AGG(DISTINCT JSONB_BUILD_OBJECT(
          'id', pe.id, 'slug', pe.slug, 'name', pe.name, 'photoUrl', pe.photo_url, 'role', ep.role
        )) FILTER (WHERE pe.id IS NOT NULL), '[]') AS people,
        COALESCE(JSON_AGG(DISTINCT JSONB_BUILD_OBJECT(
          'id', m.id, 'slug', m.slug, 'title', m.title, 'level', m.level
        )) FILTER (WHERE m.id IS NOT NULL), '[]') AS modules
      FROM events e
      LEFT JOIN places       p  ON p.id  = e.primary_place_id
      LEFT JOIN event_themes et ON et.event_id = e.id
      LEFT JOIN themes       t  ON t.id  = et.theme_id
      LEFT JOIN event_people ep ON ep.event_id = e.id
      LEFT JOIN people       pe ON pe.id = ep.person_id
      LEFT JOIN event_modules em ON em.event_id = e.id
      LEFT JOIN modules       m  ON m.id = em.module_id AND m.status = 'published'
      WHERE e.slug = ${req.params.slug}
        AND e.status = 'published' AND e.deleted_at IS NULL
      GROUP BY e.id, p.name
    `;

    if (!event) return reply.status(404).send({ error: 'Événement introuvable' });
    return reply.send(event);
  });

  // ── GET /:id — détail par ID ──────────────────────────────────────────────
  app.get('/:id', async (req: any, reply) => {
    const [event] = await sql`
      SELECT e.*, p.name AS primary_place_name
      FROM events e
      LEFT JOIN places p ON p.id = e.primary_place_id
      WHERE e.id = ${req.params.id} AND e.deleted_at IS NULL
    `;
    if (!event) return reply.status(404).send({ error: 'Événement introuvable' });
    return reply.send(event);
  });

  // ── POST / — créer ────────────────────────────────────────────────────────
  app.post('/', { preHandler: requireAdmin }, async (req, reply) => {
    const body = req.body as Record<string, any>;
    const b64  = findBase64Fields(body);
    if (b64.length > 0) {
      return reply.status(400).send({ error: `Données base64 non autorisées : ${b64.join(', ')}` });
    }

    const slug = await uniqueSlug('events', String(body.title ?? ''));

    const [event] = await sql`
      INSERT INTO events (
        slug, lang, title, summary, content, contributors,
        temporal_type, start_date, end_date, display_date,
        approx_century, approx_decade, annual_recurrence,
        primary_country_code, primary_place_id,
        featured, featured_position,
        reliability, source_label, source_url,
        status, created_by, updated_by
      ) VALUES (
        ${slug}, ${body.lang ?? 'fr'}, ${body.title},
        ${body.summary ?? null}, ${body.content ?? null},
        ${JSON.stringify(body.contributors ?? [])},
        ${body.temporalType ?? 'exact_date'},
        ${body.startDate ?? null}, ${body.endDate ?? null}, ${body.displayDate ?? null},
        ${body.approxCentury ?? null}, ${body.approxDecade ?? null},
        ${body.annualRecurrence ?? false},
        ${body.primaryCountryCode ?? null}, ${body.primaryPlaceId ?? null},
        ${body.featured ?? false}, ${body.featuredPosition ?? null},
        ${body.reliability ?? 'confirmed'},
        ${body.sourceLabel ?? null}, ${body.sourceUrl ?? null},
        ${body.status ?? 'draft'},
        ${req.authUser!.id}, ${req.authUser!.id}
      )
      RETURNING *
    `;

    if (Array.isArray(body.themeIds) && body.themeIds.length > 0) {
      await sql`
        INSERT INTO event_themes (event_id, theme_id)
        SELECT ${event.id}, UNNEST(${body.themeIds}::uuid[])
        ON CONFLICT DO NOTHING
      `;
    }

    return reply.status(201).send(event);
  });

  // ── PUT /:id — modifier ───────────────────────────────────────────────────
  app.put('/:id', { preHandler: requireAdmin }, async (req: any, reply) => {
    const body = req.body as Record<string, any>;
    const { id } = req.params;

    const b64 = findBase64Fields(body);
    if (b64.length > 0) {
      return reply.status(400).send({ error: `Données base64 non autorisées : ${b64.join(', ')}` });
    }

    const [existing] = await sql`SELECT id, slug FROM events WHERE id = ${id} AND deleted_at IS NULL`;
    if (!existing) return reply.status(404).send({ error: 'Événement introuvable' });

    const slug = body.title
      ? await uniqueSlug('events', String(body.title), id)
      : existing.slug;

    const [event] = await sql`
      UPDATE events SET
        slug                 = ${slug},
        lang                 = ${body.lang ?? 'fr'},
        title                = ${body.title},
        summary              = ${body.summary ?? null},
        content              = ${body.content ?? null},
        contributors         = ${JSON.stringify(body.contributors ?? [])},
        temporal_type        = ${body.temporalType ?? 'exact_date'},
        start_date           = ${body.startDate ?? null},
        end_date             = ${body.endDate ?? null},
        display_date         = ${body.displayDate ?? null},
        approx_century       = ${body.approxCentury ?? null},
        approx_decade        = ${body.approxDecade ?? null},
        annual_recurrence    = ${body.annualRecurrence ?? false},
        primary_country_code = ${body.primaryCountryCode ?? null},
        primary_place_id     = ${body.primaryPlaceId ?? null},
        featured             = ${body.featured ?? false},
        featured_position    = ${body.featuredPosition ?? null},
        reliability          = ${body.reliability ?? 'confirmed'},
        source_label         = ${body.sourceLabel ?? null},
        source_url           = ${body.sourceUrl ?? null},
        status               = ${body.status ?? 'draft'},
        updated_by           = ${req.authUser!.id}
      WHERE id = ${id}
      RETURNING *
    `;

    if (Array.isArray(body.themeIds)) {
      await sql`DELETE FROM event_themes WHERE event_id = ${id}`;
      if (body.themeIds.length > 0) {
        await sql`
          INSERT INTO event_themes (event_id, theme_id)
          SELECT ${id}, UNNEST(${body.themeIds}::uuid[])
          ON CONFLICT DO NOTHING
        `;
      }
    }

    return reply.send(event);
  });

  // ── DELETE /:id — soft delete ─────────────────────────────────────────────
  app.delete('/:id', { preHandler: requireAdmin }, async (req: any, reply) => {
    const [event] = await sql`
      UPDATE events
      SET deleted_at = now(), updated_by = ${req.authUser!.id}
      WHERE id = ${req.params.id} AND deleted_at IS NULL
      RETURNING id
    `;
    if (!event) return reply.status(404).send({ error: 'Événement introuvable' });
    return reply.send({ success: true });
  });
}
