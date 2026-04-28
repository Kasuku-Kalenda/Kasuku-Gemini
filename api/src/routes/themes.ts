/**
 * api/src/routes/themes.ts
 *
 * GET    /api/v1/themes       — liste complète (public)
 * GET    /api/v1/themes/:id   — détail (public)
 * POST   /api/v1/themes       — créer [admin]
 * PUT    /api/v1/themes/:id   — modifier [admin]
 * DELETE /api/v1/themes/:id   — supprimer [admin]
 */

import type { FastifyInstance } from 'fastify';
import { Theme }        from '../models';
import { requireAdmin } from '../middleware/auth';
import slugify from 'slugify';

export async function themesRoutes(app: FastifyInstance) {

  // GET / (public)
  app.get('/', async (_req, reply) => {
    const themes = await Theme.find().sort({ slug: 1 }).lean();
    return reply.send(themes.map(t => ({ ...t, id: t._id.toString() })));
  });

  // GET /:id (public)
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const theme = await Theme.findById(req.params.id).lean();
    if (!theme) return reply.status(404).send({ error: 'Thème introuvable' });
    return reply.send({ ...theme, id: theme._id.toString() });
  });

  // POST / [admin]
  app.post<{ Body: { name: string; slug?: string; color?: string; emoji?: string } }>('/', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    const { name, color, emoji } = req.body;
    const slug = req.body.slug || slugify(name, { lower: true, strict: true, locale: 'fr' });

    const existing = await Theme.findOne({ slug });
    if (existing) return reply.status(409).send({ error: `Slug "${slug}" déjà utilisé` });

    const theme = await Theme.create({
      name, slug, color, emoji,
      source: { type: 'local', id: 'local_admin' },
    });
    return reply.status(201).send({ ...theme.toObject(), id: theme._id.toString() });
  });

  // PUT /:id [admin]
  app.put<{ Params: { id: string }; Body: Record<string, unknown> }>('/:id', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    const theme = await Theme.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!theme) return reply.status(404).send({ error: 'Thème introuvable' });
    return reply.send({ ...theme, id: theme._id.toString() });
  });

  // DELETE /:id [admin]
  app.delete<{ Params: { id: string } }>('/:id', { preHandler: requireAdmin }, async (req, reply) => {
    const result = await Theme.findByIdAndDelete(req.params.id);
    if (!result) return reply.status(404).send({ error: 'Thème introuvable' });
    return reply.status(204).send();
  });
}
