/**
 * GET  /api/v1/translations?entity_type=event&entity_id=X&lang=en
 * POST /api/v1/translations         — créer/mettre à jour [admin]
 * GET  /api/v1/translations/gaps    — champs manquants par langue [admin]
 */

import type { FastifyInstance } from 'fastify';
import sql from '../db';
import { requireAdmin } from '../middleware/auth';

export async function translationsRoutes(app: FastifyInstance) {

  // ── GET / — traductions d'une entité dans une langue ─────────────────────
  app.get('/', async (req, reply) => {
    const q          = req.query as Record<string, string>;
    const entityType = q.entity_type?.trim() ?? '';
    const entityId   = q.entity_id?.trim() ?? '';
    const lang       = q.lang?.trim() ?? '';

    if (!entityType || !entityId || !lang) {
      return reply.status(400).send({ error: 'entity_type, entity_id et lang sont requis' });
    }

    const items = await sql`
      SELECT field, value, status, translated_at
      FROM translations
      WHERE entity_type = ${entityType}
        AND entity_id   = ${entityId}
        AND lang        = ${lang}
    `;

    return reply.send(items);
  });

  // ── GET /gaps — tableau de bord des traductions manquantes ────────────────
  app.get('/gaps', { preHandler: requireAdmin }, async (req, reply) => {
    const q    = req.query as Record<string, string>;
    const lang = q.lang?.trim() ?? 'en';

    const items = await sql`
      SELECT entity_type, entity_id, entity_title, field, is_translated
      FROM v_translation_gaps
      WHERE lang = ${lang}
        AND is_translated = FALSE
      ORDER BY entity_title, field
    `;

    return reply.send({ lang, missing: items });
  });

  // ── POST / — créer ou mettre à jour une traduction ────────────────────────
  app.post('/', { preHandler: requireAdmin }, async (req, reply) => {
    const body = req.body as Record<string, any>;
    const { entityType, entityId, lang, field, value } = body;

    if (!entityType || !entityId || !lang || !field || !value) {
      return reply.status(400).send({ error: 'Champs requis : entityType, entityId, lang, field, value' });
    }

    const [t] = await sql`
      INSERT INTO translations (entity_type, entity_id, lang, field, value, status, translated_by)
      VALUES (${entityType}, ${entityId}, ${lang}, ${field}, ${value}, ${body.status ?? 'draft'}, ${req.authUser!.id})
      ON CONFLICT (entity_type, entity_id, lang, field)
      DO UPDATE SET
        value         = EXCLUDED.value,
        status        = EXCLUDED.status,
        translated_by = EXCLUDED.translated_by,
        translated_at = now()
      RETURNING *
    `;
    return reply.status(201).send(t);
  });

  // ── DELETE / — supprimer une traduction ───────────────────────────────────
  app.delete('/', { preHandler: requireAdmin }, async (req, reply) => {
    const q = req.query as Record<string, string>;
    await sql`
      DELETE FROM translations
      WHERE entity_type = ${q.entity_type}
        AND entity_id   = ${q.entity_id}
        AND lang        = ${q.lang}
        AND field       = ${q.field}
    `;
    return reply.send({ success: true });
  });
}
