/**
 * /api/v1/featured — Éléments "À la une"
 *
 * GET  /featured          — liste publique (active + dans la plage de dates)
 * GET  /featured/all      — liste admin (tous statuts)
 * GET  /featured/:id      — détail [admin]
 * POST /featured          — créer [admin]
 * PUT  /featured/:id      — modifier [admin]
 * DELETE /featured/:id    — supprimer [admin]
 *
 * Chaque item référence exactement une source : event | story | module.
 * Les champs title/subtitle/imageUrl sont fusionnés (override ?? source).
 */

import type { FastifyInstance } from 'fastify';
import sql from '../db';
import { requireAdmin } from '../middleware/auth';

// ─── Requête de fusion source + overrides ─────────────────────────────────────
const SELECT_FEATURED = sql`
  SELECT
    fi.id,
    fi.source_type       AS "sourceType",
    fi.event_id          AS "eventId",
    fi.story_id          AS "storyId",
    fi.module_id         AS "moduleId",
    fi.title_override    AS "titleOverride",
    fi.subtitle_override AS "subtitleOverride",
    fi.image_url_override AS "imageUrlOverride",
    fi.cta_label         AS "ctaLabel",
    fi.cta_to            AS "ctaTo",
    TO_CHAR(fi.start_date, 'YYYY-MM-DD') AS "startDate",
    TO_CHAR(fi.end_date,   'YYYY-MM-DD') AS "endDate",
    fi.display_order     AS "order",
    fi.active,
    fi.created_at        AS "createdAt",
    fi.updated_at        AS "updatedAt",

    -- Titre fusionné
    COALESCE(
      fi.title_override,
      e.title,
      s.title,
      m.title
    ) AS title,

    -- Sous-titre fusionné
    COALESCE(
      fi.subtitle_override,
      e.summary,
      s.summary,
      m.summary
    ) AS subtitle,

    -- Image fusionnée
    COALESCE(
      fi.image_url_override,
      (SELECT med.url FROM event_media em JOIN media med ON med.id = em.media_id
       WHERE em.event_id = e.id AND em.is_cover = true LIMIT 1),
      s.cover_url,
      m.thumbnail_url
    ) AS "imageUrl",

    -- Infos source (pour le formulaire)
    e.slug               AS "eventSlug",
    e.title              AS "eventTitle",
    e.summary            AS "eventSummary",
    (SELECT med.url FROM event_media em JOIN media med ON med.id = em.media_id
     WHERE em.event_id = e.id AND em.is_cover = true LIMIT 1) AS "eventImageUrl",

    s.slug               AS "storySlug",
    s.title              AS "storyTitle",
    s.summary            AS "storySummary",
    s.cover_url          AS "storyImageUrl",

    m.slug               AS "moduleSlug",
    m.title              AS "moduleTitle",
    m.summary            AS "moduleSummary",
    m.thumbnail_url      AS "moduleImageUrl"

  FROM featured_items fi
  LEFT JOIN events  e ON e.id  = fi.event_id  AND e.deleted_at IS NULL
  LEFT JOIN stories s ON s.id  = fi.story_id  AND s.deleted_at IS NULL
  LEFT JOIN modules m ON m.id  = fi.module_id AND m.deleted_at IS NULL
`;

