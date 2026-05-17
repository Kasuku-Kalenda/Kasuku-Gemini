/**
 * POST /api/v1/push/register  — enregistrer un token FCM
 * POST /api/v1/push/send      — envoyer une notification (admin uniquement)
 * DELETE /api/v1/push/token   — supprimer un token (logout / désabonnement)
 */

import type { FastifyInstance } from 'fastify';
import sql from '../db';
import { requireAuth } from '../middleware/auth';

// ─── FCM via HTTP v1 API ──────────────────────────────────────────────────────
// Utilise FIREBASE_PROJECT_ID + GOOGLE_APPLICATION_CREDENTIALS (service account)

async function getAccessToken(): Promise<string> {
  // En production : utiliser google-auth-library
  // Pour l'instant : token depuis variable d'env (généré manuellement ou via CI)
  const token = process.env.FIREBASE_SERVER_KEY;
  if (!token) throw new Error('FIREBASE_SERVER_KEY non défini');
  return token;
}

async function sendFcmNotification(token: string, title: string, body: string, data?: Record<string, string>) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('FIREBASE_PROJECT_ID non défini');

  const accessToken = await getAccessToken();

  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
        android: {
          notification: {
            icon: 'ic_launcher',
            color: '#E67E22',
            channel_id: 'kasuku-default',
          },
        },
        data: data ?? {},
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`FCM error: ${err}`);
  }
  return res.json();
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function pushRoutes(app: FastifyInstance) {

  // ── POST /register — enregistrer le token d'un device ────────────────────
  app.post<{
    Body: { token: string; platform?: string; deviceId?: string }
  }>('/register', async (req, reply) => {
    const { token, platform = 'android', deviceId } = req.body;

    if (!token || typeof token !== 'string') {
      return reply.status(400).send({ error: 'token requis' });
    }

    // Récupérer l'user connecté si présent (optionnel)
    let userId: string | null = null;
    try {
      await req.jwtVerify();
      userId = (req.user as any).sub ?? null;
    } catch {
      // Anonyme — pas d'erreur, on enregistre quand même
    }

    await sql`
      INSERT INTO push_tokens (token, platform, user_id, device_id, updated_at)
      VALUES (${token}, ${platform}, ${userId}, ${deviceId ?? null}, NOW())
      ON CONFLICT (token) DO UPDATE
        SET user_id    = EXCLUDED.user_id,
            device_id  = EXCLUDED.device_id,
            updated_at = NOW()
    `;

    return reply.status(201).send({ ok: true });
  });

  // ── DELETE /token — supprimer un token (logout) ───────────────────────────
  app.delete<{
    Body: { token: string }
  }>('/token', async (req, reply) => {
    const { token } = req.body;
    if (!token) return reply.status(400).send({ error: 'token requis' });

    await sql`DELETE FROM push_tokens WHERE token = ${token}`;
    return reply.send({ ok: true });
  });

  // ── POST /send — envoyer une notif (admin uniquement) ────────────────────
  app.post<{
    Body: {
      title: string;
      body: string;
      target: 'all' | 'user';
      userId?: string;
      data?: Record<string, string>;
    }
  }>('/send', { preHandler: [requireAuth] }, async (req, reply) => {
    const user = req.user as any;
    if (user.role !== 'admin') {
      return reply.status(403).send({ error: 'Réservé aux admins' });
    }

    const { title, body, target, userId, data } = req.body;

    // Récupérer les tokens cibles
    const tokens = target === 'user' && userId
      ? await sql<{ token: string }[]>`SELECT token FROM push_tokens WHERE user_id = ${userId}`
      : await sql<{ token: string }[]>`SELECT token FROM push_tokens`;

    if (tokens.length === 0) {
      return reply.send({ ok: true, sent: 0, message: 'Aucun token enregistré' });
    }

    // Envoyer en parallèle (max 500 par batch FCM)
    const results = await Promise.allSettled(
      tokens.map(({ token }) => sendFcmNotification(token, title, body, data))
    );

    const sent    = results.filter(r => r.status === 'fulfilled').length;
    const failed  = results.filter(r => r.status === 'rejected').length;

    app.log.info(`Push envoyé : ${sent} succès, ${failed} échecs`);
    return reply.send({ ok: true, sent, failed });
  });
}
