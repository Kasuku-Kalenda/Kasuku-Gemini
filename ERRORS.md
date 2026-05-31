# ERRORS.md — Log des erreurs et contournements

> Consulter ce fichier avant de suggérir une approche sur une tâche similaire.
> Ajouter une entrée dès qu'une approche échoue plus de 2 fois consécutives.

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

## 2026-05 — postgres.js retourne les colonnes en snake_case

- **Tâche :** Récupérer `eventCount` depuis l'API timelines
- **Échoué :** `tl.eventCount` retournait `undefined` → NaN dans les calculs. La colonne SQL s'appelait `moment_count`
- **Marché :** Utiliser un alias SQL avec guillemets : `COUNT(se.event_id)::int AS "eventCount"` pour forcer le nom camelCase
- **Retenir :** `postgres.js` ne transforme PAS automatiquement snake_case → camelCase. Si le frontend attend du camelCase, utiliser des alias SQL entre guillemets doubles

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
