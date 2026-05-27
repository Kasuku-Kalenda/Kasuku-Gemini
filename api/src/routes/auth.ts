/**
 * POST /api/v1/auth/login    — email + mot de passe
 * POST /api/v1/auth/refresh  — renouveler le JWT
 * POST /api/v1/auth/logout   — invalider la session
 * GET  /api/v1/auth/me       — profil utilisateur connecté
 */

import { randomUUID } from 'crypto';
import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import sql from '../db';
import { requireAuth } from '../middleware/auth';

interface LoginBody   { email: string; password: string; }
interface RefreshBody { refreshToken: string; }

// ─── Helper : blacklister un token dans Redis jusqu'à son expiration ──────────
async function blacklistToken(app: FastifyInstance, jti: string, exp: number) {
  const ttl = exp - Math.floor(Date.now() / 1000);
  if (ttl > 0) {
    await app.redis.set(`blacklist:${jti}`, '1', { EX: ttl });
  }
}

function signTokens(app: FastifyInstance, userId: string, email: string, role: string) {
  const accessJti  = randomUUID();
  const refreshJti = randomUUID();

  const accessToken = app.jwt.sign(
    { sub: userId, email, role, jti: accessJti },
    { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' },
  );
  const refreshToken = app.jwt.sign(
    { sub: userId, type: 'refresh', jti: refreshJti },
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d' },
  );
  return { accessToken, refreshToken };
}

export async function authRoutes(app: FastifyInstance) {

  // ── POST /login ───────────────────────────────────────────────────────────
  // Rate limit strict : 10 tentatives / 15 min / IP — anti brute-force
  app.post<{ Body: LoginBody }>('/login', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '15 minutes',
        errorResponseBuilder: () => ({
          statusCode: 429,
          error: 'Too Many Requests',
          message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
        }),
      },
    },
  }, async (req, reply) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return reply.status(400).send({ error: 'Email et mot de passe requis' });
    }

    const [user] = await sql`
      SELECT id, email, name, role, avatar_url, password_hash, is_active
      FROM users
      WHERE email = ${email.toLowerCase()}
      LIMIT 1
    `;

    if (!user || !user.passwordHash) {
      return reply.status(401).send({ error: 'Identifiants invalides' });
    }

    if (!user.isActive) {
      return reply.status(403).send({ error: 'Compte désactivé' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: 'Identifiants invalides' });
    }

    if (!['admin', 'editor'].includes(user.role)) {
      return reply.status(403).send({ error: 'Accès admin requis' });
    }

    // Mise à jour de last_seen_at
    void sql`UPDATE users SET last_seen_at = now() WHERE id = ${user.id}`;

    const { accessToken, refreshToken } = signTokens(app, user.id, user.email, user.role);

    return reply.send({
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, role: user.role },
    });
  });

  // ── POST /refresh ─────────────────────────────────────────────────────────
  app.post<{ Body: RefreshBody }>('/refresh', async (req, reply) => {
    const { refreshToken } = req.body ?? {};
    if (!refreshToken) return reply.status(400).send({ error: 'refreshToken manquant' });

    try {
      const payload = app.jwt.verify(refreshToken) as { sub: string; type: string; jti?: string; exp?: number };
      if (payload.type !== 'refresh') throw new Error('Type invalide');

      // Vérifier que le refresh token n'est pas blacklisté
      if (payload.jti) {
        const revoked = await app.redis.exists(`blacklist:${payload.jti}`);
        if (revoked) return reply.status(401).send({ error: 'Session révoquée' });
      }

      const [user] = await sql`
        SELECT id, email, role, is_active FROM users WHERE id = ${payload.sub} LIMIT 1
      `;
      if (!user || !user.isActive) return reply.status(401).send({ error: 'Utilisateur introuvable' });

      // Rotation : blacklister l'ancien refresh token avant d'émettre le nouveau
      if (payload.jti && payload.exp) {
        await blacklistToken(app, payload.jti, payload.exp);
      }

      return reply.send(signTokens(app, user.id, user.email, user.role));
    } catch {
      return reply.status(401).send({ error: 'Refresh token invalide ou expiré' });
    }
  });

  // ── POST /logout ──────────────────────────────────────────────────────────
  app.post<{ Body: { refreshToken?: string } }>(
    '/logout',
    { preHandler: requireAuth },
    async (req, reply) => {
      // Blacklister l'access token courant
      const access = req.user as { jti?: string; exp?: number };
      if (access.jti && access.exp) {
        await blacklistToken(app, access.jti, access.exp);
      }

      // Blacklister le refresh token si fourni dans le body
      const { refreshToken } = req.body ?? {};
      if (refreshToken) {
        try {
          const rp = app.jwt.verify(refreshToken) as { jti?: string; exp?: number };
          if (rp.jti && rp.exp) await blacklistToken(app, rp.jti, rp.exp);
        } catch { /* refresh token invalide — pas grave */ }
      }

      return reply.send({ message: 'Déconnecté avec succès' });
    },
  );

  // ── GET /me ───────────────────────────────────────────────────────────────
  app.get('/me', { preHandler: requireAuth }, async (req, reply) => {
    const [user] = await sql`
      SELECT id, email, name, role, avatar_url, created_at, last_seen_at
      FROM users
      WHERE id = ${req.authUser!.id}
      LIMIT 1
    `;
    if (!user) return reply.status(404).send({ error: 'Utilisateur introuvable' });
    return reply.send(user);
  });
}
