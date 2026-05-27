/**
 * GET  /api/v1/themes       — liste complète (publique)
 * GET  /api/v1/themes/:id   — détail [admin]
 * POST /api/v1/themes        — créer [admin]
 * PUT  /api/v1/themes/:id   — modifier [admin]
 * DELETE /api/v1/themes/:id — supprimer [admin]
 */

import type { FastifyInstance } from 'fastify';
import sql from '../db';
import { requireAdmin, requireSuperAdmin } from '../middleware/auth';
import { uniqueSlug } from '../utils/slug';

export async function themesRoutes(app: FastifyInstance) {

  // ── GET / — liste complète ────────────────────────────────────────────────
  app.get('/', async (_req, reply) => {
    const items = await sql`
      SELECT id, slug, name, description, parent_id, color, icon, position
      FROM themes
      ORDER BY position ASC, name ASC
    `;
    return reply.send(items);
  });

  // ── GET /:id ──────────────────────────────────────────────────────────────
  app.get('/:id', { preHandler: requireAdmin }, async (req: any, reply) => {
    const [theme] = await sql`SELECT * FROM themes WHERE id = ${req.params.id}`;
    if (!theme) return reply.status(404).send({ error: 'Thème introuvable' });
    return reply.send(theme);
  });

  // ── POST / — créer ────────────────────────────────────────────────────────
  app.post('/', { preHandler: requireAdmin }, async (req, reply) => {
    const body = req.body as Record<string, any>;
    const slug = await uniqueSlug('themes', String(body.name ?? ''));

    const [theme] = await sql`
      INSERT INTO themes (slug, name, description, parent_id, color, icon, position)
      VALUES (
        ${slug}, ${body.name}, ${body.description ?? null},
        ${body.parentId ?? null}, ${body.color ?? null},
        ${body.icon ?? null}, ${body.position ?? 0}
      )
      RETURNING *
    `;
    return reply.status(201).send(theme);
  });

  // ── PUT /:id — modifier ───────────────────────────────────────────────────
  app.put('/:id', { preHandler: requireAdmin }, async (req: any, reply) => {
    const body = req.body as Record<string, any>;
    const { id } = req.params;

    const [existing] = await sql`SELECT id FROM themes WHERE id = ${id}`;
    if (!existing) return reply.status(404).send({ error: 'Thème introuvable' });

    const slug = body.name ? await uniqueSlug('themes', String(body.name), id) : undefined;

    const [theme] = await sql`
      UPDATE themes SET
        ${slug ? sql`slug = ${slug},` : sql``}
        name        = ${body.name},
        description = ${body.description ?? null},
        parent_id   = ${body.parentId ?? null},
        color       = ${body.color ?? null},
        icon        = ${body.icon ?? null},
        position    = ${body.position ?? 0}
      WHERE id = ${id}
      RETURNING *
    `;
    return reply.send(theme);
  });

  // ── DELETE /:id ───────────────────────────────────────────────────────────
  app.delete('/:id', { preHandler: requireSuperAdmin }, async (req: any, reply) => {
    const { id } = req.params;

    // Vérifier que le thème existe
    const [existing] = await sql`SELECT id FROM themes WHERE id = ${id}`;
    if (!existing) return reply.status(404).send({ error: 'Thème introuvable' });

    // Vérifier que le thème n'est pas utilisé avant de supprimer
    const [usage] = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM event_themes   WHERE theme_id = ${id}) AS events,
        (SELECT COUNT(*)::int FROM module_themes  WHERE theme_id = ${id}) AS modules,
        (SELECT COUNT(*)::int FROM kalenda_themes WHERE theme_id = ${id}) AS kalendas
    `;
    const total = (usage.events ?? 0) + (usage.modules ?? 0) + (usage.kalendas ?? 0);
    if (total > 0) {
      return reply.status(409).send({
        error: `Ce thème est utilisé (${usage.events} événement(s), ${usage.modules} module(s), ${usage.kalendas} kalenda(s)). Retirez-le de ces contenus avant de le supprimer.`,
      });
    }

    await sql`DELETE FROM themes WHERE id = ${id}`;
    return reply.send({ success: true });
  });
}
