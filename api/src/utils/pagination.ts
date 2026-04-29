/**
 * api/src/utils/pagination.ts
 * Helpers de pagination partagés par toutes les routes listées.
 */

export interface PaginationParams {
  page:  number;
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  items:      T[];
  page:       number;
  totalPages: number;
  totalItems: number;
}

/** Extrait et valide les paramètres de pagination depuis la query string. */
export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const page  = Math.max(1, parseInt(String(query.page  ?? 1),  10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(String(query.limit ?? 20), 10) || 20));
  return { page, limit, offset: (page - 1) * limit };
}

/** Construit l'objet de réponse paginée. */
export function paginate<T>(
  items:      T[],
  totalItems: number,
  params:     PaginationParams,
): PaginatedResult<T> {
  return {
    items,
    page:       params.page,
    totalPages: Math.ceil(totalItems / params.limit) || 1,
    totalItems,
  };
}
