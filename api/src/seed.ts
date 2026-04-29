/**
 * api/src/seed.ts
 * Crée l'administrateur initial si aucun admin n'existe en base.
 * Appelé au démarrage de l'API.
 */

import bcrypt from 'bcryptjs';
import sql from './db';

export async function seedAdmin(): Promise<void> {
  const [existing] = await sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
  if (existing) return;

  const email    = process.env.INITIAL_ADMIN_EMAIL    ?? 'admin@kasuku.app';
  const password = process.env.INITIAL_ADMIN_PASSWORD ?? 'kasuku_admin_2024';
  const name     = process.env.INITIAL_ADMIN_NAME     ?? 'Admin Kasuku';

  if (!password || password === 'changeme_admin_password') {
    console.warn('[SEED] ⚠️  Mot de passe admin par défaut — changer INITIAL_ADMIN_PASSWORD !');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await sql`
    INSERT INTO users (email, name, role, password_hash)
    VALUES (${email.toLowerCase()}, ${name}, 'admin', ${passwordHash})
  `;

  console.info(`[SEED] ✅ Admin créé : ${email}`);
}
