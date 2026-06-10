/**
 * GET    /api/v1/heritage              — liste publique paginée (publiés)
 * GET    /api/v1/heritage/all          — liste admin (tous statuts) [requireAdmin]
 * GET    /api/v1/heritage/slug/:slug   — détail par slug
 * GET    /api/v1/heritage/:id          — détail par ID
 * POST   /api/v1/heritage              — créer [requireAdmin]
 * PUT    /api/v1/heritage/:id          — modifier [requireAdmin]
 * DELETE /api/v1/heritage/:id          — soft delete [requireAdmin]
 */

import type { FastifyInstance } from 'fastify';
import type postgres from 'postgres';
import sql from '../db';
import { requireAdmin } from '../middleware/auth';
import { parsePagination, paginate } from '../utils/pagination';
import { uniqueSlug } from '../utils/slug';
import { findBase64Fields } from '../utils/validation';

const CATEGORY_VALUES = ['mask', 'proverb', 'symbol', 'recipe', 'craft', 'music', 'other'] as const;
const RESOURCE_TYPES  = ['audio', 'image', 'video', 'pdf', 'link'] as const;

// Événements publiés liés à un patrimoine — sous-requête corrélée réutilisable.
// Volontairement HORS du GROUP BY (sinon produit cartésien avec themes/people/resources).
// Les clés JSON sont écrites en camelCase : elles ne sont PAS transformées par
// db.ts (le transform.column.from ne renomme que les colonnes, pas les clés JSON).
const linkedEventsAgg = (heritageIdColumn: postgres.Fragment) => sql`
  COALESCE((
    SELECT JSON_AGG(JSONB_BUILD_OBJECT(
      'id', e.id, 'slug', e.slug, 'title', e.title, 'summary', e.summary,
      'displayDate', e.display_date,
      'startDate', TO_CHAR(e.start_date, 'YYYY-MM-DD'),
      'primaryCountryCode', e.primary_country_code,
      'thumbnailUrl', (
        SELECT m.url FROM event_media em2 JOIN media m ON m.id = em2.media_id
        WHERE em2.event_id = e.id AND em2.is_cover = true LIMIT 1
      )
    ) ORDER BY e.start_date DESC NULLS LAST, e.title)
    FROM event_heritage_items ehi
    JOIN events e ON e.id = ehi.event_id
    WHERE ehi.heritage_item_id = ${heritageIdColumn}
      AND e.status = 'published' AND e.deleted_at IS NULL
  ), '[]'::json)
`;

// Détail enrichi réutilisable — sous-requêtes corrélées, PAS de LEFT JOIN + GROUP BY.
// (Les LEFT JOIN multiples créaient un produit cartésien themes × people × resources,
//  d'où des DISTINCT — et un JSON_AGG(DISTINCT … ORDER BY <autre expr>) est REJETÉ par
//  Postgres : « in an aggregate with DISTINCT, ORDER BY expressions must appear in
//  argument list ». Les sous-requêtes corrélées suppriment le produit cartésien, donc
//  plus de DISTINCT, ORDER BY propre, et zéro duplication de resources.)
function selectHeritageDetail(where: postgres.Fragment) {
  return sql`
    SELECT h.*,
      COALESCE((
        SELECT JSON_AGG(JSONB_BUILD_OBJECT('id', t.id, 'slug', t.slug, 'name', t.name, 'color', t.color))
        FROM heritage_themes ht JOIN themes t ON t.id = ht.theme_id
        WHERE ht.heritage_item_id = h.id
      ), '[]'::json) AS themes,
      COALESCE((
        SELECT JSON_AGG(JSONB_BUILD_OBJECT('id', p.id, 'slug', p.slug, 'name', p.name, 'photoUrl', p.photo_url))
        FROM heritage_people hp JOIN people p ON p.id = hp.person_id
        WHERE hp.heritage_item_id = h.id
      ), '[]'::json) AS people,
      COALESCE((
        SELECT JSON_AGG(JSONB_BUILD_OBJECT(
          'id', r.id, 'type', r.type, 'url', r.url, 'title', r.title,
          'credit', r.credit, 'position', r.position
        ) ORDER BY r.position)
        FROM heritage_resources r
        WHERE r.heritage_item_id = h.id
      ), '[]'::json) AS resources,
      ${linkedEventsAgg(sql`h.id`)} AS "linkedEvents"
    FROM heritage_items h
    WHERE ${where}
  `;
}

async function enrichedDetail(id: string) {
  const [item] = await selectHeritageDetail(sql`h.id = ${id} AND h.deleted_at IS NULL`);
  return item ?? null;
}

