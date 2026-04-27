/**
 * core/db/database.ts — Canonical import path for the KasukuDB singleton.
 *
 * Import from here in new code:
 *   import { db, KasukuDB } from '../core/db/database';
 *
 * The underlying implementation lives in services/db.ts and is unchanged.
 */

export { db, KasukuDB } from '../../services/db';
