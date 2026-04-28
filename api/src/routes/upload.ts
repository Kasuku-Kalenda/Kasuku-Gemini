/**
 * api/src/routes/upload.ts
 *
 * POST /api/v1/upload          — upload un fichier vers MinIO [admin]
 * DELETE /api/v1/upload        — supprimer un fichier [admin]
 *
 * Remplace les data: URLs en base64 stockées dans IndexedDB.
 * Retourne une URL publique (via nginx → MinIO).
 *
 * Dossiers MinIO selon le contexte:
 *   events/    → images, vidéos d'événements
 *   timelines/ → thumbnails, médias de moments
 *   moments/   → ressources de moments (audio, pdf…)
 *   modules/   → thumbnails, ressources de cours
 *   avatars/   → photos de profil
 */

import type { FastifyInstance } from 'fastify';
import { requireAdmin }  from '../middleware/auth';
import { uploadFile, deleteFile } from '../storage/minio';

const ALLOWED_FOLDERS = ['events', 'timelines', 'moments', 'modules', 'avatars', 'misc'] as const;
type AllowedFolder = typeof ALLOWED_FOLDERS[number];

const MAX_SIZE = 512 * 1024 * 1024; // 512 MB

const ALLOWED_MIMES: Record<string, string> = {
  'image/jpeg':      '.jpg',
  'image/png':       '.png',
  'image/gif':       '.gif',
  'image/webp':      '.webp',
  'image/svg+xml':   '.svg',
  'audio/mpeg':      '.mp3',
  'audio/ogg':       '.ogg',
  'audio/wav':       '.wav',
  'video/mp4':       '.mp4',
  'video/webm':      '.webm',
  'application/pdf': '.pdf',
  'application/zip': '.zip',
};

export async function uploadRoutes(app: FastifyInstance) {

  // POST /upload [admin]
  app.post<{ Querystring: { folder?: string } }>('/', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    const folder = (req.query.folder ?? 'misc') as AllowedFolder;

    if (!ALLOWED_FOLDERS.includes(folder)) {
      return reply.status(400).send({ error: `Dossier invalide. Valeurs: ${ALLOWED_FOLDERS.join(', ')}` });
    }

    const data = await req.file();
    if (!data) return reply.status(400).send({ error: 'Aucun fichier reçu' });

    const mimeType = data.mimetype;
    if (!ALLOWED_MIMES[mimeType]) {
      return reply.status(415).send({ error: `Type de fichier non supporté: ${mimeType}` });
    }

    // Lire le stream en buffer
    const chunks: Buffer[] = [];
    let size = 0;

    for await (const chunk of data.file) {
      size += (chunk as Buffer).length;
      if (size > MAX_SIZE) {
        return reply.status(413).send({ error: 'Fichier trop volumineux (max 512 MB)' });
      }
      chunks.push(chunk as Buffer);
    }

    const buffer = Buffer.concat(chunks);
    const url    = await uploadFile(buffer, mimeType, folder, data.filename);

    app.log.info({ folder, filename: data.filename, size, url }, 'Fichier uploadé');

    return reply.status(201).send({
      url,
      filename: data.filename,
      size,
      mimeType,
    });
  });

  // DELETE /upload [admin] — body: { url: string }
  app.delete<{ Body: { url: string } }>('/', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    const { url } = req.body;
    if (!url) return reply.status(400).send({ error: 'URL manquante' });

    await deleteFile(url);
    return reply.status(204).send();
  });
}
