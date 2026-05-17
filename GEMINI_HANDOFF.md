Handoff Gemini Code Assist — Kasuku Cultural Calendar
Contexte projet
Kasuku est une application web culturelle et éducative dédiée à l'histoire africaine. Elle permet d'explorer des événements historiques via un calendrier, des récits narratifs (timelines), des modules de formation, et un système de favoris. Développée pour Afrikia.org.
Stack :
Frontend : React 18 + TypeScript + Vite + Tailwind CSS + React Hook Form + Zod
API : Fastify + Mongoose (MongoDB) + MinIO (stockage fichiers) + Redis + JWT
Infrastructure : Docker Compose (nginx, frontend, api, mongo, minio, redis)
Déploiement local : http://localhost via nginx reverse proxy

Architecture
/
├── shell/
│   ├── UserApp.tsx          # Router SPA côté utilisateur (state machine view)
│   └── AdminApp.tsx         # Router SPA côté admin
├── pages/                   # Pages publiques et admin
├── components/              # Composants UI réutilisables
│   ├── admin/               # Formulaires admin (EventForm, TimelineForm, CourseBuilder…)
│   ├── home/                # FeaturedStories (stories Instagram-like)
│   └── ui/                  # Primitives (Button, Badge, Sheet, Dialog, Tabs…)
├── hooks/                   # useFavorites, useAuth
├── services/
│   ├── api.ts               # API publique (getEvents, getTimelines, getEventBySlug…)
│   ├── adminApi.ts          # API admin
│   └── apiClient.ts         # Fetch wrapper + uploadFile() vers MinIO
├── api/src/
│   ├── models/index.ts      # Schémas Mongoose (Event, Timeline, TrainingModule…)
│   ├── routes/              # Fastify routes (events, timelines, modules, upload…)
│   ├── middleware/auth.ts   # JWT verify
│   └── storage/minio.ts    # Upload MinIO
└── types.ts                 # Types TypeScript partagés frontend

Navigation : pas de React Router. UserApp.tsx gère une machine d'état (view + payload) avec useCallback navigate*. Toute la navigation est impérative via des fonctions.

Travail récent (à reviewer)
Deux passes ont déjà eu lieu :
Claude (features) — branche claude/jovial-mayer-29de82 :
Fix upload : FileReader → uploadFile() via MinIO dans tous les formulaires admin
Fix API : détection champs base64 dans POST/PUT (retour 400 avec chemin précis)
Résolution bidirectionnelle timeline↔événement dans l'API
Optimisation mobile complète (safe areas iOS, touch targets, BottomNav, Sheet…)
Page Sauvegardes refondue (3 onglets : Événements / Récits / Modules)
Modes d'affichage grille/liste/couvertures + tri + recherche sur 3 pages

Codex (qualité) — branche codex/quality-fixes-public-api :
Parsing YYYY-MM-DD timezone-safe dans api/src/routes/events.ts
Ajout getEventBySlug() dans services/api.ts
Fallback fetch par slug pour événements featured hors cache
Correction champ shortDescription → summary dans ModulesIndexPage

Les deux branches sont mergées sur main. HEAD = 6d5cb84.

Zones sensibles identifiées — cibles prioritaires pour la review
🔴 Critique
api/src/routes/events.ts — findBase64Fields() dupliquée
La même fonction existe à l'identique dans events.ts et timelines.ts. À extraire dans api/src/utils/validation.ts.
api/src/routes/events.ts — resolveTimelineSlugs() non cachée
Appelée dans 3 routes GET. Fait 2 requêtes MongoDB en parallèle à chaque appel. Pas de cache. Si la liste d'événements grossit, ça pèse à chaque rendu de liste.
hooks/useFavorites.ts — localStorage sans versioning de schéma
Si la structure de FavItem change, les données existantes en localStorage sont chargées sans migration. Risque de crash silencieux.
api/src/middleware/auth.ts — à auditer
JWT verify custom. Vérifier : expiration bien contrôlée, refresh token géré, pas de secret hardcodé.

🟡 Important
api/src/routes/timelines.ts — pas de pagination sur GET /timelines
components/ui/Sheet.tsx — accessibilité incomplète (WCAG)
pages/admin/AdminKalendaPage.tsx — 699 lignes (Refactoring nécessaire)
services/adminApi.ts — 116 lignes mais logique dense
pages/ModulesIndexPage.tsx — vue Liste inline (à extraire en ModuleCardList.tsx)

🟢 Mineur / À noter
index.css — variables safe area injectées par JS
Tri client-side dans HomePage et TimelineListingPage
Pas de tests (unitaires ou e2e)

Workflow Git en place
main                    ← branche stable, toujours deployable
gemini/review-[sujet]   ← review actuelle

Commandes utiles
cd "/Users/Apple/Documents/Kasuku App/kasuku-cultural-calendar-170426"
docker compose up -d
docker compose build frontend api && docker compose up -d frontend api && docker compose restart nginx
docker compose logs -f api
npx tsc --noEmit

Accès
http://localhost        # app publique
http://localhost/admin  # admin
http://localhost:9001   # MinIO console

Attentes de la review Gemini
Sécurité API, Robustesse, Performance (N+1), Accessibilité, Architecture, Docker.
