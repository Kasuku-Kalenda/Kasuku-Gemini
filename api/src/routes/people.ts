/**
 * GET    /api/v1/people       — liste paginée
 * GET    /api/v1/people/:id   — détail avec événements liés
 * POST   /api/v1/people       — créer [admin]
 * PUT    /api/v1/people/:id   — modifier [admin]
 * DELETE /api/v1/people/:id   — supprimer [admin]
 */

import type { FastifyInstance } from 'fastify';
import sql from '../db';
import { requireAdmin } from '../middleware/auth';
import { parsePagination, paginate } from '../utils/pagination';
import { uniqueSlug } from '../utils/slug';

export async function peopleRoutes(app: FastifyInstance) {

  app.get('/', async (req, reply) => {
    const q      = req.query as Record<string, string>;
    const pg     = parsePagination(q);
    const search = q.q?.trim() ?? '';

    const [{ count }] = await sql`
      SELECT COUNT(*)::int AS count FROM people
      WHERE (${search} = '' OR search_vector @@ plainto_tsquery('french', unaccent(${search})))
    `;

    const items = await sql`
      SELECT id, slug, name, birth_date, death_date, nationality, photo_url, sources, resources
      FROM people
      WHERE (${search} = '' OR search_vector @@ plainto_tsquery('french', unaccent(${search})))
      ORDER BY name ASC
      LIMIT ${pg.limit} OFFSET ${pg.offset}
    `;

    return reply.send(paginate(items, count, pg));
  });

  app.get('/:id', async (req: any, reply) => {
    const [person] = await sql`
      SELECT p.*,
        pl.name AS birth_place_name,
        COALESCE(JSON_AGG(DISTINCT JSONB_BUILD_OBJECT(
          'id', e.id, 'slug', e.slug, 'title', e.title, 'startDate', e.start_date, 'role', ep.role
        )) FILTER (WHERE e.id IS NOT NULL), '[]') AS events
      FROM people p
      LEFT JOIN places pl       ON pl.id = p.birth_place_id
      LEFT JOIN event_people ep ON ep.person_id = p.id
      LEFT JOIN events e        ON e.id = ep.event_id AND e.status = 'published'
      WHERE p.id = ${req.params.id}
      GROUP BY p.id, pl.name
    `;
    if (!person) return reply.status(404).send({ error: 'Personne introuvable' });
    return reply.send(person);
  });

  app.post('/', { preHandler: requireAdmin }, async (req, reply) => {
    const body = req.body as Record<string, any>;
    const slug = await uniqueSlug('people', String(body.name ?? ''));

    // Guard empty strings for date columns (postgres.js OID 1082 calls new Date("").toISOString() → RangeError)
    const birthDate = body.birthDate || null;
    const deathDate = body.deathDate || null;

    const sources   = JSON.stringify(Array.isArray(body.sources)   ? body.sources   : []);
    const resources = JSON.stringify(Array.isArray(body.resources) ? body.resources : []);

    const [person] = await sql`
      INSERT INTO people (slug, name, birth_date, death_date, birth_place_id, nationality, bio, photo_url, sources, resources)
      VALUES (
        ${slug}, ${body.name},
        ${birthDate}, ${deathDate},
        ${body.birthPlaceId ?? null}, ${body.nationality ?? null},
        ${body.bio ?? null}, ${body.photoUrl ?? null},
        ${sources}::jsonb, ${resources}::jsonb
      )
      RETURNING *
    `;
    return reply.status(201).send(person);
  });

  app.put('/:id', { preHandler: requireAdmin }, async (req: any, reply) => {
    const body = req.body as Record<string, any>;
    const { id } = req.params;

    const birthDate = body.birthDate || null;
    const deathDate = body.deathDate || null;

    const sources   = JSON.stringify(Array.isArray(body.sources)   ? body.sources   : []);
    const resources = JSON.stringify(Array.isArray(body.resources) ? body.resources : []);

    const [person] = await sql`
      UPDATE people SET
        name           = ${body.name},
        birth_date     = ${birthDate},
        death_date     = ${deathDate},
        birth_place_id = ${body.birthPlaceId ?? null},
        nationality    = ${body.nationality ?? null},
        bio            = ${body.bio ?? null},
        photo_url      = ${body.photoUrl ?? null},
        sources        = ${sources}::jsonb,
        resources      = ${resources}::jsonb
      WHERE id = ${id}
      RETURNING *
    `;
    if (!person) return reply.status(404).send({ error: 'Personne introuvable' });
    return reply.send(person);
  });

  app.delete('/:id', { preHandler: requireAdmin }, async (req: any, reply) => {
    const [person] = await sql`DELETE FROM people WHERE id = ${req.params.id} RETURNING id`;
    if (!person) return reply.status(404).send({ error: 'Personne introuvable' });
    return reply.send({ success: true });
  });
}
