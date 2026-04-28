/**
 * api/src/index.ts — Point d'entrée de l'API Kasuku
 *
 * Stack: Fastify + Mongoose (MongoDB) + Redis + MinIO
 * Préfixe: /api/v1
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import mongoose from 'mongoose';
import { createClient, type RedisClientType } from 'redis';

import { authRoutes }     from './routes/auth';
import { eventsRoutes }   from './routes/events';
import { timelinesRoutes } from './routes/timelines';
import { modulesRoutes }  from './routes/modules';
import { themesRoutes }   from './routes/themes';
import { featuredRoutes } from './routes/featured';
import { syncRoutes }     from './routes/sync';
import { uploadRoutes }   from './routes/upload';
import { kalendaRoutes }  from './routes/kalenda';
import { moodleRoutes }   from './routes/moodle';
import { seedAdmin }      from './seed';

// ─── Augmentation de type Fastify (décorateur redis) ─────────────────────────

declare module 'fastify' {
  interface FastifyInstance {
    redis: RedisClientType;
  }
}

// ─── Config ──────────────────────────────────────────────────────────────────

const PORT   = parseInt(process.env.API_PORT ?? '4000', 10);
const HOST   = '0.0.0.0';
const PREFIX = '/api/v1';

const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? 'http://localhost')
  .split(',')
  .map(o => o.trim());

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
      transport: process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
        : undefined,
    },
  });

  // ─── Plugins globaux ────────────────────────────────────────────────────────

  await app.register(cors, {
    origin: CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'dev_secret_change_me',
    sign: { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' },
  });

  await app.register(multipart, {
    limits: {
      fileSize: 512 * 1024 * 1024, // 512 MB
      files: 10,
    },
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

  // ─── Connexion MongoDB ──────────────────────────────────────────────────────

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error('MONGODB_URI manquant dans les variables d\'environnement');

  mongoose.connection.on('connected',    () => app.log.info('MongoDB connecté'));
  mongoose.connection.on('disconnected', () => app.log.warn('MongoDB déconnecté'));
  mongoose.connection.on('error',        (err) => app.log.error({ err }, 'Erreur MongoDB'));

  await mongoose.connect(MONGODB_URI, {
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 5_000,
    socketTimeoutMS: 45_000,
  });

  // ─── Redis ──────────────────────────────────────────────────────────────────

  const redis = createClient({ url: process.env.REDIS_URL ?? 'redis://redis:6379' }) as RedisClientType;
  redis.on('error', (err: Error) => app.log.error({ err }, 'Redis error'));
  await redis.connect();
  app.decorate('redis', redis);

  // ─── Health check (sans préfixe pour load balancer / Docker) ───────────────

  app.get('/health', async () => ({
    status:    'ok',
    timestamp: new Date().toISOString(),
    db:        mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  }));

  // ─── Routes ─────────────────────────────────────────────────────────────────

  await app.register(authRoutes,      { prefix: `${PREFIX}/auth`      });
  await app.register(eventsRoutes,    { prefix: `${PREFIX}/events`    });
  await app.register(timelinesRoutes, { prefix: `${PREFIX}/timelines` });
  await app.register(modulesRoutes,   { prefix: `${PREFIX}/modules`   });
  await app.register(themesRoutes,    { prefix: `${PREFIX}/themes`    });
  await app.register(featuredRoutes,  { prefix: `${PREFIX}/featured`  });
  await app.register(syncRoutes,      { prefix: `${PREFIX}/sync`      });
  await app.register(uploadRoutes,    { prefix: `${PREFIX}/upload`    });
  await app.register(kalendaRoutes,   { prefix: `${PREFIX}/kalendas`  });
  await app.register(moodleRoutes,    { prefix: `${PREFIX}/moodle`    });

  // ─── Seed admin initial ─────────────────────────────────────────────────────

  await seedAdmin();

  // ─── Démarrage ──────────────────────────────────────────────────────────────

  await app.listen({ port: PORT, host: HOST });
  app.log.info(`API Kasuku démarrée sur http://${HOST}:${PORT}`);

  // ─── Graceful shutdown ───────────────────────────────────────────────────────

  const shutdown = async (signal: string) => {
    app.log.info(`Signal ${signal} reçu — arrêt en cours...`);
    await app.close();
    await mongoose.disconnect();
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
