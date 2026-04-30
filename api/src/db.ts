/**
 * api/src/db.ts — Client PostgreSQL (postgres.js)
 *
 * Singleton partagé dans toute l'application.
 * Les requêtes utilisent des tagged template literals :
 *   const rows = await sql`SELECT * FROM events WHERE id = ${id}`
 * Les valeurs sont automatiquement paramétrées (protection injection SQL).
 */

import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL manquant dans les variables d\'environnement');
}

export const sql = postgres(DATABASE_URL, {
  max:         20,      // taille du pool de connexions
  idle_timeout: 30,     // ferme les connexions inactives après 30s
  connect_timeout: 10,  // timeout de connexion initiale
  transform: {
    // Convertit les colonnes snake_case en camelCase dans les résultats
    // ex: start_date → startDate, created_at → createdAt
    column: {
      from: (col: string) =>
        col.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()),
    },
  },
});

export default sql;
