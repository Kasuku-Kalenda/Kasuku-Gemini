# MEMORY.md — Journal de sessions · Kasuku Cultural Calendar

> Ce fichier est mis à jour à la fin de chaque session significative.
> Il sert de point de départ pour la session suivante.

---

# SESSION END — 2026-06-03 (session 2) — Corrections admin P1/P2/P3 (issues #53-#65)

- **Travaillé sur :** Corrections complètes des bugs admin identifiés lors de l'audit 2026-06-03. Phases 1, 2 et 3 toutes traitées dans cette session.

- **Terminé :**
  - ✅ **P1 #53** — Filtres orphan/noModule/featured : `'1'` → `'true'` dans AdminEventsPage.tsx
  - ✅ **P1 #55** — `adminApi.listModules()` : `/modules?limit=200` → `/modules/all?limit=200`
  - ✅ **P1 #56** — POST/PUT `/modules` : ajout gestion `event_modules` (liaison événements↔modules)
  - ✅ **P1 #61** — GET `/modules/all` : ajout `thumbnail_url` + `event_ids` (ARRAY_AGG LEFT JOIN event_modules)
  - ✅ **P2 #57** — AdminTimelinesPage : suppression `listEvents()` fantôme + colonne "Évén. liés" (champ `timelineId` inexistant)
  - ✅ **P2 #58** — Type `'thematique'` : ajouté à `TimelineType` (types.ts), Zod schema (schemas/admin.ts), select TimelineForm.tsx + badge AdminTimelinesPage
  - ✅ **P2 #59** — DELETE `/people` : ajout `RETURNING id` + 404 si non trouvé
  - ✅ **P2 #60** — Interface admin Personnages : AdminPeoplePage.tsx + PersonFormPage.tsx + adminApi CRUD + nav + router + AppView
  - ✅ **P3 #62** — Suppression dead code AdminEventEditorPage.tsx + AdminEventEditor.tsx
  - ✅ **P3 #63** — Dashboard compteurs : utilisation `totalItems` (champ réel de la pagination API)
  - ✅ **P3 #64** — Menu nav : ajout Personnages + 4 pages Moodle
  - ✅ **P3 #65** — Colonne "Source" récits supprimée (champ fantôme)

- **Commits :**
  - `1f70001` — fix(admin): corrections audit P1/P2/P3 — closes #53 #55 #56 #57 #58 #59 #60 #61 #62 #63 #64 #65
  - `3c83754` — fix(admin): corriger totalItems (pagination utilise totalItems, pas total)

- **Déployé :** staging (api + frontend) — validé curl :
  - `orphan=true` → totalItems=50 ✓ ; `modules/all` → endpoint admin (0 modules en staging, normal) ✓ ; `DELETE /people/<inexistant>` → HTTP 404 ✓

- **Non corrigé dans cette session :**
  - **Issue #66** (Heritage Items) — feature complexe (migration SQL + API + admin), reportée à une session dédiée
  - **build frontend** : erreurs TypeScript pré-existantes dans `AdminTimelineEditor.tsx`, `FeaturedStories.tsx` et le submodule `kasuku-immersive/` (non causées par nos changements)

- **Décisions :**
  - Pagination API retourne `totalItems` (pas `total`) — `ListResponse<T>` dans adminApi.ts a maintenant `totalItems?: number`
  - La table `people` n'a pas de `deleted_at` → fix minimal (RETURNING + 404), sans soft-delete ni migration
  - `listEvents()` côté admin charge toujours 500 items pour le "Recent events" du dashboard, mais le COUNT utilise `totalItems` (évite le plafonnement)

- **Prochaine session :**
  - Issue #66 — Heritage Items : migration 022 + API `/heritage` + admin complet
  - Tester visuellement les corrections admin sur staging (filtres events, liste modules, formulaire type thématique, page Personnages)
  - Vérifier `hasModule` badge sur un événement après liaison event↔module via le formulaire admin

---

# SESSION END — 2026-06-03 — Audit admin exhaustif (rapport + 13 issues identifiées)

- **Travaillé sur :** Audit complet du panel admin Kasuku : DB, API, frontend, navigation.
  Entités couvertes : events, stories (timelines), modules, people, heritage (à créer), dashboard.

- **Terminé :**
  - ✅ Lecture exhaustive : migrations 005/008/009/010/012/017/021, routes API events/timelines/modules/people, services adminApi/mappers, schemas, pages admin, composants, AdminLayout, AdminApp, TimelineForm (1200L)
  - ✅ Rapport d'audit complet rédigé dans la session (13 issues documentées)
  - ✅ MEMORY.md mis à jour