export async function featuredRoutes(app: FastifyInstance) {

  // ── GET / — liste publique (active dans la fenêtre de dates) ─────────────
  app.get('/', async (_req, reply) => {
    const items = await sql`
      ${SELECT_FEATURED}
      WHERE fi.active = true
        AND CURRENT_DATE BETWEEN fi.start_date AND fi.end_date
      ORDER BY fi.display_order ASC, fi.created_at DESC
      LIMIT 10
    `;
    return reply.send(items);
  });

  // ── GET /all — liste admin ────────────────────────────────────────────────
  app.get('/all', { preHandler: requireAdmin }, async (_req, reply) => {
    const items = await sql`
      ${SELECT_FEATURED}
      ORDER BY fi.display_order ASC, fi.created_at DESC
    `;
    return reply.send({ items });
  });

  // ── GET /:id — détail [admin] ─────────────────────────────────────────────
  app.get('/:id', { preHandler: requireAdmin }, async (req: any, reply) => {
    const [item] = await sql`
      ${SELECT_FEATURED}
      WHERE fi.id = ${req.params.id}
    `;
    if (!item) return reply.status(404).send({ error: 'Introuvable' });
    return reply.send(item);
  });

  // ── POST / — créer ────────────────────────────────────────────────────────
  app.post('/', { preHandler: requireAdmin }, async (req: any, reply) => {
    const body = req.body as Record<string, any>;

    const { sourceType, eventId, storyId, moduleId,
            titleOverride, subtitleOverride, imageUrlOverride,
            ctaLabel, ctaTo, startDate, endDate, order = 0, active = true } = body;

    if (!['event', 'story', 'module'].includes(sourceType)) {
      return reply.status(400).send({ error: 'sourceType invalide' });
    }
    if (!eventId && !storyId && !moduleId) {
      return reply.status(400).send({ error: 'Une source est requise (eventId, storyId ou moduleId)' });
    }

    const [item] = await sql`
      INSERT INTO featured_items (
        source_type, event_id, story_id, module_id,
        title_override, subtitle_override, image_url_override,
        cta_label, cta_to, start_date, end_date, display_order, active,
        created_by, updated_by
      ) VALUES (
        ${sourceType},
        ${eventId  ?? null},
        ${storyId  ?? null},
        ${moduleId ?? null},
        ${titleOverride    ?? null},
        ${subtitleOverride ?? null},
        ${imageUrlOverride ?? null},
        ${ctaLabel ?? 'Découvrir'},
        ${ctaTo},
        ${startDate},
        ${endDate},
        ${order},
        ${active},
        ${req.authUser!.id},
        ${req.authUser!.id}
      )
      RETURNING id
    `;

    const [full] = await sql`${SELECT_FEATURED} WHERE fi.id = ${item.id}`;
    return reply.status(201).send(full);
  });

  // ── PUT /:id — modifier ───────────────────────────────────────────────────
  app.put('/:id', { preHandler: requireAdmin }, async (req: any, reply) => {
    const body = req.body as Record<string, any>;
    const { id } = req.params;

    const [existing] = await sql`SELECT id FROM featured_items WHERE id = ${id}`;
    if (!existing) return reply.status(404).send({ error: 'Introuvable' });

    await sql`
      UPDATE featured_items SET
        source_type         = ${body.sourceType},
        event_id            = ${body.eventId   ?? null},
        story_id            = ${body.storyId   ?? null},
        module_id           = ${body.moduleId  ?? null},
        title_override      = ${body.titleOverride    ?? null},
        subtitle_override   = ${body.subtitleOverride ?? null},
        image_url_override  = ${body.imageUrlOverride ?? null},
        cta_label           = ${body.ctaLabel  ?? 'Découvrir'},
        cta_to              = ${body.ctaTo},
        start_date          = ${body.startDate},
        end_date            = ${body.endDate},
        display_order       = ${body.order     ?? 0},
        active              = ${body.active    ?? true},
        updated_by          = ${req.authUser!.id}
      WHERE id = ${id}
    `;

    const [full] = await sql`${SELECT_FEATURED} WHERE fi.id = ${id}`;
    return reply.send(full);
  });

  // ── DELETE /:id ───────────────────────────────────────────────────────────
  app.delete('/:id', { preHandler: requireAdmin }, async (req: any, reply) => {
    const [deleted] = await sql`
      DELETE FROM featured_items WHERE id = ${req.params.id} RETURNING id
    `;
    if (!deleted) return reply.status(404).send({ error: 'Introuvable' });
    return reply.status(204).send();
  });
}
