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
import type postgres from 'postgres';
import { requireAdmin } from '../middleware/auth';
import { parsePagination, paginate } from '../utils/pagination';
import { uniqueSlug } from '../utils/slug';
import { findBase64Fields } from '../utils/validation';

// ─── Détail enrichi d'un événement ───────────────────────────────────────────
// Galerie média + couverture, thèmes, récit (story/timeline) lié, personnes et
// modules. Factorisé pour que GET /slug/:slug ET GET /:id renvoient EXACTEMENT le
// même contrat. Auparavant /:id ne renvoyait que l'événement nu (SELECT e.*, p.name) :
// dès qu'on ouvrait un événement par UUID (cartes, calendrier, moments de récit),
// l'image, le récit lié et les thèmes étaient absents. `where` est un fragment SQL
// (e.id = … | e.slug = …) interpolé en toute sécurité par postgres.js.
function selectEventDetail(where: postgres.Fragment) {
  return sql`
    SELECT e.*,
      p.name AS primary_place_name,
      -- Image de couverture (pour les cartes)
      (SELECT mx.url FROM event_media emx
         JOIN media mx ON mx.id = emx.media_id
         WHERE emx.event_id = e.id AND emx.is_cover = true
         LIMIT 1) AS thumbnail_url,
      -- Tous les médias ordonnés (pour la galerie + formulaire admin)
      (SELECT COALESCE(JSON_AGG(
         JSONB_BUILD_OBJECT(
           'id', mx.id, 'type', mx.type, 'url', mx.url,
           'caption', mx.alt_text, 'credit', mx.credit,
           'isCover', emx.is_cover, 'position', emx.position
         ) ORDER BY emx.position
       ), '[]')
       FROM event_media emx JOIN media mx ON mx.id = emx.media_id
       WHERE emx.event_id = e.id) AS media_items,
      -- Premier récit (story/timeline) lié à cet événement
      MIN(s.slug)       AS timeline_slug,
      MIN(s.title)      AS timeline_title,
      MIN(s.cover_url)  AS timeline_thumbnail,
      COALESCE(JSON_AGG(DISTINCT JSONB_BUILD_OBJECT(
        'id', t.id, 'slug', t.slug, 'name', t.name, 'color', t.color
      )) FILTER (WHERE t.id IS NOT NULL), '[]') AS themes,
      COALESCE(JSON_AGG(DISTINCT JSONB_BUILD_OBJECT(
        'id', pe.id, 'slug', pe.slug, 'name', pe.name, 'photoUrl', pe.photo_url, 'role', ep.role
      )) FILTER (WHERE pe.id IS NOT NULL), '[]') AS people,
      COALESCE(JSON_AGG(DISTINCT JSONB_BUILD_OBJECT(
        'id', mo.id, 'slug', mo.slug, 'title', mo.title, 'level', mo.level,
        'durationMin', mo.duration_minutes, 'summary', mo.summary
      )) FILTER (WHERE mo.id IS NOT NULL), '[]') AS modules
    FROM events e
    LEFT JOIN places        p  ON p.id  = e.primary_place_id
    LEFT JOIN story_events  se ON se.event_id = e.id
    LEFT JOIN stories       s  ON s.id  = se.story_id AND s.status = 'published'
    LEFT JOIN event_themes  et ON et.event_id = e.id
    LEFT JOIN themes        t  ON t.id  = et.theme_id
    LEFT JOIN event_people  ep ON ep.event_id = e.id
    LEFT JOIN people        pe ON pe.id = ep.person_id
    LEFT JOIN event_modules em ON em.event_id = e.id
    LEFT JOIN modules       mo ON mo.id = em.module_id AND mo.status = 'published'
    WHERE ${where}
    GROUP BY e.id, p.name
  `;
}

// ─── Helper : synchronise les médias d'un événement ──────────────────────────
// Supprime les liens event_media existants, réinsère dans media + event_media.

interface MediaItem {
  type?: string;
  url: string;
  caption?: string | null;
  credit?: string  | null;
}

