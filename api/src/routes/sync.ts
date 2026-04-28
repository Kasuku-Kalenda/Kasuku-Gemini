/**
 * api/src/routes/sync.ts
 *
 * Remplace le MOCK_CATALOG de sync.service.ts dans le frontend.
 *
 * GET  /api/v1/sync/catalog          — liste des paquets disponibles
 * GET  /api/v1/sync/packages/:id     — télécharger un paquet (JSON)
 * POST /api/v1/sync/packages/:id/zip — exporter un paquet en ZIP [admin]
 *
 * Un "paquet" de sync = snapshot d'un ensemble de contenus (events, timelines,
 * modules, thèmes) groupés par tag ou région pour le téléchargement offline.
 *
 * Architecture:
 *   • Les paquets sont construits à la demande depuis MongoDB
 *   • Ils peuvent être mis en cache Redis (TTL 1h)
 *   • La structure SyncPackage est compatible avec sync.service.ts (frontend)
 */

import type { FastifyInstance } from 'fastify';
import { Event, Timeline, TrainingModule, Theme } from '../models';
import { requireAdmin } from '../middleware/auth';

// ─── Types (miroir de sync.service.ts frontend) ────────────────────────────────

interface SyncPackage {
  id:          string;
  type:        'events' | 'timelines' | 'themes' | 'modules';
  title:       string;
  description: string;
  itemCount:   number;
  sizeKb:      number;
  lastUpdated: string;
  tags:        string[];
  coverUrl?:   string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function buildCatalog(): Promise<SyncPackage[]> {
  const [eventCount, timelineCount, moduleCount, themeCount] = await Promise.all([
    Event.countDocuments(),
    Timeline.countDocuments({ status: 'published' }),
    TrainingModule.countDocuments(),
    Theme.countDocuments(),
  ]);

  const now = new Date().toISOString();

  return [
    {
      id:          'pkg-events-all',
      type:        'events',
      title:       'Tous les événements',
      description: 'Catalogue complet des événements culturels Kasuku',
      itemCount:   eventCount,
      sizeKb:      eventCount * 5,    // estimation
      lastUpdated: now,
      tags:        ['calendrier', 'culture'],
    },
    {
      id:          'pkg-timelines-published',
      type:        'timelines',
      title:       'Récits publiés',
      description: 'Toutes les timelines narratives publiées',
      itemCount:   timelineCount,
      sizeKb:      timelineCount * 20,
      lastUpdated: now,
      tags:        ['histoire', 'narratif'],
    },
    {
      id:          'pkg-modules-all',
      type:        'modules',
      title:       'Modules de formation',
      description: 'Catalogue complet des modules pédagogiques',
      itemCount:   moduleCount,
      sizeKb:      moduleCount * 15,
      lastUpdated: now,
      tags:        ['formation', 'académie'],
    },
    {
      id:          'pkg-themes-all',
      type:        'themes',
      title:       'Thèmes',
      description: 'Référentiel des thèmes culturels',
      itemCount:   themeCount,
      sizeKb:      themeCount * 1,
      lastUpdated: now,
      tags:        ['référentiel'],
    },
  ];
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function syncRoutes(app: FastifyInstance) {

  // GET /catalog — liste des paquets disponibles
  app.get('/catalog', async (_req, reply) => {
    const catalog = await buildCatalog();
    return reply.send(catalog);
  });

  // GET /packages/:id — contenu d'un paquet
  app.get<{ Params: { id: string } }>('/packages/:id', async (req, reply) => {
    const { id } = req.params;

    let data: unknown;
    let type: string;

    switch (id) {
      case 'pkg-events-all':
        data = await Event.find().lean();
        type = 'events';
        break;

      case 'pkg-timelines-published':
        data = await Timeline.find({ status: 'published' }).lean();
        type = 'timelines';
        break;

      case 'pkg-modules-all':
        data = await TrainingModule.find().lean();
        type = 'modules';
        break;

      case 'pkg-themes-all':
        data = await Theme.find().lean();
        type = 'themes';
        break;

      default:
        return reply.status(404).send({ error: 'Paquet introuvable' });
    }

    const items = (data as Array<{ _id: unknown }>).map(item => ({
      ...item,
      id:  item._id?.toString(),
      source: { type: 'central', id: 'kasuku_core', syncedAt: new Date().toISOString() },
    }));

    return reply.send({
      packageId:  id,
      type,
      items,
      syncedAt:   new Date().toISOString(),
      itemCount:  items.length,
    });
  });

  // POST /packages/:id/zip — générer un ZIP pour usage offline [admin]
  app.post<{ Params: { id: string } }>('/packages/:id/zip', {
    preHandler: requireAdmin,
  }, async (req, reply) => {
    // Extension future: générer un ZIP avec archiver et l'uploader sur MinIO
    return reply.status(501).send({
      error: 'Export ZIP non encore implémenté',
      hint:  'Utilisez GET /packages/:id pour le JSON brut',
    });
  });
}
