/**
 * GET    /api/v1/media       — liste admin
 * GET    /api/v1/media/:id   — détail
 * POST   /api/v1/media       — créer (métadonnées, URL déjà uploadée via /upload)
 * PUT    /api/v1/media/:id   — modifier
 * DELETE /api/v1/media/:id   — supprimer
 */

import type { FastifyInstance } from 'fastify';
import sql from '../db';
import { requireAdmin } from '../middleware/auth';
import { parsePagination, paginate } from '../utils/pagination';

export async function mediaRoutes(app: FastifyInstance) {

  // ── GET / — liste ─────────────────────────────────────────────────────────
  app.get('/', { preHandler: requireAdmin }, async (req, reply) => {
    const q    = req.query as Record<string, string>;
    const pg   = parsePagination(q);
    const type = q.type?.trim() ?? '';

    const [{ count }] = await sql`
      SELECT COUNT(*)::int AS count FROM media
      WHERE (${type} = '' OR type::text = ${type})
    `;

    const items = await sql`
      SELECT id, type, url, title, description, lang, creators,
             creation_year, source, publisher, license, credit,
             rights_expiry, alt_text, created_at
      FROM media
      WHERE (${type} = '' OR type::text = ${type})
      ORDER BY created_at DESC
      LIMIT ${pg.limit} OFFSET ${pg.offset}
    `;

    return reply.send(paginate(items, count, pg));
  });

  // ── GET /:id ──────────────────────────────────────────────────────────────
  app.get('/:id', async (req: any, reply) => {
    const [m] = await sql`SELECT * FROM media WHERE id = ${req.params.id}`;
    if (!m) return reply.status(404).send({ error: 'Média introuvable' });
    return reply.send(m);
  });

  // ── POST / — créer ────────────────────────────────────────────────────────
  app.post('/', { preHandler: requireAdmin }, async (req, reply) => {
    const body = req.body as Record<string, any>;

    const [m] = await sql`
      INSERT INTO media (
        type, url, title, description, lang, creators,
        creation_year, publication_date, source, publisher, edition, isbn,
        credit, license, rights_expiry,
        duration_s, width, height, size_bytes, mime_type,
        alt_text, transcript_url, created_by
      ) VALUES (
        ${body.type}, ${body.url}, ${body.title},
        ${body.description ?? null}, ${body.lang ?? null},
        ${JSON.stringify(body.creators ?? [])},
        ${body.creationYear ?? null}, ${body.publicationDate ?? null},
        ${body.source ?? null}, ${body.publisher ?? null},
        ${body.edition ?? null}, ${body.isbn ?? null},
        ${body.credit ?? null}, ${body.license ?? null}, ${body.rightsExpiry ?? null},
        ${body.durationS ?? null}, ${body.width ?? null}, ${body.height ?? null},
        ${body.sizeBytes ?? null}, ${body.mimeType ?? null},
        ${body.altText ?? null}, ${body.transcriptUrl ?? null},
        ${req.authUser!.id}
      )
      RETURNING *
    `;
    return reply.status(201).send(m);
  });

  // ── PUT /:id — modifier ───────────────────────────────────────────────────
  app.put('/:id', { preHandler: requireAdmin }, async (req: any, reply) => {
    const body = req.body as Record<string, any>;
    const { id } = req.params;

    const [m] = await sql`
      UPDATE media SET
        title          = ${body.title},
        description    = ${body.description ?? null},
        lang           = ${body.lang ?? null},
        creators       = ${JSON.stringify(body.creators ?? [])},
        creation_year  = ${body.creationYear ?? null},
        source         = ${body.source ?? null},
        publisher      = ${body.publisher ?? null},
        credit         = ${body.credit ?? null},
        license        = ${body.license ?? null},
        rights_expiry  = ${body.rightsExpiry ?? null},
        alt_text       = ${body.altText ?? null},
        transcript_url = ${body.transcriptUrl ?? null}
      WHERE id = ${id}
      RETURNING *
    `;
    if (!m) return reply.status(404).send({ error: 'Média introuvable' });
    return reply.send(m);
  });

  // ── DELETE /:id ───────────────────────────────────────────────────────────
  app.delete('/:id', { preHandler: requireAdmin }, async (req: any, reply) => {
    await sql`DELETE FROM media WHERE id = ${req.params.id}`;
    return reply.send({ success: true });
  });
}
