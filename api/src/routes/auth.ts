/**
 * api/src/routes/auth.ts
 *
 * Authentification Kasuku:
 *   POST /api/v1/auth/login         — email + mot de passe
 *   POST /api/v1/auth/refresh       — renouveler le token JWT
 *   POST /api/v1/auth/logout        — invalider la session (Redis)
 *   GET  /api/v1/auth/me            — profil de l'utilisateur connecté
 *   GET  /api/v1/auth/google        — initier OAuth Google
 *   GET  /api/v1/auth/google/callback — callback Google OAuth
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { User } from '../models';
import { requireAuth } from '../middleware/auth';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LoginBody { email: string; password: string; }
interface RefreshBody { refreshToken: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function signTokens(app: FastifyInstance, userId: string, email: string, role: string) {
  const accessToken = app.jwt.sign(
    { sub: userId, email, role },
    { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' },
  );
  const refreshToken = app.jwt.sign(
    { sub: userId, type: 'refresh' },
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d' },
  );
  return { accessToken, refreshToken };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function authRoutes(app: FastifyInstance) {

  // POST /login
  app.post<{ Body: LoginBody }>('/login', async (req, reply) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email et mot de passe requis' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) {
      return reply.status(401).send({ error: 'Identifiants invalides' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: 'Identifiants invalides' });
    }

    if (!['SUPERADMIN', 'EDITOR'].includes(user.role)) {
      return reply.status(403).send({ error: 'Accès admin requis' });
    }

    const { accessToken, refreshToken } = signTokens(app, user._id.toString(), user.email, user.role);

    return reply.send({
      accessToken,
      refreshToken,
      user: {
        id:    user._id.toString(),
        name:  user.name,
        email: user.email,
        image: user.image,
        role:  user.role,
      },
    });
  });

  // POST /refresh
  app.post<{ Body: RefreshBody }>('/refresh', async (req, reply) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return reply.status(400).send({ error: 'refreshToken manquant' });

    try {
      const payload = app.jwt.verify(refreshToken) as { sub: string; type: string };
      if (payload.type !== 'refresh') throw new Error('Token type invalide');

      const user = await User.findById(payload.sub);
      if (!user) return reply.status(401).send({ error: 'Utilisateur introuvable' });

      const tokens = signTokens(app, user._id.toString(), user.email, user.role);
      return reply.send(tokens);
    } catch {
      return reply.status(401).send({ error: 'Refresh token invalide ou expiré' });
    }
  });

  // POST /logout  (côté serveur: liste noire Redis si nécessaire)
  app.post('/logout', { preHandler: requireAuth }, async (_req, reply) => {
    // En stateless JWT, le logout se fait côté client (supprimer le token).
    // Extension possible: blacklist du JTI dans Redis.
    return reply.send({ message: 'Déconnecté avec succès' });
  });

  // GET /me
  app.get('/me', { preHandler: requireAuth }, async (req, reply) => {
    const user = await User.findById(req.authUser!.id).select('-passwordHash').lean();
    if (!user) return reply.status(404).send({ error: 'Utilisateur introuvable' });

    return reply.send({
      id:    user._id.toString(),
      name:  user.name,
      email: user.email,
      image: user.image,
      role:  user.role,
    });
  });

}