async function syncEventMedia(
  eventId: string,
  items: MediaItem[],
  userId: string,
): Promise<void> {
  // Supprime les anciens liens (les enregistrements media restent dans la bibliothèque)
  await sql`DELETE FROM event_media WHERE event_id = ${eventId}`;

  for (let i = 0; i < items.length; i++) {
    const item    = items[i];
    const mType   = item.type === 'video' ? 'video' : 'image';
    const caption = item.caption ?? null;
    const credit  = item.credit  ?? null;

    const [media] = await sql`
      INSERT INTO media (type, url, title, alt_text, credit, created_by)
      VALUES (
        ${mType}::media_type,
        ${item.url},
        ${caption ?? item.url},
        ${caption},
        ${credit},
        ${userId}::uuid
      )
      RETURNING id
    `;

    await sql`
      INSERT INTO event_media (event_id, media_id, position, is_cover)
      VALUES (${eventId}, ${media.id}, ${i}, ${i === 0})
    `;
  }
}

export async function eventsRoutes(app: FastifyInstance) {

  // ── GET / — liste publique ────────────────────────────────────────────────
  app.get('/', async (req, reply) => {
    const q        = req.query as Record<string, string>;
    const pg       = parsePagination(q);
    const search   = q.q?.trim() ?? '';
    const country  = q.country?.trim() ?? '';
    const theme    = q.theme?.trim() ?? '';
    const lang     = q.lang?.trim() ?? '';
    const year     = q.year  ? parseInt(q.year,  10) : null;
    const month    = q.month ? parseInt(q.month, 10) : null;
    const day      = q.day   ? parseInt(q.day,   10) : null;
    const temporal = q.temporal ?? '';
    const sortBy   = q.sort?.trim() ?? 'date';

    const [{ count }] = await sql`
      SELECT COUNT(*)::int AS count
      FROM events e
      WHERE e.status = 'published' AND e.deleted_at IS NULL
        AND (${search}   = '' OR e.search_vector @@ plainto_tsquery('french', unaccent(${search})))
        AND (${country}  = '' OR e.primary_country_code = ${country})
        AND (${lang}     = '' OR e.lang = ${lang})
        AND (${temporal} = '' OR e.temporal_type::text = ${temporal})
        AND (${year}::int  IS NULL OR EXTRACT(YEAR  FROM e.start_date)::int = ${year}::int)
        AND (${month}::int IS NULL OR EXTRACT(MONTH FROM e.start_date)::int = ${month}::int)
        AND (${day}::int   IS NULL OR EXTRACT(DAY   FROM e.start_date)::int = ${day}::int)
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
        (SELECT m.url FROM event_media em2
           JOIN media m ON m.id = em2.media_id
           WHERE em2.event_id = e.id AND em2.is_cover = true
           LIMIT 1) AS thumbnail_url,
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
        AND (${year}::int  IS NULL OR EXTRACT(YEAR  FROM e.start_date)::int = ${year}::int)
        AND (${month}::int IS NULL OR EXTRACT(MONTH FROM e.start_date)::int = ${month}::int)
        AND (${day}::int   IS NULL OR EXTRACT(DAY   FROM e.start_date)::int = ${day}::int)
        AND (${theme} = '' OR EXISTS (
          SELECT 1 FROM event_themes et2 JOIN themes t2 ON t2.id = et2.theme_id
          WHERE et2.event_id = e.id AND t2.slug = ${theme}
        ))
      GROUP BY e.id, p.name
      ORDER BY
        ${sortBy === 'featured' ? sql`e.featured_position ASC NULLS LAST, e.start_date DESC NULLS LAST` : sql`e.start_date DESC NULLS LAST`}
      LIMIT ${pg.limit} OFFSET ${pg.offset}
    `;

    return reply.send(paginate(items, count, pg));
  });

  // ── GET /calendar-days — points calendrier par mois ──────────────────────
  // Retourne { month, days: { "MM-DD": { count, hasTimeline, hasModule, themeColors } } }
  // Utilisé par le front pour afficher les points du calendrier sans charger
  // tous les événements. Scalable à l'infini.
  app.get('/calendar-days', async (req, reply) => {
    const q       = req.query as Record<string, string>;
    const month   = q.month ? parseInt(q.month, 10) : new Date().getMonth() + 1;
    const year    = q.year  ? parseInt(q.year,  10) : null;
    const search  = q.q?.trim()      ?? '';
    const country = q.country?.trim() ?? '';
    const theme   = q.theme?.trim()  ?? '';

    const rows = await sql`
      SELECT
        EXTRACT(DAY FROM e.start_date)::int         AS day,
        COUNT(DISTINCT e.id)::int                   AS count,
        BOOL_OR(se.id IS NOT NULL)                  AS has_timeline,
        BOOL_OR(em.module_id IS NOT NULL)           AS has_module,
        ARRAY_AGG(DISTINCT t.color)
          FILTER (WHERE t.color IS NOT NULL)        AS theme_colors
      FROM events e
      LEFT JOIN story_events  se ON se.event_id = e.id
      LEFT JOIN event_modules em ON em.event_id = e.id
      LEFT JOIN event_themes  et ON et.event_id = e.id
      LEFT JOIN themes         t ON t.id = et.theme_id
      WHERE e.status = 'published' AND e.deleted_at IS NULL
        AND e.start_date IS NOT NULL
        AND EXTRACT(MONTH FROM e.start_date)::int = ${month}
        AND (${year}::int  IS NULL OR EXTRACT(YEAR FROM e.start_date)::int = ${year}::int)
        AND (${search}  = '' OR e.search_vector @@ plainto_tsquery('french', unaccent(${search})))
        AND (${country} = '' OR e.primary_country_code = ${country})
        AND (${theme}   = '' OR EXISTS (
          SELECT 1 FROM event_themes et2 JOIN themes t2 ON t2.id = et2.theme_id
          WHERE et2.event_id = e.id AND t2.slug = ${theme}
        ))
      GROUP BY EXTRACT(DAY FROM e.start_date)::int
      ORDER BY day
    `;

    const days: Record<string, {
      count: number; hasTimeline: boolean; hasModule: boolean; themeColors: string[];
    }> = {};

    for (const row of rows) {
      const key = `${String(month).padStart(2, '0')}-${String(row.day).padStart(2, '0')}`;
      days[key] = {
        count:       row.count,
        hasTimeline: Boolean(row.has_timeline),
        hasModule:   Boolean(row.has_module),
        themeColors: (row.theme_colors as string[] | null)?.slice(0, 3) ?? ['#94a3b8'],
      };
    }

    return reply.send({ month, days });
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

  // ── GET /all — liste admin enrichie (counts relationnels) ────────────────
  app.get('/all', { preHandler: requireAdmin }, async (req, reply) => {
    const q        = req.query as Record<string, string>;
    const pg       = parsePagination(q);
    const search   = q.q?.trim()      ?? '';
    const status   = q.status?.trim() ?? '';
    const theme    = q.theme?.trim()  ?? '';
    const country  = q.country?.trim() ?? '';
    // Filtres relationnels
    const orphan   = q.orphan   === 'true';   // sans aucun story
    const noModule = q.noModule === 'true';   // sans aucun module
    const featured = q.featured === 'true';

    const baseWhere = sql`
      e.deleted_at IS NULL
      AND (${search}  = '' OR e.search_vector @@ plainto_tsquery('french', unaccent(${search})))
      AND (${status}  = '' OR e.status::text = ${status})
      AND (${country} = '' OR e.primary_country_code = ${country})
      AND (${theme}   = '' OR EXISTS (
        SELECT 1 FROM event_themes et2 JOIN themes t2 ON t2.id = et2.theme_id
        WHERE et2.event_id = e.id AND t2.slug = ${theme}
      ))
      AND (NOT ${orphan}   OR NOT EXISTS (SELECT 1 FROM story_events se2 WHERE se2.event_id = e.id))
      AND (NOT ${noModule} OR NOT EXISTS (SELECT 1 FROM event_modules em2 WHERE em2.event_id = e.id))
      AND (NOT ${featured} OR e.featured = true)
    `;

    const [{ count }] = await sql`
      SELECT COUNT(*)::int AS count FROM events e WHERE ${baseWhere}
    `;

    const items = await sql`
      SELECT
        e.id, e.slug, e.lang, e.title, e.status,
        e.temporal_type, e.start_date, e.display_date,
        e.reliability, e.primary_country_code, e.featured,
        e.published_at, e.created_at, e.updated_at,
        p.name AS primary_place_name,
        -- Counts relationnels (sous-requêtes pour éviter le N+1)
        (SELECT COUNT(*)::int FROM story_events  se WHERE se.event_id = e.id)                     AS stories_count,
        (SELECT COUNT(*)::int FROM event_modules em WHERE em.event_id = e.id)                     AS modules_count,
        (SELECT COUNT(*)::int FROM event_themes  et WHERE et.event_id = e.id)                     AS themes_count,
        (SELECT COUNT(*)::int FROM event_people  ep WHERE ep.event_id = e.id)                     AS people_count,
        (SELECT COUNT(*)::int FROM event_media   emd WHERE emd.event_id = e.id)                   AS media_count,
        (SELECT COUNT(*)::int FROM taggables     tb WHERE tb.entity_type = 'event' AND tb.entity_id = e.id) AS tags_count,
        -- Couverture image
        (SELECT mx.url FROM event_media emx JOIN media mx ON mx.id = emx.media_id
         WHERE emx.event_id = e.id AND emx.is_cover = true LIMIT 1)                              AS thumbnail_url,
        -- Thèmes (pour affichage badges)
        COALESCE((
          SELECT JSON_AGG(JSONB_BUILD_OBJECT('id', t.id, 'name', t.name, 'color', t.color))
          FROM event_themes et JOIN themes t ON t.id = et.theme_id
          WHERE et.event_id = e.id
        ), '[]') AS themes
      FROM events e
      LEFT JOIN places p ON p.id = e.primary_place_id
      WHERE ${baseWhere}
      ORDER BY e.updated_at DESC
      LIMIT ${pg.limit} OFFSET ${pg.offset}
    `;

    return reply.send(paginate(items, count, pg));
  });

  // ── GET /:id/story-events — StoryEvents existants pour clone picker ───────
  // Retourne tous les StoryEvents liés à un Event, avec les infos de leur Story.
  // Utilisé dans TimelineForm quand l'utilisateur ajoute un Event existant.
  app.get('/:id/story-events', { preHandler: requireAdmin }, async (req: any, reply) => {
    const { id } = req.params;

    const storyEvents = await sql`
      SELECT
        se.id, se.story_id, se.position,
        se.narrative_text, se.quote, se.quote_author,
        se.narrative_audio_url, se.narrative_video_url,
        se.cta, se.source_story_event_id,
        se.created_at, se.updated_at,
        s.title    AS story_title,
        s.slug     AS story_slug,
        s.type     AS story_type,
        s.cover_url AS story_cover,
        s.status   AS story_status,
        u.name     AS author_name
      FROM story_events se
      JOIN  stories s ON s.id  = se.story_id
      LEFT JOIN users u ON u.id = s.created_by
      WHERE se.event_id = ${id}
        AND s.deleted_at IS NULL
      ORDER BY s.title, se.position
    `;

    return reply.send({ items: storyEvents, total: storyEvents.length });
  });

  // ── GET /slug/:slug — détail par slug ─────────────────────────────────────
  app.get('/slug/:slug', async (req: any, reply) => {
    const [event] = await selectEventDetail(
      sql`e.slug = ${req.params.slug} AND e.status = 'published' AND e.deleted_at IS NULL`,
    );

    if (!event) return reply.status(404).send({ error: 'Événement introuvable' });
    return reply.send(event);
  });

  // ── GET /:id — détail par ID (ou slug en fallback) ───────────────────────
  app.get('/:id', async (req: any, reply) => {
    const { id } = req.params;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const [event] = isUUID
      ? await selectEventDetail(sql`e.id = ${id}::uuid AND e.deleted_at IS NULL`)
      : await selectEventDetail(sql`e.slug = ${id} AND e.deleted_at IS NULL`);

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

    // Normalise les champs date : "" (chaîne vide HTML) doit devenir null,
    // car `"" ?? null` = "" et postgres.js appelle new Date("").toISOString() → RangeError
    const startDate   = body.startDate   || null;
    const endDate     = body.endDate     || null;
    const displayDate = body.displayDate || null;

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
        ${startDate}, ${endDate}, ${displayDate},
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

    if (Array.isArray(body.media) && body.media.length > 0) {
      await syncEventMedia(event.id, body.media as MediaItem[], req.authUser!.id);
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

    // Même normalisation "" → null que dans le POST
    const startDateU   = body.startDate   || null;
    const endDateU     = body.endDate     || null;
    const displayDateU = body.displayDate || null;

    const [event] = await sql`
      UPDATE events SET
        slug                 = ${slug},
        lang                 = ${body.lang ?? 'fr'},
        title                = ${body.title},
        summary              = ${body.summary ?? null},
        content              = ${body.content ?? null},
        contributors         = ${JSON.stringify(body.contributors ?? [])},
        temporal_type        = ${body.temporalType ?? 'exact_date'},
        start_date           = ${startDateU},
        end_date             = ${endDateU},
        display_date         = ${displayDateU},
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

    if (Array.isArray(body.media)) {
      await syncEventMedia(id, body.media as MediaItem[], req.authUser!.id);
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
