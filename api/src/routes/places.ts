/**
 * GET    /api/v1/places       — liste
 * POST   /api/v1/places       — créer [admin]
 * PUT    /api/v1/places/:id   — modifier [admin]
 * DELETE /api/v1/places/:id   — supprimer [admin]
 */

import type { FastifyInstance } from 'fastify';
import sql from '../db';
import { requireAdmin } from '../middleware/auth';
import { uniqueSlug } from '../utils/slug';

export async function placesRoutes(app: FastifyInstance) {

  app.get('/', async (req, reply) => {
    const q           = req.query as Record<string, string>;
    const country     = q.country?.trim() ?? '';
    const placeType   = q.type?.trim() ?? '';

    const items = await sql`
      SELECT id, slug, name, place_type, country_code, parent_id, lat, lng
      FROM places
      WHERE (${country}   = '' OR country_code = ${country})
        AND (${placeType} = '' OR place_type::text = ${placeType})
      ORDER BY name ASC
    `;
    return reply.send(items);
  });

  app.post('/', { preHandler: requireAdmin }, async (req, reply) => {
    const body = req.body as Record<string, any>;
    const slug = await uniqueSlug('places', String(body.name ?? ''));

    const [place] = await sql`
      INSERT INTO places (slug, name, place_type, country_code, parent_id, lat, lng, wikipedia_url)
      VALUES (
        ${slug}, ${body.name}, ${body.placeType ?? 'city'},
        ${body.countryCode ?? null}, ${body.parentId ?? null},
        ${body.lat ?? null}, ${body.lng ?? null}, ${body.wikipediaUrl ?? null}
      )
      RETURNING *
    `;
    return reply.status(201).send(place);
  });

  app.put('/:id', { preHandler: requireAdmin }, async (req: any, reply) => {
    const body = req.body as Record<string, any>;
    const [place] = await sql`
      UPDATE places SET
        name          = ${body.name},
        place_type    = ${body.placeType ?? 'city'},
        country_code  = ${body.countryCode ?? null},
        parent_id     = ${body.parentId ?? null},
        lat           = ${body.lat ?? null},
        lng           = ${body.lng ?? null},
        wikipedia_url = ${body.wikipediaUrl ?? null}
      WHERE id = ${req.params.id}
      RETURNING *
    `;
    if (!place) return reply.status(404).send({ error: 'Lieu introuvable' });
    return reply.send(place);
  });

  app.delete('/:id', { preHandler: requireAdmin }, async (req: any, reply) => {
    await sql`DELETE FROM places WHERE id = ${req.params.id}`;
    return reply.send({ success: true });
  });
}
