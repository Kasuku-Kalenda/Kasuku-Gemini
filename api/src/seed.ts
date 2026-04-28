/**
 * api/src/seed.ts
 *
 * Crée l'administrateur initial si aucun SUPERADMIN n'existe en base.
 * Appelé au démarrage de l'API.
 */

import bcrypt from 'bcryptjs';
import { User } from './models';

export async function seedAdmin(): Promise<void> {
  const adminExists = await User.exists({ role: 'SUPERADMIN' });
  if (adminExists) return;

  const email    = process.env.INITIAL_ADMIN_EMAIL    ?? 'admin@kasuku.app';
  const password = process.env.INITIAL_ADMIN_PASSWORD ?? 'kasuku_admin_2024';
  const name     = process.env.INITIAL_ADMIN_NAME     ?? 'Admin Kasuku';

  if (!password || password === 'changeme_admin_password') {
    console.warn('[SEED] ⚠️  Mot de passe admin par défaut — changer INITIAL_ADMIN_PASSWORD !');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await User.create({ email, name, passwordHash, role: 'SUPERADMIN' });

  console.info(`[SEED] ✅ Admin créé: ${email}`);
}
