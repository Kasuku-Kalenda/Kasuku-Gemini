/**
 * POST /api/v1/push/register  — enregistrer un token FCM
 * POST /api/v1/push/send      — envoyer une notification (admin uniquement)
 * DELETE /api/v1/push/token   — supprimer un token (logout / désabonnement)
 */

import type { FastifyInstance } from 'fastify';
import sql from '../db';
import { requireAuth } from '../middleware/auth';
import { GoogleAuth } from 'google-auth-library';

// ─── FCM via HTTP v1 API ──────────────────────────────────────────────────────
// Utilise GOOGLE_APPLICATION_CREDENTIALS (chemin vers le JSON du service account)
// ou FIREBASE_SERVICE_ACCOUNT_JSON (contenu JSON inline)

let _auth: GoogleAuth | null = null;

async function getAccessToken(): Promise<string> {
  // Initialiser GoogleAuth une seule fois
  if (!_auth) {
    const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (inlineJson) {
      // Credentials inline (pratique pour Docker/CI)
      const credentials = JSON.parse(inlineJson);
      _auth = new GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Fichier JSON service account (chemin dans l'env)
      _auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
      });
    } else {
      throw new Error(
        'FCM auth manquante : définir FIREBASE_SERVICE_ACCOUNT_JSON (JSON inline) ' +
        'ou GOOGLE_APPLICATION_CREDENTIALS (chemin fichier service account)'
      );
    }
  }
  const client = await _auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error('Impossible d\'obtenir un token OAuth2 Google');
  return token.token;
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