- **Bugs critiques identifiés (non corrigés — corrections déférées à la prochaine session) :**
  - **P1 #1** — Filtres orphan/noModule/featured inopérants : `AdminEventsPage.tsx:116-118` envoie `'1'` mais API attend `'true'`
  - **P1 #2** — `adminApi.listModules()` appelle endpoint PUBLIC `/modules` (pas `/modules/all`) → brouillons invisibles
  - **P1 #3** — POST/PUT `/modules` n'insère pas dans `event_modules` → liaison événements perdue
  - **P2 #4** — "Évén. liés" récits: filtre sur `e.timelineId` (champ fantôme) + requête 500 events inutile
  - **P2 #5** — Type récit `'thematique'` absent du schéma Zod → inaccessible
  - **P2 #6** — DELETE `/people` = hard-delete sans RETURNING ni 404
  - **P2 #7** — Aucune UI admin pour les personnages (people) malgré API CRUD complète
  - **P2 #8** — GET `/modules/all` manque `thumbnail_url` et `event_ids`
  - **P2 #9** — `AdminEventEditorPage.tsx` orphelin (dead code, import cassé)
  - **P3 #10** — Dashboard compteurs plafonnés/sous-estimés
  - **P3 #11** — Vues Moodle absentes du menu nav
  - **P3 #12** — Colonne "Source" récits toujours vide (champ inexistant dans l'API)
  - **P3 #13** — Heritage Items entièrement à créer (DB + API + admin)

