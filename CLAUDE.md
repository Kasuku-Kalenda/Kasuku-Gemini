# CLAUDE.md — Agent Instructions · Kasuku Cultural Calendar

Tu es un agent de développement rigoureux et autonome pour le projet **Kasuku Cultural Calendar**.
Pour optimiser les sessions, éviter de répéter les mêmes erreurs et capitaliser sur nos échanges,
tu dois impérativement créer, consulter et mettre à jour deux fichiers de suivi à la racine du projet :
`MEMORY.md` et `ERRORS.md`.

---

## DIRECTIVE 1 — GESTION DE SESSION (MEMORY.md)

À la fin de chaque session ou dès qu'une tâche significative est terminée, ajoute une entrée dans `MEMORY.md` :

```
# SESSION END — <date>
- **Travaillé sur :** <fonctionnalité ou problème traité>
- **Terminé :** <tâches accomplies>
- **En cours :** <tâches inachevées>
- **Décisions :** <décisions architecturales ou de logique métier>
- **Prochaine session :** <prochaines étapes claires>
```

---

## DIRECTIVE 2 — LOG DES ERREURS (ERRORS.md)

Dès qu'une approche échoue **plus de 2 fois consécutives**, documenter dans `ERRORS.md` AVANT de proposer autre chose.
Consulter `ERRORS.md` avant de suggérer des approches à des tâches similaires.

Format :
```
## <date> — <titre court>
- **Tâche :** <ce qu'on essayait d'accomplir>
- **Échoué :** <ce qui n'a pas fonctionné et pourquoi>
- **Marché :** <l'alternative qui a fonctionné>
- **Retenir :** <règle absolue pour éviter de reproduire>
```

---

## DIRECTIVE 3 — INVARIANTS DU PROJET

- **Dossier de déploiement unique** — Tout tourne depuis `/opt/kasuku` sur `root@77.42.76.120`. ⚠️ `/opt/kasuku-staging` est un checkout ABANDONNÉ (drift nginx non commité, ne PAS l'utiliser).
- **3 projets compose dans `/opt/kasuku`** (orchestrés par Coolify / `coolify-proxy` = Traefik) :
  - `kasuku-staging` → `docker-compose.staging.yml` → `staging.kasuku.afrikia.org`
  - `kasuku-prod` → `docker-compose.coolify.yml` → `kasuku.afrikia.org`
- **Staging avant prod** — Tout changement passe par `staging.kasuku.afrikia.org` avant `kasuku.afrikia.org`.
- **Jamais Coolify Redeploy** — Le bouton Redeploy de l'UI Coolify est interdit. Rebuild manuel via SSH uniquement (commandes ci-dessous).
- **Symlink `.env`** — `/opt/kasuku/.env` est un symlink → `.env.prod`. Compose interpole les secrets depuis `.env` (`${POSTGRES_PASSWORD}`, `${JWT_SECRET}`, `${POSTGRES_DB:-kasuku_db}`…). Vérifier `ls -la /opt/kasuku/.env` avant tout `docker compose up`. Pour déployer staging, passer explicitement `--env-file .env.staging` (ne PAS reposer sur le symlink).
- **Commande de déploiement par-env** (chirurgical, `--no-deps` = ne rebuild que les services changés) :
  ```bash
  cd /opt/kasuku
  docker compose --env-file .env.<env> -f docker-compose.<env>.yml -p kasuku-<env> up -d --build --no-deps <services>
  docker compose --env-file .env.<env> -f docker-compose.<env>.yml -p kasuku-<env> restart nginx
  # <env> = staging | prod ; <fichier> staging.yml ou coolify.yml ; <services> = api frontend …
  ```
- **Restart nginx après redeploy** — `docker compose ... restart nginx` sinon Traefik perd la route (504).
- **Ne jamais casser ce qui marche** — lire le fichier avant d'éditer, vérifier le build avant de commit. Ne jamais dumper les VALEURS de secrets (masquer).
- **postgres.js TRANSFORME les noms de colonnes en camelCase** — `api/src/db.ts` configure `transform.column.from` (snake_case → camelCase) sur TOUTES les colonnes de résultat. Côté JS on lit donc **toujours du camelCase**, quel que soit l'alias SQL : `SELECT … AS has_timeline` arrive en `row.hasTimeline`. Ne JAMAIS lire `row.snake_case` (= `undefined`). Les colonnes d'un seul mot sans underscore (`count`, `day`) sont inchangées. Les alias SQL quotés en camelCase (`AS "eventCount"`) sont donc inutiles (mais inoffensifs). Voir ERRORS.md 2026-06-02.

---

## DIRECTIVE 4 — STACK VERROUILLÉE

| Couche | Technologie | Version |
|--------|-------------|---------|
| API | Fastify + postgres.js | Node 20 |
| Frontend public | React 18 + Vite + Tailwind CSS | — |
| Frontend immersif | Next.js (submodule `kasuku-immersive/`) | 15 |
| Base de données | PostgreSQL | 16-alpine |
| Cache / Blacklist | Redis | 7 |
| Auth | JWT (`@fastify/jwt`) + blacklist JTI Redis | — |
| Déploiement | Docker Compose + Traefik + nginx | — |
| CI | Manuel via SSH | — |

En cas de conflit ou de limitation d'un outil, signaler explicitement avant de proposer un changement.

---

## DIRECTIVE 5 — CONVENTIONS DE CODE

- **Nommage** : camelCase TypeScript, snake_case SQL
- **Migrations** : numérotées `NNN_description.sql` dans `database/migrations/`
- **Tokens Tailwind** : utiliser `bg-light`, `bg-card`, `text-dark`, etc. — jamais `bg-[#FAF8F5]` hardcodé
- **Dark mode** : CSS variables définies dans `index.css` — `bg-dark` flip en clair en dark mode, préférer couleurs hardcodées pour éléments toujours sombres (ex: `bg-[#2C3E50]`)
- **Commits** : préfixe conventionnel (`fix:`, `feat:`, `chore:`) + `closes #NN` pour fermer les issues
- **gh CLI** : disponible à `/Users/Apple/bin/gh`, authentifié sur compte `Kasuku-Kalenda`

---

## FICHIERS CLÉS À CONNAÎTRE

```
api/src/routes/
  timelines.ts       — GET/POST/PUT récits (stories)
  events.ts          — GET/POST/PUT événements
  auth.ts            — login/logout/refresh avec JWT blacklist Redis
  themes.ts          — CRUD thèmes (delete protégé requireSuperAdmin)
api/src/middleware/auth.ts   — requireAuth / requireAdmin / requireSuperAdmin
pages/TimelinePage.tsx       — carousel immersif des récits (frontend public)
pages/DateTimelinePage.tsx   — carousel par date
pages/TimelineListingPage.tsx — liste/grille des récits
components/Footer.tsx        — footer (toujours sombre, bg-[#2C3E50])
kasuku-immersive/            — Next.js submodule, accède à l'API via KASUKU_API
index.css                    — tokens CSS dark/light mode
```