export async function heritageRoutes(app: FastifyInstance) {

  // ── GET / — liste publique ────────────────────────────────────────────────
  app.get('/', async (req, reply) => {
    const q        = req.query as Record<string, string>;
    const pg       = parsePagination(q);
    const search   = q.q?.trim() ?? '';
    const category = q.category?.trim() ?? '';
    const country  = q.country?.trim() ?? '';

    const [{ count }] = await sql`
      SELECT COUNT(*)::int AS count FROM heritage_items h
      WHERE h.status = 'published' AND h.deleted_at IS NULL
        AND (${search}   = '' OR h.search_vector @@ plainto_tsquery('french', unaccent(${search})))
        AND (${category} = '' OR h.category = ${category})
        AND (${country}  = '' OR h.country_code = ${country})
    `;

    const items = await sql`
      SELECT h.id, h.slug, h.lang, h.title, h.category, h.summary,
             h.period, h.country_code, h.cover_url, h.published_at, h.created_at,
             COALESCE(JSON_AGG(DISTINCT JSONB_BUILD_OBJECT(
               'id', t.id, 'slug', t.slug, 'name', t.name, 'color', t.color
             )) FILTER (WHERE t.id IS NOT NULL), '[]') AS themes
      FROM heritage_items h
      LEFT JOIN heritage_themes ht ON ht.heritage_item_id = h.id
      LEFT JOIN themes t           ON t.id = ht.theme_id
      WHERE h.status = 'published' AND h.deleted_at IS NULL
        AND (${search}   = '' OR h.search_vector @@ plainto_tsquery('french', unaccent(${search})))
        AND (${category} = '' OR h.category = ${category})
        AND (${country}  = '' OR h.country_code = ${country})
      GROUP BY h.id
      ORDER BY h.published_at DESC NULLS LAST, h.created_at DESC
      LIMIT ${pg.limit} OFFSET ${pg.offset}
    `;

    return reply.send(paginate(items, count, pg));
  });

  // ── GET /all — liste admin ────────────────────────────────────────────────
  app.get('/all', { preHandler: requireAdmin }, async (req, reply) => {
    const q        = req.query as Record<string, string>;
    const pg       = parsePagination(q);
    const search   = q.q?.trim() ?? '';
    const category = q.category?.trim() ?? '';
    const country  = q.country?.trim() ?? '';
    const status   = q.status?.trim() ?? '';

    const [{ count }] = await sql`
      SELECT COUNT(*)::int AS count FROM heritage_items h
      WHERE h.deleted_at IS NULL
        AND (${search}   = '' OR h.search_vector @@ plainto_tsquery('french', unaccent(${search})))
        AND (${category} = '' OR h.category = ${category})
        AND (${country}  = '' OR h.country_code = ${country})
        AND (${status}   = '' OR h.status::text = ${status})
    `;

    const items = await sql`
      SELECT h.id, h.slug, h.lang, h.title, h.category, h.summary, h.status,
             h.period, h.country_code, h.cover_url, h.published_at, h.created_at, h.updated_at
      FROM heritage_items h
      WHERE h.deleted_at IS NULL
        AND (${search}   = '' OR h.search_vector @@ plainto_tsquery('french', unaccent(${search})))
        AND (${category} = '' OR h.category = ${category})
        AND (${country}  = '' OR h.country_code = ${country})
        AND (${status}   = '' OR h.status::text = ${status})
      ORDER BY h.updated_at DESC
      LIMIT ${pg.limit} OFFSET ${pg.offset}
    `;

    return reply.send(paginate(items, count, pg));
  });

  // ── GET /slug/:slug ───────────────────────────────────────────────────────
  app.get('/slug/:slug', async (req: any, reply) => {
    const [item] = await selectHeritageDetail(
      sql`h.slug = ${req.params.slug} AND h.status = 'published' AND h.deleted_at IS NULL`
    );
    if (!item) return reply.status(404).send({ error: 'Patrimoine introuvable' });
    return reply.send(item);
  });

  // ── GET /:id ──────────────────────────────────────────────────────────────
  app.get('/:id', async (req: any, reply) => {
    const item = await enrichedDetail(req.params.id);
    if (!item) return reply.status(404).send({ error: 'Patrimoine introuvable' });
    return reply.send(item);
  });

  // ── POST / — créer ────────────────────────────────────────────────────────
  app.post('/', { preHandler: requireAdmin }, async (req, reply) => {
    const body = req.body as Record<string, any>;

    const b64 = findBase64Fields(body);
    if (b64.length > 0) {
      return reply.status(400).send({ error: `Données base64 non autorisées : ${b64.join(', ')}` });
    }

    if (body.category && !CATEGORY_VALUES.includes(body.category)) {
      return reply.status(400).send({ error: `Catégorie invalide. Valeurs acceptées : ${CATEGORY_VALUES.join(', ')}` });
    }

    const slug = await uniqueSlug('heritage_items', String(body.title ?? ''));

    const [item] = await sql`
      INSERT INTO heritage_items (slug, lang, title, category, summary, period, country_code, cover_url, status, created_by, updated_by)
      VALUES (
        ${slug},
        ${body.lang ?? 'fr'},
        ${body.title},
        ${body.category ?? 'other'},
        ${body.summary || null},
        ${body.period  || null},
        ${body.countryCode || null},
        ${body.coverUrl    || null},
        ${body.status ?? 'draft'},
        ${req.authUser!.id}, ${req.authUser!.id}
      )
      RETURNING *
    `;

    await syncPivots(item.id, body);

    return reply.status(201).send(await enrichedDetail(item.id));
  });

  // ── PUT /:id — modifier ───────────────────────────────────────────────────
  app.put('/:id', { preHandler: requireAdmin }, async (req: any, reply) => {
    const body = req.body as Record<string, any>;
    const { id } = req.params;

    const b64 = findBase64Fields(body);
    if (b64.length > 0) {
      return reply.status(400).send({ error: `Données base64 non autorisées : ${b64.join(', ')}` });
    }

    if (body.category && !CATEGORY_VALUES.includes(body.category)) {
      return reply.status(400).send({ error: `Catégorie invalide. Valeurs acceptées : ${CATEGORY_VALUES.join(', ')}` });
    }

    const [existing] = await sql`SELECT id FROM heritage_items WHERE id = ${id} AND deleted_at IS NULL`;
    if (!existing) return reply.status(404).send({ error: 'Patrimoine introuvable' });

    const slug = body.title ? await uniqueSlug('heritage_items', String(body.title), id) : undefined;

    await sql`
      UPDATE heritage_items SET
        ${slug ? sql`slug = ${slug},` : sql``}
        lang         = ${body.lang ?? 'fr'},
        title        = ${body.title},
        category     = ${body.category ?? 'other'},
        summary      = ${body.summary  || null},
        period       = ${body.period   || null},
        country_code = ${body.countryCode || null},
        cover_url    = ${body.coverUrl    || null},
        status       = ${body.status ?? 'draft'},
        updated_by   = ${req.authUser!.id}
      WHERE id = ${id}
    `;

    await syncPivots(id, body);

    return reply.send(await enrichedDetail(id));
  });

  // ── DELETE /:id — soft delete ─────────────────────────────────────────────
  app.delete('/:id', { preHandler: requireAdmin }, async (req: any, reply) => {
    const [item] = await sql`
      UPDATE heritage_items SET deleted_at = now(), updated_by = ${req.authUser!.id}
      WHERE id = ${req.params.id} AND deleted_at IS NULL
      RETURNING id
    `;
    if (!item) return reply.status(404).send({ error: 'Patrimoine introuvable' });
    return reply.send({ success: true });
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function syncPivots(itemId: string, body: Record<string, any>) {
  if (Array.isArray(body.themeIds)) {
    await sql`DELETE FROM heritage_themes WHERE heritage_item_id = ${itemId}`;
    if (body.themeIds.length > 0) {
      await sql`
        INSERT INTO heritage_themes (heritage_item_id, theme_id)
        SELECT ${itemId}, UNNEST(${body.themeIds}::uuid[])
        ON CONFLICT DO NOTHING
      `;
    }
  }

  if (Array.isArray(body.personIds)) {
    await sql`DELETE FROM heritage_people WHERE heritage_item_id = ${itemId}`;
    if (body.personIds.length > 0) {
      await sql`
        INSERT INTO heritage_people (heritage_item_id, person_id)
        SELECT ${itemId}, UNNEST(${body.personIds}::uuid[])
        ON CONFLICT DO NOTHING
      `;
    }
  }

  if (Array.isArray(body.eventIds)) {
    await sql`DELETE FROM event_heritage_items WHERE heritage_item_id = ${itemId}`;
    if (body.eventIds.length > 0) {
      await sql`
        INSERT INTO event_heritage_items (event_id, heritage_item_id)
        SELECT UNNEST(${body.eventIds}::uuid[]), ${itemId}
        ON CONFLICT DO NOTHING
      `;
    }
  }

  if (Array.isArray(body.storyIds)) {
    await sql`DELETE FROM story_heritage_items WHERE heritage_item_id = ${itemId}`;
    if (body.storyIds.length > 0) {
      await sql`
        INSERT INTO story_heritage_items (story_id, heritage_item_id)
        SELECT UNNEST(${body.storyIds}::uuid[]), ${itemId}
        ON CONFLICT DO NOTHING
      `;
    }
  }

  if (Array.isArray(body.moduleIds)) {
    await sql`DELETE FROM module_heritage_items WHERE heritage_item_id = ${itemId}`;
    if (body.moduleIds.length > 0) {
      await sql`
        INSERT INTO module_heritage_items (module_id, heritage_item_id)
        SELECT UNNEST(${body.moduleIds}::uuid[]), ${itemId}
        ON CONFLICT DO NOTHING
      `;
    }
  }

  if (Array.isArray(body.resources)) {
    await sql`DELETE FROM heritage_resources WHERE heritage_item_id = ${itemId}`;
    const valid = (body.resources as any[]).filter(r => r.url && RESOURCE_TYPES.includes(r.type));
    if (valid.length > 0) {
      for (let i = 0; i < valid.length; i++) {
        const r = valid[i];
        await sql`
          INSERT INTO heritage_resources (heritage_item_id, type, url, title, credit, position)
          VALUES (${itemId}, ${r.type}, ${r.url}, ${r.title || null}, ${r.credit || null}, ${i})
        `;
      }
    }
  }
}
