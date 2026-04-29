/**
 * api/src/utils/slug.ts
 * Génération et unicité de slugs.
 */

import slugify from 'slugify';
import sql from '../db';

export function toSlug(title: string): string {
  return slugify(title, { lower: true, strict: true, locale: 'fr' });
}

/**
 * Garantit l'unicité du slug dans une table donnée.
 * Si "mon-slug" existe → essaie "mon-slug-2", "mon-slug-3"...
 */
export async function uniqueSlug(
  table: 'events' | 'stories' | 'modules' | 'themes' | 'people' | 'places' | 'kalendas' | 'media' | 'tags',
  base:  string,
  excludeId?: string,
): Promise<string> {
  const baseSlug = toSlug(base);
  let candidate = baseSlug;
  let i = 2;

  while (true) {
    const rows = excludeId
      ? await sql`SELECT id FROM ${sql(table)} WHERE slug = ${candidate} AND id != ${excludeId} LIMIT 1`
      : await sql`SELECT id FROM ${sql(table)} WHERE slug = ${candidate} LIMIT 1`;

    if (rows.length === 0) return candidate;
    candidate = `${baseSlug}-${i++}`;
  }
}
