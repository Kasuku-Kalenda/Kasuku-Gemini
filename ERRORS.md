# ERRORS.md — Log des erreurs et contournements

> Consulter ce fichier avant de suggérir une approche sur une tâche similaire.
> Ajouter une entrée dès qu'une approche échoue plus de 2 fois consécutives.

## 2026-06-14 — Staging 000/504 intermittent après déploiement : Traefik perd le backend (provider Docker « context canceled »)

- **Tâche :** Remettre `staging.kasuku.afrikia.org` en ligne (« ne s'ouvre pas ») après le déploiement LMS, alors que prod restait OK.
- **Symptômes trompeurs :** curl depuis le poste → 000 (timeout) PUIS 504 PUIS flapping staging↔prod ; tous les conteneurs `Up (healthy)` ; `coolify-proxy Up`. Boucle test DEPUIS le serveur via l'URL publique = 0/10 — mais **hairpin NAT** (le serveur ne joint pas sa propre IP publique) ⇒ test NON FIABLE.
- **Diagnostic décisif (sans hairpin, `curl -k --resolve host:443:127.0.0.1`) :**
  1. HTTP (port 80) → **302** (routeur http = redirect middleware, pas de backend requis) ✓ ; HTTPS → **000** (handshake TLS OK, cert Let's Encrypt valide via `openssl s_client`, mais la requête pend = **pas de backend**).
  2. `coolify-proxy` joint nginx EN DIRECT (`docker exec coolify-proxy wget http://<nginx-coolify-ip>/api/v1/health` = 200) ; labels Traefik corrects (`Host(staging…)`, tls letsencrypt).
  3. Logs `coolify-proxy` : `ERR Failed to list containers for docker error="…context canceled"` (providerName=docker) — **dernière occurrence pile à l'heure de la panne**. Pendant le churn de conteneurs (mes rebuilds + un agent parallèle), le provider Docker time-out ⇒ Traefik **droppe le service (backend)** du routeur HTTPS ⇒ 000/504, tandis que le redirect HTTP survit.
- **Marché :** `docker restart coolify-proxy` ⇒ re-sync du provider ⇒ staging **8/8 sur 30 s**. (Cause ≠ simple cache d'IP du 2026-06-08 : ici le **provider Docker lui-même** échoue à lister les conteneurs.)
- **Retenir :**
  1. **`coolify-proxy` Up ≠ Traefik route.** Diagnostiquer en LOCAL avec `curl -k --resolve host:443:127.0.0.1` (élimine DNS public + hairpin). **HTTP 302 + HTTPS 000 = routeur OK mais backend perdu** (problème provider, pas cert/réseau).
  2. Le **hook auto-restart Traefik N'A PAS tourné** cette session (coolify-proxy n'avait pas été redémarré par mes déploiements) ⇒ vérifier que `.claude/hooks/restart-traefik-after-deploy.py` est bien **CÂBLÉ dans settings.json** (committer le fichier seul ne l'active pas).
  3. Mitigation durable : limiter le churn simultané (déploiements parallèles) et **purger les conteneurs arrêtés** (`docker container prune`) pour accélérer le `containers/json?all=1` que Traefik interroge.

## 2026-06-10 — Sourcing de médias Wikimedia pour un seed (images/audio) : pièges

- **Tâche :** Récupérer ~60 URLs de médias RÉELS et fonctionnels (covers + audio) pour seeder 30 patrimoines, en garantissant HTTP 200 avant insertion.
- **Échoué (plusieurs itérations) :**
  1. **`pageimages` Wikipedia renvoie souvent une CARTE** : pour les articles « peuple X » / pays, l'image principale est une carte de localisation (ex. cover « Masque Punu » = `Gabon_in_its_region.svg.png`). Inacceptable.
  2. **Recherche Commons fuzzy = faux positifs** : `Dan mask Africa` a renvoyé… **Elon Musk** (« Musk » ≈ « mask »). `Couscous dish` → Fufu.
  3. **Audio Commons saturé de Lingua Libre** : `kora`/`balafon`/`griot filetype:audio` renvoient surtout des `LL-Q*.wav` = prononciations d'UN MOT par un locuteur (pas de la musique), plus des `.mid` (timpani orchestral pour « talking drum »). 
  4. **`whc.unesco.org` renvoie 403 aux bots** (vérif curl échoue) alors que ça marche en navigateur.
- **Marché :**
  - Covers : recherche **Commons `filetype:bitmap`** (vraies photos) AVEC (a) **blocklist** de motifs (`in_its_region`, `locator`, `flag_of`, `orthographic`, `_bridge`, `elon`, `musk`…) et (b) contrainte **`must`** = le nom de fichier DOIT contenir le mot-clé de l'objet (`mask`/`masque`, `couscous`, `kora`, `kente`, `ankh`…). Fallback `pageimages`.
  - Audio : **rejeter `LL-Q*` / `lingua` / `.mid`** et exiger une extension audio réelle. La vraie musique d'instruments africains est RARE → hand-pick d'URLs Commons explicites vérifiées (ex. `Le_son_du_balafon_de_Neba_Solo.ogg`, chant de griot `Kofi_Kofi…flac`). Quand rien de bon → mettre un **lien** Wikipédia plutôt qu'un faux son.
  - Liens : préférer **Wikipédia** et **`ich.unesco.org`** (200) ; éviter `whc.unesco.org` (403 bots).
  - **Toujours vérifier chaque URL (GET, suivre redirections, encoder accents/apostrophes) AVANT de générer le SQL**, et **eyeballer le nom de fichier résolu** (un 200 ne garantit pas la pertinence — cf. carte du Gabon / Elon Musk).
- **Retenir :** Un HTTP 200 ne suffit PAS — vérifier la PERTINENCE (nom de fichier). Script réutilisable : `/tmp/seed_heritage/build.py` (résout Commons+Wikipedia, blocklist+must, génère le SQL idempotent). Seeds = migration `NNN_*.sql` idempotente (`ON CONFLICT slug DO UPDATE`, DELETE scoped pour les resources), dry-run `BEGIN…ROLLBACK` sur DB staging, puis `psql -1` stdin.

## 2026-06-10 — `JSON_AGG(DISTINCT … ORDER BY <autre expr>)` rejeté par Postgres (500)

- **Tâche :** Enrichir le détail patrimoine (`GET /api/v1/heritage/slug/:slug`) ; il renvoyait 500 dès qu'on l'appelait.
- **Échoué :** La requête agrégeait themes/people/resources via **LEFT JOIN + GROUP BY** (produit cartésien) → des `DISTINCT` partout. Le `resources` faisait `JSON_AGG(DISTINCT JSONB_BUILD_OBJECT(...) ORDER BY JSONB_BUILD_OBJECT('position', r.position))`. Postgres refuse : *« in an aggregate with DISTINCT, ORDER BY expressions must appear in argument list »* (code 42P10). Bug **dormant** : l'endpoint n'avait jamais été appelé (la page front ne fetchait pas, elle utilisait l'item « léger » de navigation). L'ajout du fetch-au-montage l'a réveillé.
- **Marché :** Remplacer LEFT JOIN + GROUP BY par des **sous-requêtes corrélées** (une par relation : themes, people, resources, linkedEvents), via un helper `selectHeritageDetail(where: postgres.Fragment)` partagé par `/:id` et `/slug/:slug`. Plus de produit cartésien ⇒ plus de DISTINCT ⇒ `ORDER BY` propre. Corrige en prime une **duplication latente** des resources (enrichedDetail dupliquait chaque resource × nb thèmes × nb personnages).
- **Retenir :**
  1. **Règle Postgres** : avec `agg(DISTINCT x ORDER BY y)`, `y` DOIT faire partie des arguments (`x`). Sinon → 500. Le plus simple : pas de `DISTINCT` du tout.
  2. **Pour agréger plusieurs relations 1:N sur une même entité, préférer des sous-requêtes corrélées** (`COALESCE((SELECT JSON_AGG(...) FROM rel WHERE rel.fk = h.id), '[]'::json)`) plutôt que multiplier les LEFT JOIN + GROUP BY + DISTINCT (produit cartésien, duplication, DISTINCT bancals). Modèle existant : `selectEventDetail(where)` dans events.ts.
  3. **Fragments `sql` imbriqués** : typer le paramètre `postgres.Fragment` (`import type postgres from 'postgres'`) et interpoler `${frag}` dans un `sql\`…\`` — postgres.js inline le SQL brut (ex: `sql\`h.id\``, `WHERE ${where}`).
  4. **Un endpoint jamais appelé par le front peut cacher un bug SQL** : tester les endpoints au curl directement, pas seulement via l'UI.

## 2026-06-08 — 504 récurrent après tout déploiement (pattern définitif)

- **Tâche :** Déployer api/frontend/nginx sur staging ou prod et retrouver le site accessible.
- **Échoué (×4+) :** `docker compose restart nginx` seul → 504. `docker restart coolify-proxy` seul → 200 une fois puis 504. Toute combinaison partielle → instable.
- **Marché :** Séquence COMPLÈTE en 3 étapes obligatoires :
  1. `docker compose ... up -d --build --no-deps <services>`
  2. `docker compose ... up -d --force-recreate --no-deps nginx` (PAS restart)
  3. `docker restart coolify-proxy` (TOUJOURS en dernier)
- **Retenir :** Traefik (coolify-proxy) cache l'IP des containers. Quand un container est recréé, son IP change. Sans l'étape 3, Traefik route vers l'ancienne IP → 504. Ce pattern revient à CHAQUE déploiement. Un hook PostToolUse (`.claude/hooks/restart-traefik-after-deploy.py`) le fait maintenant automatiquement dès qu'une commande SSH de déploiement est détectée. Voir aussi CLAUDE.md DIRECTIVE 3.
- **Symptôme connexe (2026-06-08, déploiement #22) :** un `docker compose … up -d --build --no-deps api` (staging) a aussi laissé le container **frontend** à moitié recréé (un `kasuku-staging-frontend-1` `Exited (0)` + un `<hash>_…-frontend-1` bloqué en `Created`). nginx ne pouvait alors PAS démarrer : `[emerg] host not found in upstream "frontend:80"` → crash-loop → 502 (pas 504). **Fix :** `docker compose … -p kasuku-staging up -d` COMPLET (sans `--no-deps`, sans `--build`) pour réconcilier et relancer frontend, PUIS `up -d --force-recreate --no-deps nginx`. **Retenir :** après un déploiement, si le site est down, vérifier TOUS les containers staging (`docker ps -a | grep staging`), pas seulement l'api ; le hook qui redémarre coolify-proxy en parallèle de tes commandes provoque des 502/504 TRANSITOIRES — attendre la convergence avant de sur-diagnostiquer. **Et SURTOUT : lire ce fichier AVANT de déployer.**

## 2026-06-03 — API pagination : champ `totalItems` pas `total`

- **Tâche :** Exposer le nombre total d'enregistrements (Dashboard compteurs, etc.) depuis les endpoints paginés de l'API.
- **Échoué :** Utiliser `res.total` dans `adminApi.ts` → `undefined` à chaque fois. Hypothèse initiale que le champ s'appelait `total`.
- **Marché :** Le helper `paginate()` de l'API (`api/src/utils/pagination.ts`) retourne `{ items, page, totalPages, totalItems }` — le champ est **`totalItems`**, jamais `total`. Côté frontend, lire `(res as any).totalItems` ou ajouter `totalItems?: number` à `ListResponse<T>`.
- **Retenir :** Ne JAMAIS supposer que la pagination retourne `total`. Vérifier dans `pagination.ts` : le champ est `totalItems`. Toujours utiliser `totalItems ?? items.length` comme fallback.

## 2026-06-03 — EAS Build Android : `npm ci` échoue (peer react-dom + lockfile élagué)

- **Tâche :** Produire un APK Android distribuable à des testeurs éloignés via EAS Build (profil `preview`, distribution `internal`, pointant staging).
- **Échoué :** Build EAS plante à *Install dependencies* — `npm ci --include=dev exited with non-zero code: 1`. Double cause : (1) **conflit de peer-dep PRÉ-EXISTANT** — le projet épingle `react@19.1.0` (version Expo SDK 54) mais `react-dom@19.2.6` (tiré côté web seulement par expo-router→vaul→radix) exige `react ^19.2.6` ; le `npm ci` STRICT d'EAS refuse (ERESOLVE). (2) Une install CLI avec `--legacy-peer-deps` (faite pour ajouter `@expo/ngrok`) a **élagué `react-dom`/`scheduler` du `package-lock.json`** → `npm ci` réclame « Missing from lock file ». Tentative « repartir propre » (lockfile committé + SANS `.npmrc`) → ERESOLVE quand même (cause 1 seule suffit à planter).
- **Marché :** `.npmrc` à la racine de `kasukuNative` avec **`legacy-peer-deps=true`** + **lockfile COMPLET** (react-dom présent). Combinaison gagnante : `npm ci` installe react-dom (il est dans le lock) ET la validation des peers est bypassée → **EXIT 0 AVEC react-dom présent** (donc zéro risque au bundle Metro). ngrok retiré (tunnel mort, on est passé à EAS). Vérifié en local avec la commande EXACTE d'EAS (`npm ci --include=dev` → EXIT 0) avant de relancer. Build EAS ✅.
- **Retenir :**
  1. **EAS lance `npm ci` STRICT** → package.json ↔ package-lock.json doivent être PARFAITEMENT synchro. **Ne JAMAIS `npm install --legacy-peer-deps` en CLI** sur ce projet (ça élague le lock) ; mettre le flag dans `.npmrc`.
  2. `kasukuNative` **EXIGE `.npmrc` `legacy-peer-deps=true`** pour builder (conflit react/react-dom structurel SDK 54). Ne pas le supprimer. EAS l'upload car non gitignoré.
  3. **expo doctor est NON-bloquant sur EAS** (⚠️ jaune, pas ❌) — 3 checks rouges (metro config custom ; peer deps `expo-constants`/`expo-linking` « missing » mais présentes via expo-router ; `typescript 6.0.3`/`@types/react 19.2.x` vs attendus) n'arrêtent PAS le build. Ne pas « corriger » ces mismatches dev-only (typescript/@types/react ne sont jamais bundlés dans l'APK).

## 2026-06-02 — 504 persistant même après restart coolify-proxy + nginx

- **Tâche :** Redeploy api+frontend staging après `docker compose up -d --no-deps api frontend`
- **Échoué :** `docker restart coolify-proxy && docker compose restart nginx` → Traefik découvre le service, répon 200 une fois, puis repasse 504 immédiatement après
- **Marché :** `docker compose --env-file .env.staging -f docker-compose.staging.yml -p kasuku-staging up -d --force-recreate --no-deps nginx` — recréer nginx force Traefik à obtenir le nouvel IP du container et à mettre à jour son routing de manière stable
- **Retenir :** Après recreation de api/frontend, la séquence correcte est :
  1. `docker restart coolify-proxy`
  2. `docker compose ... up -d --force-recreate --no-deps nginx` (PAS `restart nginx`)
  Un simple restart de nginx ne suffit pas ; il faut une recreation pour que Traefik pickup l'IP stable

## 2026-05-27 — 504 après recreation de container staging

- **Tâche :** Redeploy frontend staging après `docker compose up -d`
- **Échoué :** `docker restart kasuku-staging-nginx-1` ne suffit pas — Traefik (coolify-proxy) perd ses routes quand un container est recréé
- **Marché :** `docker restart coolify-proxy` — force Traefik à redécouvrir les containers
- **Retenir :** Après toute recreation de container (`Recreated` dans les logs), faire : `docker restart coolify-proxy && docker restart kasuku-staging-nginx-1`

---

## 2026-05 — gh CLI non authentifié en session

- **Tâche :** Créer des issues GitHub via `gh issue create`
- **Échoué :** `gh` introuvable dans PATH ou `gh auth status` → "not logged in"
- **Marché :** `GH_TOKEN=$(security find-internet-password -s github.com -w) /Users/Apple/bin/gh ...` — le binaire est dans `/Users/Apple/bin/gh`, le token est dans le keychain macOS
- **Retenir :** Toujours utiliser le chemin absolu `/Users/Apple/bin/gh`. En cas d'erreur d'auth, récupérer le token keychain avec `security find-internet-password -s github.com -w`

---

## 2026-05 — git add échoue avec les chemins contenant des brackets `[slug]`

- **Tâche :** `git add app/api/events/by-slug/[slug]/route.ts` dans `kasuku-immersive`
- **Échoué :** zsh interprète `[slug]` comme un glob → "no matches found"
- **Marché :** Toujours quoter les chemins avec brackets : `git add "app/api/events/by-slug/[slug]/route.ts"`
- **Retenir :** Dans zsh, tout chemin contenant `[...]` doit être entre guillemets doubles pour éviter l'expansion glob

---

## 2026-05 — Mauvais nom de service Docker sur staging

- **Tâche :** `docker compose restart kasuku-immersive`
- **Échoué :** Service introuvable — le nom réel est différent du nom supposé
- **Marché :** `docker compose -f docker-compose.staging.yml config --services` pour lister les vrais noms, puis utiliser `kasuku-staging-kasuku-immersive-1`
- **Retenir :** Toujours vérifier les noms de services avec `config --services` avant un restart

---

## 2026-05 — 504 après `docker compose up` sur staging

- **Tâche :** Redéployer un container et vérifier que le site répond
- **Échoué :** `curl` retourne 504 immédiatement après le `up -d`
- **Marché :** `docker compose -f docker-compose.staging.yml restart nginx` — Traefik perd la route après un `up -d`, un restart nginx suffit à la re-enregistrer
- **Retenir :** **Toujours** faire `restart nginx` après tout `up -d` ou `up -d <service>` sur staging/prod

---

## 2026-06-02 — calendar-days : icônes récit/module jamais affichées (lecture snake_case)

- **Tâche :** Afficher l'icône récit/module sous chaque date de la grille calendrier (app native). `GET /events/calendar-days` doit renvoyer `hasTimeline`/`hasModule`/`themeColors` par jour.
- **Échoué (>2×) :** D'abord diagnostiqué à tort comme un « manque de contenu » (aucun événement daté n'aurait de récit) → **FAUX**. Le handler construisait l'objet jour en lisant `row.has_timeline`, `row.has_module`, `row.theme_colors` (snake_case) → toujours `undefined` → `Boolean(undefined)=false` (icônes jamais allumées) + repli couleur grise. La requête SQL était pourtant correcte (vérifiée en base : `has_timeline=t` pour le 6 mars / Ghana).
- **Marché :** Lire les colonnes en **camelCase** : `row.hasTimeline`, `row.hasModule`, `row.themeColors` (commit `aa5d01c`). Cause racine : `api/src/db.ts` configure `transform.column.from = col => col.replace(/_([a-z])/g, …)` qui renomme **TOUTES** les colonnes de résultat snake_case → camelCase. Les colonnes d'un seul mot sans underscore (`count`, `day`) ne changent pas → bug masqué (seuls les flags/couleurs disparaissaient).
- **Retenir (ANNULE l'ancienne note « eventCount » ci-dessous) :** ⚠️ Dans CE projet, `postgres.js` **TRANSFORME** snake_case → camelCase sur les résultats (custom `transform.column.from` dans `db.ts`). Côté JS on lit **TOUJOURS du camelCase**, quel que soit l'alias SQL : `SELECT … AS has_timeline` arrive en `row.hasTimeline`. Ne **JAMAIS** lire `row.snake_case` (= `undefined`). L'affirmation « postgres.js ne transforme pas » (CLAUDE.md DIRECTIVE 3 + entrée eventCount) est FAUSSE pour ce repo → à corriger dans CLAUDE.md.

---

## 2026-05 — postgres.js retourne les colonnes en snake_case

- **Tâche :** Récupérer `eventCount` depuis l'API timelines
- **Échoué :** `tl.eventCount` retournait `undefined` → NaN dans les calculs. La colonne SQL s'appelait `moment_count`
- **Marché :** Utiliser un alias SQL avec guillemets : `COUNT(se.event_id)::int AS "eventCount"` pour forcer le nom camelCase
- **Retenir :** ⚠️ **CORRIGÉ 2026-06-02 — cette note est TROMPEUSE.** `db.ts` ajoute un `transform.column.from` qui camelCase TOUTES les colonnes de résultat → l'alias quoté `"eventCount"` est en fait inutile (`AS moment_count` arriverait déjà en `momentCount`). Le vrai piège est l'INVERSE : ne pas lire `row.snake_case` côté JS (= `undefined`). Voir entrée 2026-06-02 ci-dessus.

---

## 2026-05 — `bg-dark` / `text-dark` flip en clair en dark mode

- **Tâche :** Styliser des éléments supposés toujours sombres (footer, fond de page)
- **Échoué :** `bg-dark` utilise `--color-dark` qui passe de `44 62 80` (sombre) → `226 217 207` (crème) en dark mode système → fond clair sur page sombre
- **Marché :** Hardcoder la couleur pour les éléments toujours sombres : `bg-[#2C3E50]`. Pour les backgrounds de page qui doivent s'adapter : utiliser `bg-light` (token qui flip correctement)
- **Retenir :** `bg-dark` et `text-dark` sont des tokens adaptatifs — ils s'inversent en dark mode. Ne JAMAIS les utiliser pour des éléments intentionnellement fixes (footer sombre, headers de carte sombres)

---

## 2026-05 — Login staging avec mauvais email

- **Tâche :** Se connecter au panel admin de staging pour tester
- **Échoué :** `admin@kasuku.app` → 401 Unauthorized
- **Marché :** Email réel : `kasukukalenda@gmail.com`, mot de passe dans `.env.prod` : `INITIAL_ADMIN_PASSWORD`
- **Retenir :** L'admin staging utilise `kasukukalenda@gmail.com`, pas `admin@kasuku.app`