- **Décisions :**
  - Heritage Items : recommandation migration `022_heritage_items.sql` + pivots `heritage_themes/people/story_heritage_items`.
    Champ `summary` (pas `description`) pour cohérence. Soft-delete (`deleted_at`).
    **Règle métier confirmée (2026-06-03) :**
    (1) Un heritage item peut exister SEUL — aucun lien obligatoire à un événement, un récit ou un module.
    (2) Il peut OPTIONNELLEMENT être lié à un événement, un récit ET/OU un module (pivots `event_heritage_items`, `story_heritage_items`, `module_heritage_items` — tous facultatifs).
    (3) Il peut avoir des ressources complémentaires (audio, image, vidéo) — table dédiée `heritage_resources (id, heritage_item_id, type, url, title, credit, position)` (Option B choisie pour évolutivité : permet de filtrer/compter par type, d'ajouter des métadonnées sans migration). Ne PAS utiliser JSONB.
  - `AdminEventEditorPage.tsx` (orphelin) vs `EventFormPage` (utilisé) : ne jamais modifier l'orphelin
  - `timelineFormSchema.type` doit inclure `'thematique'` (migration 017 le supporte déjà)

- **En cours / Prochaine session :**
  - Créer les 13 issues GitHub après validation humaine du rapport
  - Corrections P1 en priorité : filtres events (#1), endpoint modules (#2 + #3)
  - Puis P2 : récits (#4 #5), people (#6 #7), modules (#8)
  - Heritage Items : feature session dédiée

---

# SESSION END — 2026-06-02 (suite) — Repères récit/module partout (A/B/C)

- **Travaillé sur :** Rendre visible d'un coup d'œil la présence d'un récit/module à 3 endroits demandés par l'utilisateur : **(A)** sous la date dans la grille calendrier, **(B)** en haut de l'écran de détail événement, **(C)** badge sur les cartes d'événement en liste.

- **Bug découvert (corrige la conclusion erronée du bloc précédent) :** `calendar-days` lisait `row.has_timeline`/`has_module`/`theme_colors` en snake_case, mais `db.ts` applique `transform.column.from` (snake→camel) → ces colonnes arrivent en `hasTimeline`/`hasModule`/`themeColors`. Lire le snake_case = `undefined` → icônes récit/module JAMAIS allumées + couleurs de thème toujours grises. Ce n'était **PAS** un manque de contenu. Détail dans ERRORS.md 2026-06-02.

- **Terminé :**
  - **(A)** Backend `calendar-days` : lecture camelCase (commit `aa5d01c`). Déployé staging + validé : `month=3` → `03-06` (Ghana) `hasTimeline:true themeColors:[#3498DB]`, `03-01`/`03-12` aussi. **Aucune modif native** (calendar.tsx affichait déjà les icônes, elles ne recevaient jamais `true`).
  - **(C)** Backend `GET /events` (liste) : 2 sous-requêtes `EXISTS` scalaires → `hasTimeline` (≥1 story **publiée** liée) + `hasModule` (event_modules lié), sans GROUP BY supplémentaire (commit `f233163`). Déployé staging + validé : 8/8 items portent les flags, « Indépendance du Ghana » `hasTimeline:true`.
  - **(B+C) Natif** (commit local `7f3e26b`, **NON poussé**) : `Event.hasTimeline/hasModule` (type + mapper, dérivés des flags liste OU de `timelineSlug`/`modules` au détail) ; `EventCard` = pastille overlay coin haut-gauche (récit=accent, module=secondary) ; `event/[id]` = chips Récit/Module sous les thèmes, **tappables** (→ timeline / module). `tsc --noEmit` EXIT 0 (web ET natif).

- **Décisions :**
  - Définition « a un récit » = ≥1 story **publiée** liée (cohérence carte↔détail = ce qui est réellement ouvrable). `calendar-days` garde son check plus large (existence de `story_events`) — identique en pratique sur les données réelles, **non modifié** (ne rien casser).
  - Badge carte = coin overlay (choix utilisateur) ; détail = chips sous les thèmes (avant cover/résumé).
  - **`hasModule` non vérifiable visuellement sur staging** : **0 module et 0 `event_modules`** en base staging → badge module jamais affiché là-bas (code symétrique au récit, prouvé par le chemin récit). À tester en liant un module en admin.

- **⚠️ Hazard doc à trancher :** CLAUDE.md DIRECTIVE 3 + ancienne entrée ERRORS « eventCount » affirment « postgres.js ne transforme pas snake→camel ». **FAUX pour ce projet** : `db.ts` ajoute `transform.column.from` qui camelCase TOUTES les colonnes de résultat — c'est exactement ce qui a causé le bug `calendar-days`. Corrigé dans ERRORS.md (2026-06-02). **Recommandation : corriger la ligne de CLAUDE.md** (on lit camelCase ; les alias quotés ne sont pas nécessaires).

- **Prochaine session / en attente :**
  - **PROD : NON déployée** (tenue jusqu'à demande explicite + coordination session concurrente). Staging porte `aa5d01c` + `f233163`.
  - **Natif `7f3e26b` : commit LOCAL**, à pousser sur demande (l'app tourne déjà en Expo Go sur le code local → l'utilisateur voit les changements sans push).
  - Tester le badge **module** après création d'un module lié en admin (staging n'a aucun module).

---

# SESSION END — 2026-06-02 — Audit natif : image événement + récit depuis le calendrier

- **Travaillé sur :** Deux symptômes signalés depuis l'app native (Expo Go → staging) :
  1. Sur une date dont l'événement a un récit, pas d'icône récit sous la date + impossible de lire le récit en ouvrant la date.
  2. À l'ouverture d'un événement (« État Indépendant du Congo »), aucune image ; veut aussi voir/écouter les ressources.

- **Audit (preuves curl staging) :**
  - `GET /events/slug/:slug` → payload enrichi (`mediaItems`, `timelineSlug`, `themes`, `thumbnailUrl`).
  - `GET /events/:id` (UUID) → **payload nu** : pas de clé `mediaItems`, `timelineSlug=null`, `themes=null`, `thumbnailUrl=null`. ⚠️ C'est le chemin qu'emprunte l'app native (calendrier/cartes/moments ouvrent par UUID).
  - `calendar-days?month=<1..12>` (entier nu, PAS `YYYY-MM` — `parseInt("2026-06")=2026` casse la requête) → éphéméride perpétuelle clé `MM-DD`. Scan 12 mois : ~48 jours datés/an AVEC points de thèmes, mais `hasTimeline=0` ET `hasModule=0` PARTOUT. ⚠️ CORRECTION 2026-06-02 : ce « `hasTimeline=0` partout » était LE BUG lui-même (lecture snake_case dans le handler), PAS la réalité des données — voir bloc « (suite) ».

- **Conclusions :**
  - **Feature 2 = vrai bug backend** → corrigé. `/:id` renvoyait `SELECT e.*, p.name`. Factorisé la requête enrichie de `/slug/:slug` dans `selectEventDetail(where: postgres.Fragment)`, réutilisée par `/slug/:slug` et les deux branches de `/:id`. Commit local **`df90cfa`** (NON poussé). `tsc --noEmit` EXIT 0.
  - **Feature 1(b)** (« lire le récit depuis la date ») = **même bug** : la carte « Lire le récit » (PARCOURS) ne s'affiche que si l'événement a `timelineSlug`, justement absent via `/:id`. Réglé par le même correctif.
  - **Feature 1(a)** (icône récit sur la grille) — ⚠️ **CONCLUSION ERRONÉE, corrigée le 2026-06-02.** J'avais conclu « écart de contenu, aucun événement daté n'a de récit » : **FAUX.** En réalité `calendar-days` avait un **bug de lecture camelCase** (il lisait `row.has_timeline`/`has_module`/`theme_colors` alors que `db.ts` les transforme en `hasTimeline`/`hasModule`/`themeColors`) → flags toujours `undefined`→`false`, couleurs grises. Ex. « Indépendance du Ghana » (1957-03-06) EST daté ET a 2 récits publiés. Corrigé (commit `aa5d01c`) + déployé staging : `03-06` → `hasTimeline:true themeColors:[#3498DB]`. Voir le bloc de session « (suite) » en tête de fichier + ERRORS.md 2026-06-02.

- **Terminé :** Audit complet + preuves ; correctif backend code-complet + commité localement (`df90cfa`) ; build EXIT 0. Aucune modif native nécessaire (`app/event/[id].tsx` rend déjà galerie + carte PARCOURS ; `calendar.tsx` rend déjà l'icône récit).

- **Déploiement STAGING fait + validé (2026-06-02) :** autorisé « staging seulement ». `up -d --build --no-deps api` + `docker restart coolify-proxy` + `up -d --force-recreate --no-deps nginx`. ⚠️ Le serveur `/opt/kasuku` était déjà à `de6c675` (= origin/main) : une **session concurrente** avait poussé mes commits `df90cfa`/`1fc1ce1` + ajouté `de6c675 debug(api): log POST /events body` (logging temporaire, n'altère pas mon helper). Build COPY src/npm build **CACHED** (image de6c675 déjà construite par la session concurrente). Validation curl : `GET /events/<uuid>` → HTTP 200 enrichi (`mediaItems`:1, `thumbnailUrl`, `timelineSlug`, `themes:[Histoire]`) ; slug endpoint non régressé ; 404 OK ; api healthy. **PROD : NON déployée** (l'utilisateur vérifie d'abord dans Expo Go).

- **Décisions :**
  - Le correctif backend résout à la fois Feature 2 ET Feature 1(b). Feature 1(a) = décision contenu (lier un récit à un événement daté) OU décision produit (surfacer les événements approximatifs dans le calendrier — plus gros périmètre, non retenu sans demande).
  - `/:id` garde son périmètre de sélection (pas de filtre `status='published'`, drafts accessibles par id) ; seules les colonnes sont enrichies.

- **Prochaine session :**
  - Après vérif Expo Go OK : déployer en PROD (`docker-compose.coolify.yml -p kasuku-prod`, même séquence proxy/nginx) **sur autorisation explicite**.
  - Proposer à l'utilisateur : lier au moins un récit à un événement daté pour faire apparaître l'icône récit sur le calendrier.
  - ⚠️ Session concurrente active sur ce repo (debug `de6c675` sur POST /events) — coordonner avant tout `git push` / déploiement prod.

---

# SESSION END — 2026-06-02 — Fix création d'événement (EventForm + events route)

- **Travaillé sur :** Bugs bloquants dans la création d'événement admin (EventForm + API)
- **Terminé :**
  - ✅ **EventForm Bug 1** : erreur d'upload masquée en mode upload → ajout état `uploadError`, affiché hors du bloc `{inputMode === 'url'}`, toujours visible
  - ✅ **EventForm Bug 2** : échec silencieux à la soumission si media avec URL vide après upload raté → filtre dans `onSubmit` : `media: rawValues.media.filter(m => m.url && m.url.trim() !== '')`
  - ✅ **EventForm Bug 3** : `GET /api/v1/events/:id` crashait avec `PostgresError: invalid input syntax for type uuid` quand on passait un slug → détection UUID par regex, fallback sur `WHERE e.slug = $id` si non-UUID
  - ✅ **Commit** : `b4e1828` — "fix(admin): repair event creation"
  - ✅ **Déploiement staging** : `up -d --build --no-deps api frontend` + `coolify-proxy restart` + `force-recreate nginx` → 200 confirmé
  - ✅ **Vérif slug fallback** : `GET /api/v1/events/seed-annee-afrique-1960` → HTTP 200, slug correct

- **En cours :** Rien de bloquant

- **Décisions :**
  - Séquence de redéploiement corrigée après recreation de containers : `docker restart coolify-proxy` + `docker compose ... up -d --force-recreate --no-deps nginx` (PAS `restart nginx`)
  - ERRORS.md mis à jour avec cette correction

- **Prochaine session :**
  - Vérifier la création d'événement de bout en bout depuis l'interface admin (image upload → save → apparaît dans le calendrier)
  - Déployer les fixes en prod
  - Issues sécurité S1-S4 en attente (helmet, JWT_SECRET validation, rate limit Redis, durée access token 15min)

---

# SESSION END — 2026-05-31 — Déploiement PROD #17 (endpoint média moments) + topologie serveur corrigée

- **Travaillé sur :**
  - Déploiement en prod du lot backend `f49d81d` (expose `media` + `eventId` sur les moments de `GET /api/v1/timelines/slug/:slug`) — requis par le carrousel des récits de l'app native
  - **Vérification exhaustive AVANT tout déploiement** (demande user : « vérifie avant tout ») + nettoyage d'un stack Docker orphelin

- **Terminé :**
  - ✅ **Topologie réelle découverte (≠ doc !)** : tout tourne depuis **`/opt/kasuku`** (PAS `/opt/kasuku-staging`, qui est un checkout abandonné, branche `staging`, HEAD `1bd58c3`, +97/-56 drift nginx jamais commité). Orchestration **Coolify** (`coolify-proxy` = Traefik). **3 projets compose** dans `/opt/kasuku` :
    - `kasuku-staging` → `docker-compose.staging.yml`
    - `kasuku-prod` → `docker-compose.coolify.yml`
    - `kasuku` (orphelin/cassé) → `docker-compose.yml`
  - ✅ **Diagnostic** : `/opt/kasuku` déjà sur `origin/main` (`8a18e66`, propre). Staging **déjà à jour** (rebuild 31/05 15:32 depuis `8a18e66`). Prod **en retard** : image du 27/05 (code `1bd58c3`, avant `f49d81d`). Confirmé **fonctionnellement** (A/B sur slug réel `seed-story-independances-africaines-1960`) : prod sans `media`/`eventId`, staging avec.
  - ✅ **Déploiement prod** (manuel SSH, sans Coolify Redeploy) :
    `docker compose --env-file .env.prod -f docker-compose.coolify.yml -p kasuku-prod up -d --build --no-deps api frontend` puis `... restart nginx`. **Pas de git pull** (déjà à jour), **aucune migration** dans le lot.
  - ✅ **Vérif post-deploy** : prod renvoie désormais `media` + `eventId` (URL image Wikimedia réelle constatée). #17 prod **OK**.
  - ✅ **Stack orphelin `kasuku` nettoyé** (`down` sans `-v`) : sa `postgres-migrate` bouclait en crash (cherchait `kasuku_db` inexistant — seul `kasuku_staging_db` présent sur sa pg), son `api` coincée en `Created`, + postgres/redis/minio/frontend en double. Staging & prod intacts et sains après coup.

- **Décisions / invariants (À RÉPERCUTER dans CLAUDE.md) :**
  - 🔧 **Le bon dossier de déploiement est `/opt/kasuku`** (l'invariant `DIRECTIVE 3` qui dit `/opt/kasuku-staging` est **périmé**)
  - Déploiement = `docker compose --env-file .env.<env> -f docker-compose.<env>.yml -p kasuku-<env> up -d --build --no-deps <services>` + `restart nginx` (anti-504). Rebuild **ciblé** des seuls services changés (blast radius minimal)
  - Le compose **interpole les secrets depuis l'`.env`** (`${POSTGRES_PASSWORD}`, `${JWT_SECRET}`…). `/opt/kasuku/.env -> .env.prod`. **Pour déployer staging : basculer `.env -> .env.staging` OU passer `--env-file .env.staging`** explicitement
  - Postgres réel = **`postgres:16-alpine`** (la doc dit 15)

- **En cours / Prochaine session :**
  1. ✅ FAIT (ce commit) : `CLAUDE.md` DIRECTIVE 3 corrigée (`/opt/kasuku-staging` → `/opt/kasuku` + commandes compose par-env + symlink `.env`), DIRECTIVE 4 Postgres 15 → 16-alpine
  2. Optionnel : purger le volume orphelin restant `kasuku_*` (`kasuku_staging_db`) via `docker volume rm` si on veut récupérer l'espace
  3. Tester le ressenti tactile natif (ripple + haptiques `medium`) sur Android physique
  4. Suite board polish natif : #3 pull-to-refresh, #4 virtualisation FlatList, #5 expo-image…

---

# SESSION END — 2026-05-31 — App native (kasukuNative/) · Ressenti natif au toucher (ripple + haptics)

- **Travaillé sur :**
  - Lot « Ressenti natif au toucher » = issues **#2** (ripple/effet pressé sur tous les `Pressable`) + **#1** (retour haptique `expo-haptics`)
  - Objectif : « l'app la plus native » → feedback visuel + haptique sur 100 % des éléments tactiles
  - Contrainte forte maintenue : **« tout ce qui marche on y touche pas »** → migration chirurgicale par simple swap de balise, jamais de refonte

- **Terminé :**
  - ✅ `src/haptics.ts` : helper `haptic(kind)` enveloppant expo-haptics (light/medium/heavy/selection/success/warning/error), fire-and-forget (`.catch(noop)`, jamais bloquant)
  - ✅ `src/components/Tappable.tsx` : drop-in `<Pressable>` → `<Tappable>`. android_ripple par défaut (borné, `borderless` en option), opacité 0.7 au press sur iOS, haptique au press **opt-in** (défaut `null` → aucun ; renseigner `haptic="medium"` pour activer). Props : `haptic`, `ripple`, `borderless`, `rippleColor`, `pressedOpacity`
  - ✅ `expo-haptics ~15.0.8` installé (`npx expo install expo-haptics -- --legacy-peer-deps` — conflit peer **préexistant** react-dom@19.2.6 vs react@19.1.0, web-only, natif non impacté). Inclus dans Expo Go → pas de rebuild natif
  - ✅ **18 fichiers migrés** (tous les `Pressable` → `Tappable`, plus aucun `Pressable` résiduel hors wrapper) :
    - 7 composants : CarouselCard, EventCard, FeaturedStories, ShortsEntries, Header, PeriodsSection, ShortsViewer
    - 11 écrans : `_layout`, Discover (`index`), Calendar, Récits (`timelines`), Modules, Saved, `event/[id]`, `module/[slug]`, `timeline/[id]`, `profile`, `auth/login`
  - ✅ `npx tsc --noEmit` propre (exit 0)
  - ✅ Commit `843b5ec` `feat: ressenti natif au toucher … closes #1 #2` (repo kasukuNative, **non poussé** — push à faire)

- **Décisions (mapping haptique/ripple) :**
  - **Haptique = uniquement `medium`** (décision finale user : « le seul que je veux qu'on garde »). 13 cibles : toggles favori/sauvegarde (★ — EventCard, CarouselCard, ShortsViewer, modules, timelines, saved, event/[id], timeline/[id], module/[slug]), soumission login, déconnexion. Tout le reste → **aucune haptique**
  - **Retiré** : les 13 `haptic="selection"` (onglets bottom nav, segments vue, tab Saved, nav calendrier mois + cellules, points de frise, vignettes média) **et** le défaut `light` global → bascule du défaut `Tappable` de `'light'` à `null`. Le ripple Android + l'effet pressé iOS (#2) **restent partout** — seules les haptiques (#1) sont rognées
  - `ripple={false}` là où le ripple est visuellement faux : backdrop du bottom sheet calendrier (+ `haptic={null}`), liens texte inline (sources event, « Lire plus » frise), cibles pilotées par animation (sélection de carte de frise, dots) — le feedback vient de l'animation reanimated
  - `borderless` (ripple non borné) réservé aux boutons-icônes ronds (favoris, avatar, fermer, retour flottant)
  - Wrapper plutôt que patch par fichier : 1 seul point de vérité, diffs minimaux, honore « ne pas casser ce qui marche »

- **En cours :**
  - ⏳ Tester le ressenti (ripple Android + ticks haptiques) sur Android physique via Expo Go ; ajuster les intensités si besoin

- **Prochaine session :**
  1. Faire valider/commiter le lot tactile (#1 + #2) puis fermer les 2 issues
  2. **#17** — déploiement staging → prod
  3. Suite du board polish : #3 pull-to-refresh, #4 virtualisation FlatList, #5 expo-image, #6/#7 re-render favoris / Saved 1500 items, #8 babel/worklets

---

# SESSION END — 2026-05-31 — App native (kasukuNative/) · Skeletons shimmer + robustesse chargement

- **Travaillé sur :**
  - Système de **skeleton loaders « shimmer »** (balayage façon YouTube) sur toutes les pages de contenu de l'app native, pour quand ça peine à charger (connexion lente / cold-start backend)
  - Contrainte forte du user : **« tout ce qui marche on y touche pas »** → ne modifier QUE la branche de chargement de chaque écran
  - (Début de session) correctif du rail « À la une » du calendrier qui disparaissait au démarrage à froid

- **Terminé :**
  - ✅ Primitive `src/components/Skeleton.tsx` : bloc gris `#E4E7EC` + reflet `LinearGradient` animé sur le thread UI (reanimated, `translateX` -w→w en boucle), largeur mesurée via `onLayout` ; support `aspectRatio`
  - ✅ Compositions par écran : `CarouselRow`, `Discover`, `EventCard`, `Modules`, `Timelines` (cards/list), `SavedEvents/Timelines/Modules`
  - ✅ Câblé sur 8 écrans (branche `isLoading` uniquement + import) : Discover, Modules, Récits, Saved, Calendrier + détails `event/[id]`, `timeline/[id]`, `module/[slug]`
  - ✅ Saved : skeleton au lieu du **faux état vide** pendant le fetch (compte des favoris dérivé de `items` du FavoritesContext)
  - ✅ Calendrier : `SkeletonCard` passé du pulse d'opacité au shimmer, cadre `skel.card`/`skel.body` conservé à l'identique
  - ✅ Featured : `src/api/client.ts` timeout 15 s → 30 s (cold-start coupait `/featured`) + self-heal `useFocusEffect` du rail s'il est vide
  - ✅ `npx tsc --noEmit` propre (exit 0)
  - ✅ Commit `231984a` `feat: skeletons shimmer ... closes #10` **poussé** sur `origin/main`
  - ✅ Identité git configurée (global) : `Paulin Bulakali <kal.kasuku@gmail.com>` pour les prochains commits

- **En cours :**
  - ⏳ Rien de bloquant. Tester l'effet shimmer sur Android physique (Expo Go) en connexion lente / cold-start

- **Décisions :**
  - Skeleton **centralisé** (1 primitive + compositions) pour garder des diffs minimaux par écran et honorer « ne pas toucher ce qui marche »
  - Skeletons de **détail inline** dans chaque écran (réutilisent les styles `s` locaux) plutôt que des compositions à usage unique
  - Skeletons réservés au **chargement de contenu** ; les spinners d'**action** (bouton login) et de **boot** (`_layout.tsx`) restent volontairement
  - timeout axios à 30 s pour s'aligner sur le web (pas de timeout) face au cold-start staging > 20 s
  - L'issue #10 (uniformiser skeletons vs spinners) est close par ce travail

- **Prochaine session :**
  1. **#17** — déploiement staging → prod (backend `timelines.ts` notamment)
  2. Attaquer les **P0/P1** de l'audit (board milestone #1, 21 issues ; #10 ✅ faite)
  3. Vérif visuelle du shimmer sur device en conditions réseau dégradées

---

# SESSION END — 2026-05-30 — App native (kasukuNative/)

- **Travaillé sur :**
  - Reconstruction 100% native de Kasuku (React Native + Expo SDK 54, expo-router) dans `/Users/Apple/Documents/Kasuku App/kasukuNative`
  - Scope : tout le web SAUF immersif & admin, AVEC push notifications + login. Design **identique au web (thème clair)** — la 1re tentative dark a été rejetée.

- **Terminé :**
  - ✅ Fondations : `src/theme.ts` (tokens web), `src/components/icons.tsx` (SVG), API client axios + react-query, contexts Auth/Favorites, `usePushNotifications`
  - ✅ Onglets : Discover, Calendar, Récits (`timelines.tsx`), Modules, Saved — tous en thème clair web
  - ✅ Écrans détail : `event/[id]`, `timeline/[id]` (moments verticaux), `module/[slug]` (+ événements liés), `profile`, `auth/login`
  - ✅ Détails event/timeline dual-fetch (`getXById(id) ?? getXBySlug(id)`)
  - ✅ Supprimé les fichiers dark obsolètes (`(tabs)/discover.tsx`, `(tabs)/profile.tsx`)
  - ✅ Fix TS `src/api/events.ts:35` — `toParams({ ...filters })`
  - ✅ `npx tsc --noEmit` propre

- **En cours / bloquant :**
  - ✅ **OAuth Google : décidé le 2026-05-30 → email/mot de passe uniquement pour l'instant.** Le serveur n'a pas d'OAuth Google ; on garde le login email/password (admin/editor) et la notice dans `login.tsx`. Google sera revu plus tard, pas une priorité.
  - ⏳ App pas encore testée visuellement sur Expo Go (vérif = tsc seulement)

- **Décisions :**
  - Vérification native = `npx tsc --noEmit` (pas de preview navigateur — tourne sur Android physique via Expo Go)
  - `headerShown: false` global → back bars intégrés dans le contenu de chaque écran
  - Module détail adapté au type `TrainingModule` léger (pas de player LMS comme le web)

- **Prochaine session :**
  1. Tester l'app sur Expo Go (Android) et corriger le rendu visuel écran par écran
  2. Vérifier les push notifications de bout en bout (token FCM → backend)

---

# SESSION END — 2026-05-27 (session 2)

- **Travaillé sur :**
  - Migration de la section "Périodes & Siècles" de CalendarPage vers HomePage (Discover)
  - Création du composant standalone `components/PeriodsSection.tsx`
  - Intégration dans `pages/HomePage.tsx`
  - Nettoyage complet de `pages/CalendarPage.tsx`

- **Terminé :**
  - ✅ `components/PeriodsSection.tsx` créé — self-fetch, own state, own memos
  - ✅ Import + `<PeriodsSection onViewEvent={onViewEvent} />` ajouté dans `HomePage.tsx`
  - ✅ Supprimé de `CalendarPage.tsx` : `formatEra`, `approximateEvents` state + useEffect, `selectedEra`/`showAllEras`, `approximateByEra`/`sortedEras`/`visibleEras`/`hiddenCount` memos, tout le JSX Périodes & Siècles (~230 lignes)
  - ✅ Build propre, commit `closes #52`, push + deploy staging
  - ✅ `docker restart kasuku-staging-nginx-1`

- **En cours :**
  - ⏳ Issues de sécurité S1–S4 (#26–#29) : helmet, JWT_SECRET validation, Redis rate-limit, token 15m
  - ⏳ Issue #23 (M5 kasuku-immersive) — à fermer manuellement

- **Décisions :**
  - La section Périodes & Siècles appartient à Discover (HomePage), pas au calendrier
  - `PeriodsSection` est autonome (self-fetching) — ne prend qu'un prop `onViewEvent`

- **Prochaine session :**
  1. Vérifier visuellement staging (Discover + Calendar allégé)
  2. Implémenter S1 : `@fastify/helmet`
  3. Implémenter S2 : valider `JWT_SECRET` au démarrage
  4. Implémenter S3 : Redis-backed rate limit
  5. Implémenter S4 : access token durée 15m

---

# SESSION END — 2026-05-27

- **Travaillé sur :**
  - Audit complet mai 2026 : correction des 24 bugs (C1–C6, I1–I10, M1–M7)
  - Sécurité : JWT blacklist Redis, rate limit login, architecture immersive sans DB directe
  - Dark mode : texte invisible en dark mode système (DM1–DM5)
  - Footer crème incohérent sur fond sombre (DM5)
  - NaN MOMENTS dans la stat card de TimelineListingPage

- **Terminé :**
  - ✅ Tous les bugs d'audit (C1–C6, I1–I10, M1–M7) corrigés et déployés
  - ✅ JWT blacklist via Redis (logout + token rotation sur /refresh)
  - ✅ Rate limit sur `/auth/login` (10 req / 15 min / IP)
  - ✅ `kasuku-immersive` : plus d'accès direct à PostgreSQL, tout passe par KASUKU_API
  - ✅ Dark mode : `TimelinePage`, `DateTimelinePage`, `ModulePage`, `AdminThemesPage`, `AdminImportPage`
  - ✅ `color-scheme: light dark` déclaré dans `index.html` et `index.css`
  - ✅ Footer : `bg-dark` → `bg-[#2C3E50]` hardcodé
  - ✅ NaN MOMENTS : alias SQL `moment_count` → `"eventCount"` dans `timelines.ts`
  - ✅ GitHub issues DM1–DM5 (#44–#48) et bug NaN (#49) créés et fermés
  - ✅ CLAUDE.md, MEMORY.md, ERRORS.md initialisés

- **En cours :**
  - ⏳ Issues de sécurité déférées : S1 `@fastify/helmet`, S2 JWT_SECRET obligatoire, S3 rate limit Redis-backed, S4 durée access token à 15–30 min (issues #26–#29)
  - ⏳ Issue #23 (M5 kasuku-immersive) — à fermer manuellement sur GitHub

- **Décisions :**
  - Le token `bg-dark` s'inverse en dark mode → les éléments intentionnellement sombres utilisent `bg-[#2C3E50]`
  - `postgres.js` ne transforme pas snake_case → les alias SQL doivent être en camelCase entre guillemets
  - L'app supporte officiellement `light dark` via `color-scheme`
  - `requireSuperAdmin` réservé aux actions destructives (DELETE thème), `requireAdmin` pour le reste

- **Prochaine session :**
  1. Implémenter S1 : `@fastify/helmet` dans `api/src/index.ts` (~30 min)
  2. Implémenter S2 : valider `JWT_SECRET` au démarrage (~5 min)
  3. Implémenter S3 : connecter `@fastify/rate-limit` au store Redis (~20 min)
  4. Implémenter S4 : réduire durée access token de `7d` à `15m` (~5 min)
  5. Vérifier visuellement staging après les fixes dark mode sur tous les écrans/pages

---

# SESSION END — 2026-05 (session précédente — audit initial)

- **Travaillé sur :** Audit complet — identification et correction de 24 bugs critiques/importants/mineurs
- **Terminé :** Corrections C1–C6 (critiques), I1–I10 (importants), M1–M7 (mineurs) — voir `project_audit_2026_05.md`
- **En cours :** Déploiement et vérification staging
- **Décisions :** Architecture hybride immersive : Next.js consomme l'API REST, pas de connexion DB directe
- **Prochaine session :** Issues de sécurité S1–S4
