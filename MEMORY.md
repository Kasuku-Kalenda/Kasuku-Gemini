# MEMORY.md — Journal de sessions · Kasuku Cultural Calendar

> Ce fichier est mis à jour à la fin de chaque session significative.
> Il sert de point de départ pour la session suivante.

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
