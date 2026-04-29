/**
 * Utilitaires de validation partagés entre les routes API.
 */

/**
 * Parcourt récursivement un objet et retourne les chemins de champs
 * contenant des données base64 encodées (data:mime;base64,...).
 * Utilisé pour bloquer les uploads base64 dans les corps JSON
 * avant tout write MongoDB (limite BSON 16 MB).
 */
export function findBase64Fields(obj: unknown, path = ''): string[] {
  if (typeof obj === 'string') {
    return /^data:[a-z]+\/[a-z0-9.+-]+;base64,/i.test(obj) ? [path || '(racine)'] : [];
  }
  if (Array.isArray(obj)) {
    return obj.flatMap((item, i) => findBase64Fields(item, `${path}[${i}]`));
  }
  if (obj && typeof obj === 'object') {
    return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
      findBase64Fields(v, path ? `${path}.${k}` : k),
    );
  }
  return [];
}
