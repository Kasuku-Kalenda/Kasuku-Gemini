/**
 * api/src/middleware/auth.ts
 * Middleware Fastify pour l'authentification JWT + PostgreSQL.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import sql from '../db';

// ─── Augmentation du type FastifyRequest ─────────────────────────────────────

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: {
      id:    string;
      email: string;
      role:  'admin' | 'editor' | 'contributor' | 'viewer';
    };
  }
}

// ─── requireAuth ─────────────────────────────────────────────────────────────

export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await req.jwtVerify();
    const payload = req.user as { sub: string; email: string; role: string; jti?: string };
    if (!payload?.sub) {
      return reply.status(401).send({ error: 'Token invalide' });
    }

    // Vérifier la blacklist Redis (logout / révocation)
    if (payload.jti) {
      const revoked = await (req.server as any).redis?.exists(`blacklist:${payload.jti}`);
      if (revoked) {
        return reply.status(401).send({ error: 'Session révoquée — reconnectez-vous' });
      }
    }

    const [user] = await sql`
      SELECT id, email, role, is_active
      FROM users
      WHERE id = ${payload.sub}
      LIMIT 1
    `;

    if (!user || !user.isActive) {
      return reply.status(401).send({ error: 'Utilisateur introuvable ou désactivé' });
    }

    req.authUser = { id: user.id, email: user.email, role: user.role };
  } catch {
    return reply.status(401).send({ error: 'Non authentifié' });
  }
}

// ─── requireAdmin (admin ou editor) ──────────────────────────────────────────

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  await requireAuth(req, reply);
  if (reply.sent) return;
  if (!req.authUser || !['admin', 'editor'].includes(req.authUser.role)) {
    return reply.status(403).send({ error: 'Accès réservé aux éditeurs' });
  }
}

// ─── requireSuperAdmin (admin uniquement) ────────────────────────────────────

export async function requireSuperAdmin(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  await requireAuth(req, reply);
  if (reply.sent) return;
  if (!req.authUser || req.authUser.role !== 'admin') {
    return reply.status(403).send({ error: 'Accès réservé aux administrateurs' });
  }
}
