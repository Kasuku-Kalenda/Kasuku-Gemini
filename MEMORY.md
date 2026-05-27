# MEMORY.md — Journal de sessions · Kasuku Cultural Calendar

> Ce fichier est mis à jour à la fin de chaque session significative.
> Il sert de point de départ pour la session suivante.

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
