/**
 * api/src/routes/modules.ts
 *
 * GET  /api/v1/modules           — liste paginée + filtrée
 * GET  /api/v1/modules/:id       — détail
 * GET  /api/v1/modules/slug/:slug
 * POST /api/v1/modules           [admin]
 * PUT  /api/v1/modules/:id       [admin]
 * DELETE /api/v1/modules/:id     [admin]
 */

import type { FastifyInstance } from 'fastify';
import { TrainingModule } from '../models';
import { requireAdmin }   from '../middleware/auth';
import slugify from 'slugify';

function toSlug(title: string) {
  return slugify(title, { lower: true, strict: true, locale: 'fr' });
}

export async function modulesRoutes(app: FastifyInstance) {

  // GET /
  app.get<{
    Querystring: {
      q?: string; level?: string; lang?: string; type?: string;
      creator?: string; page?: string; limit?: string;
    }
  }>('/', async (req, reply) => {
    const { q, level, lang, type, creator, page = '1', limit = '12' } = req.query;

    const filter: Record<string, unknown> = {};
    if (q)       filter.$text     = { $search: q };
    if (level)   filter.level     = level;
    if (lang)    filter.language  = lang;
    if (type)    filter.moduleType = type;
    if (creator) filter['creators._id'] = creator;

    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, parseInt(limit, 10));
    const skip     = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      TrainingModule.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limitNum).lean(),
      TrainingModule.countDocuments(filter),
    ]);

    return reply.send({
      items:      items.map(m => ({ ...m, id: m._id.toString() })),
      page:       pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
    });
  });

  // GET /slug/:slug
  app.get<{ Params: { slug: string } }>('/slug/:slug', async (req, reply) => {
    const m = await TrainingModule.findOne({ slug: req.params.slug }).lean();
    if (!m) return reply.status(404).send({ error: 'Module introuvable' });
    return reply.send({ ...m, id: m._id.toString() });
  });

  // GET /:id
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const m = await TrainingModule.findById(req.params.id).lean();
    if (!m) return reply.status(404).send({ error: 'Module introuvable' });
    return reply.send({ ...m, id: m._id.toString() });
  });

  // POST / [admin]
  app.post<{ Body: Record<string, unknown> }>('/', { preHandler: requireAdmin }, async (req, reply) => {
    const body = req.body;
    const slug = (body.slug as string) || toSlug(body.title as string);

    const existing = await TrainingModule.findOne({ slug });
    if (existing) return reply.status(409).send({ error: `Slug "${slug}" déjà utilisé` });

    const m = await TrainingModule.create({
      ...body,
      slug,
      source: { type: 'local', id: 'local_admin' },
    });
    return reply.status(201).send({ ...m.toObject(), id: m._id.toString() });
  });

  // PUT /:id [admin]
  app.put<{ Params: { id: string }; Body: Record<string, unknown> }>('/:id', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    const m = await TrainingModule.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true },
    ).lean();
    if (!m) return reply.status(404).send({ error: 'Module introuvable' });
    return reply.send({ ...m, id: m._id.toString() });
  });

  // DELETE /:id [admin]
  app.delete<{ Params: { id: string } }>('/:id', { preHandler: requireAdmin }, async (req, reply) => {
    const result = await TrainingModule.findByIdAndDelete(req.params.id);
    if (!result) return reply.status(404).send({ error: 'Module introuvable' });
    return reply.status(204).send();
  });
}
