/**
 * /api/v1/timelines — Récits (Stories)
 * Nom de route maintenu pour compatibilité avec le frontend existant.
 *
 * GET  /timelines           — liste publique paginée
 * GET  /timelines/all       — liste admin
 * GET  /timelines/slug/:slug — détail par slug
 * GET  /timelines/:id       — détail par ID
 * POST /timelines           — créer [admin]
 * PUT  /timelines/:id       — modifier [admin]
 * DELETE /timelines/:id     — soft delete [admin]
 */

import type { FastifyInstance } from 'fastify';
import sql from '../db';
import { requireAdmin } from '../middleware/auth';
import { parsePagination, paginate } from '../utils/pagination';
import { uniqueSlug } from '../utils/slug';
import { findBase64Fields } from '../utils/validation';

export async function timelinesRoutes(app: FastifyInstance) {

  // ── GET / — liste publique ────────────────────────────────────────────────
  app.get('/', async (req, reply) => {
    const q      = req.query as Record<string, string>;
    const pg     = parsePagination(q);
    const search = q.q?.trim() ?? '';
    const lang   = q.lang?.trim() ?? '';

    const [{ count }] = await sql`
      SELECT COUNT(*)::int AS count FROM stories s
      WHERE s.status = 'published' AND s.deleted_at IS NULL
        AND (${search} = '' OR s.search_vector @@ plainto_tsquery('french', unaccent(${search})))
        AND (${lang}   = '' OR s.lang = ${lang})
    `;

    const items = await sql`
      SELECT s.id, s.slug, s.lang, s.title, s.summary, s.cover_url,
             s.contributors, s.computed_start_date, s.computed_end_date,
             s.published_at, s.created_at,
             COUNT(se.event_id)::int AS moment_count
      FROM stories s
      LEFT JOIN story_events se ON se.story_id = s.id
      WHERE s.status = 'published' AND s.deleted_at IS NULL
        AND (${search} = '' OR s.search_vector @@ plainto_tsquery('french', unaccent(${search})))
        AND (${lang}   = '' OR s.lang = ${lang})
      GROUP BY s.id
      ORDER BY s.computed_start_date DESC NULLS LAST
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
      SELECT COUNT(*)::int AS count FROM stories s
      WHERE s.deleted_at IS NULL
        AND (${search} = '' OR s.search_vector @@ plainto_tsquery('french', unaccent(${search})))
        AND (${status} = '' OR s.status::text = ${status})
    `;

    const items = await sql`
      SELECT s.id, s.slug, s.lang, s.title, s.type, s.status, s.cover_url,
             s.computed_start_date, s.computed_end_date,
             s.published_at, s.created_at, s.updated_at,
             COUNT(se.event_id)::int AS moment_count
      FROM stories s
      LEFT JOIN story_events se ON se.story_id = s.id
      WHERE s.deleted_at IS NULL
        AND (${search} = '' OR s.search_vector @@ plainto_tsquery('french', unaccent(${search})))
        AND (${status} = '' OR s.status::text = ${status})
      GROUP BY s.id
      ORDER BY s.updated_at DESC
      LIMIT ${pg.limit} OFFSET ${pg.offset}
    `;

    return reply.send(paginate(items, count, pg));
  });

  // ── GET /slug/:slug — détail par slug ─────────────────────────────────────
  app.get('/slug/:slug', async (req: any, reply) => {
    const [story] = await sql`
      SELECT s.*,
        COALESCE(JSON_AGG(
          JSONB_BUILD_OBJECT(
            'id',                 e.id,
            'slug',               e.slug,
            'title',              e.title,
            'summary',            e.summary,
            'narrative',          COALESCE(se.narrative_text, e.summary, ''),
            'timeType',           CASE WHEN e.start_date IS NOT NULL THEN 'date' ELSE 'period' END,
            'dateExact',          TO_CHAR(e.start_date, 'YYYY-MM-DD'),
            'periodText',         e.display_date,
            'primaryCountryCode', e.primary_country_code,
            'position',           se.position,
            'narrativeAudioUrl',  se.narrative_audio_url,
            'narrativeVideoUrl',  se.narrative_video_url,
            'quote',              se.quote,
            'quoteAuthor',        se.quote_author,
            'cta',                se.cta
          ) ORDER BY se.position ASC
        ) FILTER (WHERE e.id IS NOT NULL), '[]') AS moments
      FROM stories s
      LEFT JOIN story_events se ON se.story_id = s.id
      LEFT JOIN events e        ON e.id = se.event_id AND e.status = 'published'
      WHERE s.slug = ${req.params.slug}
        AND s.status = 'published' AND s.deleted_at IS NULL
      GROUP BY s.id
    `;

    if (!story) return reply.status(404).send({ error: 'Récit introuvable' });
    return reply.send(story);
  });

  // ── GET /:id — détail par ID (admin, inclut les moments) ─────────────────
  app.get('/:id', async (req: any, reply) => {
    const [story] = await sql`
      SELECT s.*,
        COALESCE(JSON_AGG(
          JSONB_BUILD_OBJECT(
            'id',                 se.id,
            'eventId',            se.event_id,
            'position',           se.position,
            'title',              e.title,
            'narrativeText',      se.narrative_text,
            'narrativeAudioUrl',  se.narrative_audio_url,
            'narrativeVideoUrl',  se.narrative_video_url,
            'quote',              se.quote,
            'quoteAuthor',        se.quote_author,
            'cta',                se.cta,
            'sourceStoryEventId', se.source_story_event_id,
            'dateExact',          TO_CHAR(e.start_date, 'YYYY-MM-DD'),
            'periodText',         e.display_date,
            'media',              COALESCE((
              SELECT JSON_AGG(JSONB_BUILD_OBJECT('type', sub.type, 'url', sub.url, 'caption', sub.alt_text))
              FROM (
                SELECT m.type, m.url, m.alt_text
                FROM event_media em JOIN media m ON m.id = em.media_id
                WHERE em.event_id = e.id
                ORDER BY em.position
                LIMIT 1
              ) sub
            ), '[]'::json)
          ) ORDER BY se.position ASC
        ) FILTER (WHERE se.id IS NOT NULL), '[]') AS moments
      FROM stories s
      LEFT JOIN story_events se ON se.story_id = s.id
      LEFT JOIN events e        ON e.id = se.event_id
      WHERE s.id = ${req.params.id} AND s.deleted_at IS NULL
      GROUP BY s.id
    `;
    if (!story) return reply.status(404).send({ error: 'Récit introuvable' });
    return reply.send(story);
  });

  // ── POST / — créer ────────────────────────────────────────────────────────
  app.post('/', { preHandler: requireAdmin }, async (req, reply) => {
    const body = req.body as Record<string, any>;
    const b64  = findBase64Fields(body);
    if (b64.length > 0) {
      return reply.status(400).send({ error: `Données base64 non autorisées : ${b64.join(', ')}` });
    }

    const slug = await uniqueSlug('stories', String(body.title ?? ''));

    const [story] = await sql`
      INSERT INTO stories (slug, lang, title, summary, cover_url, contributors, type, status, created_by, updated_by)
      VALUES (
        ${slug}, ${body.lang ?? 'fr'}, ${body.title},
        ${body.summary ?? null}, ${body.coverUrl ?? null},
        ${JSON.stringify(body.contributors ?? [])},
        ${body.type ?? 'evenement'},
        ${body.status ?? 'draft'},
        ${req.authUser!.id}, ${req.authUser!.id}
      )
      RETURNING *
    `;

    // Moments (story_events)
    if (Array.isArray(body.moments) && body.moments.length > 0) {
      for (const [i, m] of body.moments.entries()) {
        if (!m.eventId) continue;
        await sql`
          INSERT INTO story_events (
            story_id, event_id, position,
            narrative_text, narrative_audio_url, narrative_video_url,
            quote, quote_author, cta, source_story_event_id
          ) VALUES (
            ${story.id}, ${m.eventId}, ${m.position ?? i},
            ${m.narrativeText ?? null}, ${m.narrativeAudioUrl ?? null}, ${m.narrativeVideoUrl ?? null},
            ${m.quote ?? null}, ${m.quoteAuthor ?? null},
            ${m.cta ? JSON.stringify(m.cta) : null},
            ${m.sourceStoryEventId ?? null}
          )
          ON CONFLICT (story_id, event_id) DO NOTHING
        `;
      }
    }

    return reply.status(201).send(story);
  });

  // ── PUT /:id — modifier ───────────────────────────────────────────────────
  app.put('/:id', { preHandler: requireAdmin }, async (req: any, reply) => {
    const body = req.body as Record<string, any>;
    const { id } = req.params;

    const b64 = findBase64Fields(body);
    if (b64.length > 0) {
      return reply.status(400).send({ error: `Données base64 non autorisées : ${b64.join(', ')}` });
    }

    const [existing] = await sql`SELECT id FROM stories WHERE id = ${id} AND deleted_at IS NULL`;
    if (!existing) return reply.status(404).send({ error: 'Récit introuvable' });

    const slug = body.title ? await uniqueSlug('stories', String(body.title), id) : undefined;

    const [story] = await sql`
      UPDATE stories SET
        ${slug ? sql`slug = ${slug},` : sql``}
        lang         = ${body.lang ?? 'fr'},
        title        = ${body.title},
        summary      = ${body.summary ?? null},
        cover_url    = ${body.coverUrl ?? null},
        contributors = ${JSON.stringify(body.contributors ?? [])},
        type         = ${body.type ?? 'evenement'},
        status       = ${body.status ?? 'draft'},
        updated_by   = ${req.authUser!.id}
      WHERE id = ${id}
      RETURNING *
    `;

    // Remplacer les moments
    if (Array.isArray(body.moments)) {
      await sql`DELETE FROM story_events WHERE story_id = ${id}`;
      for (const [i, m] of body.moments.entries()) {
        if (!m.eventId) continue;
        await sql`
          INSERT INTO story_events (
            story_id, event_id, position,
            narrative_text, narrative_audio_url, narrative_video_url,
            quote, quote_author, cta, source_story_event_id
          ) VALUES (
            ${id}, ${m.eventId}, ${m.position ?? i},
            ${m.narrativeText ?? null}, ${m.narrativeAudioUrl ?? null}, ${m.narrativeVideoUrl ?? null},
            ${m.quote ?? null}, ${m.quoteAuthor ?? null},
            ${m.cta ? JSON.stringify(m.cta) : null},
            ${m.sourceStoryEventId ?? null}
          )
        `;
      }
    }

    return reply.send(story);
  });

  // ── DELETE /:id — soft delete ─────────────────────────────────────────────
  app.delete('/:id', { preHandler: requireAdmin }, async (req: any, reply) => {
    const [story] = await sql`
      UPDATE stories SET deleted_at = now(), updated_by = ${req.authUser!.id}
      WHERE id = ${req.params.id} AND deleted_at IS NULL
      RETURNING id
    `;
    if (!story) return reply.status(404).send({ error: 'Récit introuvable' });
    return reply.send({ success: true });
  });
}
