/**
 * api/src/index.ts — Point d'entrée Kasuku API v2
 * Stack : Fastify + PostgreSQL (postgres.js) + Redis + MinIO
 * Préfixe : /api/v1
 */

import Fastify from 'fastify';
import cors        from '@fastify/cors';
import jwt         from '@fastify/jwt';
import multipart   from '@fastify/multipart';
import rateLimit   from '@fastify/rate-limit';
import { createClient, type RedisClientType } from 'redis';

import sql from './db';
import { seedAdmin } from './seed';

import { authRoutes }         from './routes/auth';
import { eventsRoutes }       from './routes/events';
import { timelinesRoutes }    from './routes/timelines';
import { modulesRoutes }      from './routes/modules';
import { themesRoutes }       from './routes/themes';
import { mediaRoutes }        from './routes/media';
import { peopleRoutes }       from './routes/people';
import { placesRoutes }       from './routes/places';
import { translationsRoutes } from './routes/translations';
import { kalendaRoutes }      from './routes/kalenda';
import { uploadRoutes }       from './routes/upload';
import { featuredRoutes }     from './routes/featured';

// ─── Décorateur Redis ─────────────────────────────────────────────────────────

declare module 'fastify' {
  interface FastifyInstance { redis: RedisClientType; }
}

// ─── Config ───────────────────────────────────────────────────────────────────

const PORT   = parseInt(process.env.API_PORT ?? '4000', 10);
const HOST   = '0.0.0.0';
const PREFIX = '/api/v1';

const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? 'http://localhost')
  .split(',').map(o => o.trim());

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap() {
  const app = Fastify({
    bodyLimit: 50 * 1024 * 1024,
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
      transport: process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
        : undefined,
    },
  });

  // ── Plugins ───────────────────────────────────────────────────────────────

  await app.register(cors, {
    origin: CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'dev_secret_change_me',
    sign:   { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' },
  });

  await app.register(multipart, {
    limits: { fileSize: 512 * 1024 * 1024, files: 10 },
  });

  await app.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Trop de requêtes. Réessayez dans une minute.',
    }),
  });

  // ── PostgreSQL — vérification connexion ───────────────────────────────────

  try {
    await sql`SELECT 1`;
    app.log.info('PostgreSQL connecté');
  } catch (err) {
    app.log.error({ err }, 'Impossible de se connecter à PostgreSQL');
    process.exit(1);
  }

  // ── Redis ─────────────────────────────────────────────────────────────────

  const redis = createClient({ url: process.env.REDIS_URL ?? 'redis://redis:6379' }) as RedisClientType;
  redis.on('error', (err: Error) => app.log.error({ err }, 'Redis error'));
  await redis.connect();
  app.decorate('redis', redis);
  app.log.info('Redis connecté');

  // ── Health check ──────────────────────────────────────────────────────────

  const healthHandler = async () => {
    const [pgRow] = await sql`SELECT 1 AS ok`.catch(() => [null]);
    return {
      status:    'ok',
      timestamp: new Date().toISOString(),
      postgres:  pgRow ? 'connected' : 'error',
      redis:     redis.isReady ? 'connected' : 'error',
    };
  };

  // Accessible depuis le container (docker healthcheck) ET depuis nginx (/api/v1/health)
  app.get('/health',            healthHandler);
  app.get(`${PREFIX}/health`,   healthHandler);

  // ── Routes ────────────────────────────────────────────────────────────────

  await app.register(authRoutes,         { prefix: `${PREFIX}/auth`         });
  await app.register(eventsRoutes,       { prefix: `${PREFIX}/events`       });
  await app.register(timelinesRoutes,    { prefix: `${PREFIX}/timelines`    });
  await app.register(modulesRoutes,      { prefix: `${PREFIX}/modules`      });
  await app.register(themesRoutes,       { prefix: `${PREFIX}/themes`       });
  await app.register(mediaRoutes,        { prefix: `${PREFIX}/media`        });
  await app.register(peopleRoutes,       { prefix: `${PREFIX}/people`       });
  await app.register(placesRoutes,       { prefix: `${PREFIX}/places`       });
  await app.register(translationsRoutes, { prefix: `${PREFIX}/translations` });
  await app.register(kalendaRoutes,      { prefix: `${PREFIX}/kalendas`     });
  await app.register(uploadRoutes,       { prefix: `${PREFIX}/upload`       });
  await app.register(featuredRoutes,     { prefix: `${PREFIX}/featured`     });

  // ── Seed admin initial ────────────────────────────────────────────────────

  await seedAdmin();

  // ── Démarrage ─────────────────────────────────────────────────────────────

  await app.listen({ port: PORT, host: HOST });
  app.log.info(`✅  API Kasuku démarrée sur http://${HOST}:${PORT}`);

  // ── Graceful shutdown ─────────────────────────────────────────────────────

  const shutdown = async (signal: string) => {
    app.log.info(`Signal ${signal} — arrêt en cours...`);
    await app.close();
    await sql.end();
    await redis.disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
  process.on('SIGINT',  () => { void shutdown('SIGINT');  });
}

bootstrap().catch((err: unknown) => {
  console.error('Erreur fatale au démarrage:', err);
  process.exit(1);
});
