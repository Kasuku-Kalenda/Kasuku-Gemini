/**
 * api/src/middleware/auth.ts
 *
 * Middleware Fastify pour l'authentification JWT.
 * Décorateur `requireAuth`  → vérifie le token, injecte req.user
 * Décorateur `requireAdmin` → vérifie que le rôle est SUPERADMIN ou EDITOR
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../models';

// ─── Augmentation du type FastifyRequest ──────────────────────────────────────

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: {
      id: string;
      email: string;
      role: 'SUPERADMIN' | 'EDITOR' | 'VIEWER';
    };
  }
}

// ─── requireAuth ──────────────────────────────────────────────────────────────

export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await req.jwtVerify();

    // jwtVerify décode et stocke le payload dans req.user (Fastify JWT convention)
    const payload = req.user as { sub: string; email: string; role: string };
    if (!payload?.sub) {
      return reply.status(401).send({ error: 'Token invalide' });
    }

    // Vérifier que l'utilisateur existe toujours en base
    const user = await User.findById(payload.sub).lean();
    if (!user) {
      return reply.status(401).send({ error: 'Utilisateur introuvable' });
    }

    req.authUser = {
      id:    user._id.toString(),
      email: user.email,
      role:  user.role as 'SUPERADMIN' | 'EDITOR' | 'VIEWER',
    };
  } catch {
    return reply.status(401).send({ error: 'Non authentifié' });
  }
}

// ─── requireAdmin ─────────────────────────────────────────────────────────────

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  await requireAuth(req, reply);
  if (reply.sent) return;

  if (!req.authUser || !['SUPERADMIN', 'EDITOR'].includes(req.authUser.role)) {
    return reply.status(403).send({ error: 'Accès réservé aux administrateurs' });
  }
}

// ─── requireSuperAdmin ────────────────────────────────────────────────────────

export async function requireSuperAdmin(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  await requireAuth(req, reply);
  if (reply.sent) return;

  if (!req.authUser || req.authUser.role !== 'SUPERADMIN') {
    return reply.status(403).send({ error: 'Accès réservé aux super-administrateurs' });
  }
}
