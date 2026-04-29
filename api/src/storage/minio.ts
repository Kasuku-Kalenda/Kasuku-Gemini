/**
 * api/src/storage/minio.ts
 *
 * Client MinIO (S3-compatible) pour le stockage des médias Kasuku.
 * Remplace les data: URLs en base64 stockées en DB.
 *
 * Usage:
 *   const url = await uploadFile(buffer, 'image/jpeg', 'events/photo.jpg');
 *   // retourne: http://localhost/storage/events/photo.jpg
 */

import { Client as MinioClient } from 'minio';
import { randomUUID } from 'crypto';
import path from 'path';

// ─── Config ───────────────────────────────────────────────────────────────────

const BUCKET      = process.env.MINIO_BUCKET      ?? 'kasuku-media';
const ENDPOINT    = process.env.MINIO_ENDPOINT    ?? 'minio';
const PORT        = parseInt(process.env.MINIO_PORT ?? '9000', 10);
const USE_SSL     = process.env.MINIO_USE_SSL === 'true';
const ACCESS_KEY  = process.env.MINIO_ROOT_USER     ?? '';
const SECRET_KEY  = process.env.MINIO_ROOT_PASSWORD ?? '';
const PUBLIC_URL  = process.env.MINIO_PUBLIC_URL ?? 'http://localhost/storage';

// ─── Client ───────────────────────────────────────────────────────────────────

export const minioClient = new MinioClient({
  endPoint:  ENDPOINT,
  port:      PORT,
  useSSL:    USE_SSL,
  accessKey: ACCESS_KEY,
  secretKey: SECRET_KEY,
});

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Upload un fichier dans MinIO et retourne son URL publique.
 *
 * @param buffer   - contenu du fichier
 * @param mimeType - MIME type (ex: 'image/jpeg', 'application/pdf')
 * @param folder   - dossier de destination (ex: 'events', 'timelines/moments')
 * @param filename - nom du fichier original (pour préserver l'extension)
 */
export async function uploadFile(
  buffer: Buffer,
  mimeType: string,
  folder: string,
  filename?: string,
): Promise<string> {
  const ext  = filename ? path.extname(filename) : extensionFromMime(mimeType);
  const key  = `${folder.replace(/\/$/, '')}/${randomUUID()}${ext}`;

  await minioClient.putObject(BUCKET, key, buffer, buffer.length, {
    'Content-Type': mimeType,
  });

  return `${PUBLIC_URL.replace(/\/$/, '')}/${key}`;
}

/**
 * Convertit un data: URL en Buffer + mimeType.
 * Utilisé pour migrer le contenu existant de l'IndexedDB vers MinIO.
 */
export function parseDataUrl(dataUrl: string): { buffer: Buffer; mimeType: string } {
  const [header, b64] = dataUrl.split(',');
  const mimeType = header.match(/:(.*?);/)?.[1] ?? 'application/octet-stream';
  const buffer   = Buffer.from(b64, 'base64');
  return { buffer, mimeType };
}

/**
 * Supprime un fichier dans MinIO à partir de son URL publique.
 */
export async function deleteFile(publicUrl: string): Promise<void> {
  const prefix = `${PUBLIC_URL.replace(/\/$/, '')}/`;
  if (!publicUrl.startsWith(prefix)) return; // URL externe, ne pas toucher

  const key = publicUrl.slice(prefix.length);
  await minioClient.removeObject(BUCKET, key);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extensionFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg':         '.jpg',
    'image/png':          '.png',
    'image/gif':          '.gif',
    'image/webp':         '.webp',
    'image/svg+xml':      '.svg',
    'audio/mpeg':         '.mp3',
    'audio/ogg':          '.ogg',
    'audio/wav':          '.wav',
    'video/mp4':          '.mp4',
    'video/webm':         '.webm',
    'application/pdf':    '.pdf',
    'application/zip':    '.zip',
  };
  return map[mime] ?? '';
}
