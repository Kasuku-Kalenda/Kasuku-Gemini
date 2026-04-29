# Kasuku — Guide de gestion Docker

## Architecture

```
Internet / Navigateur
        │
        ▼
   ┌─────────┐
   │  nginx  │  :80  ← point d'entrée unique
   └────┬────┘
        ├──────────────► frontend  (React SPA, nginx interne)
        └── /api/v1 ──► api       (Node.js / Fastify :4000)
                          │
              ┌───────────┼────────────┐
              ▼           ▼            ▼
           mongo        redis        minio
          :27017        :6379     :9000/:9001
        (base de      (cache)    (fichiers médias)
         données)
```

**6 services Docker :**

| Service    | Rôle                          | Port(s) exposé(s)   |
|------------|-------------------------------|---------------------|
| `nginx`    | Reverse proxy (entrée unique) | **80** (site web)   |
| `frontend` | Application React             | via nginx           |
| `api`      | API REST Node.js/Fastify      | via nginx `/api/v1` |
| `mongo`    | Base de données MongoDB 7     | 27017 (dev)         |
| `redis`    | Cache / sessions              | 6379 (dev)          |
| `minio`    | Stockage fichiers (images…)   | 9000, **9001** (console) |

---

## Prérequis

- **Docker Desktop** installé et **en cours d'exécution** (icône baleine dans la barre de menu, **pas en pause**)
- Fichier `.env` présent dans le dossier du projet (ne jamais le committer)

---

## Commandes essentielles

### Aller dans le dossier du projet

```bash
cd "/Users/Apple/Documents/Kasuku App/kasuku-cultural-calendar-170426/.claude/worktrees/jovial-mayer-29de82"
```

> Toutes les commandes `docker compose` ci-dessous doivent être lancées depuis ce dossier.

---

## Démarrage

### Démarrer tous les services (premier lancement ou après extinction)

```bash
docker compose up -d
```

- `-d` = détaché (en arrière-plan, le terminal reste libre)
- Ordre de démarrage automatique : mongo → redis → minio → api → frontend → nginx
- Durée : ~30–60 secondes le temps que tous les health checks passent

### Vérifier que tout est OK

```bash
docker compose ps
```

Tous les services doivent afficher `(healthy)` dans la colonne STATUS :

```
NAME                STATUS
kasuku-api-1        Up X minutes (healthy)
kasuku-frontend-1   Up X minutes (healthy)
kasuku-mongo-1      Up X minutes (healthy)
kasuku-nginx-1      Up X minutes
kasuku-redis-1      Up X minutes (healthy)
kasuku-minio-1      Up X minutes (healthy)
```

### Accéder à l'application

| URL                        | Description                      |
|----------------------------|----------------------------------|
| http://localhost           | Application Kasuku               |
| http://localhost/api/v1    | API REST                         |
| http://localhost:9001      | Console MinIO (gestion fichiers) |
| http://localhost:27017     | MongoDB (via MongoDB Compass)    |

---

## Arrêt

### Arrêter tous les services (données conservées)

```bash
docker compose stop
```

Les données (MongoDB, Redis, MinIO) sont **conservées** dans les volumes Docker.

### Redémarrer après un arrêt

```bash
docker compose start
```

### Arrêter ET supprimer les containers (données conservées)

```bash
docker compose down
```

Les volumes (données) sont préservés. Les containers sont recréés au prochain `up`.

### ⚠️ Tout supprimer, données incluses (DESTRUCTIF)

```bash
docker compose down -v
```

> **Attention** : supprime toutes les données (MongoDB, Redis, MinIO). À utiliser uniquement pour repartir de zéro.

---

## Redémarrage d'un service spécifique

```bash
# Redémarrer un seul service
docker compose restart nginx
docker compose restart api
docker compose restart frontend

# Redémarrer nginx après un recreate de l'API ou du frontend
# (nginx perd la connexion si l'IP Docker change)
docker compose restart nginx
```

> **Important** : après un `docker compose up -d --no-deps api` ou `frontend`,
> il faut toujours relancer nginx avec `docker compose restart nginx`.

---

## Rebuild (après modification du code)

### Rebuilder et redéployer l'API + frontend

```bash
docker compose build --no-cache api frontend
docker compose up -d --no-deps api frontend
docker compose restart nginx
```

### Rebuilder uniquement l'API (changement côté serveur)

```bash
docker compose build --no-cache api
docker compose up -d --no-deps api
docker compose restart nginx
```

### Rebuilder uniquement le frontend (changement React/UI)

```bash
docker compose build --no-cache frontend
docker compose up -d --no-deps frontend
docker compose restart nginx
```

---

## Logs

### Voir les logs en direct de tous les services

```bash
docker compose logs -f
```

### Logs d'un service spécifique

```bash
docker compose logs -f api        # logs de l'API
docker compose logs -f frontend   # logs du frontend
docker compose logs -f nginx      # logs nginx (accès + erreurs)
docker compose logs -f mongo      # logs MongoDB
```

### Voir les N dernières lignes

```bash
docker compose logs --tail=50 api
```

---

## Diagnostic

### Vérifier l'état de santé

```bash
docker compose ps
```

### Tester l'API directement

```bash
curl http://localhost/health
# Doit répondre : {"status":"ok","db":"connected",...}

curl http://localhost/api/v1/events
# Doit retourner la liste des événements
```

### Entrer dans un container pour déboguer

```bash
docker exec -it kasuku-api-1 sh      # shell dans l'API
docker exec -it kasuku-mongo-1 bash  # shell dans MongoDB
```

### Vérifier l'espace disque des volumes

```bash
docker system df
```

---

## Problèmes courants et solutions

### 502 Bad Gateway après un rebuild

nginx a perdu la connexion vers le nouveau container. Solution :

```bash
docker compose restart nginx
```

### Un service reste "starting" ou "unhealthy"

```bash
# Voir les logs du service concerné
docker compose logs --tail=30 api

# Forcer le redémarrage
docker compose restart api
```

### Docker Desktop est en pause (icône baleine orange)

Cliquer sur l'icône baleine dans la barre de menu → **Resume** avant de lancer des commandes.

### Port 80 déjà utilisé

Un autre serveur (Apache, nginx local, etc.) utilise le port 80. Arrêtez-le avant de démarrer Kasuku.

```bash
# Vérifier ce qui utilise le port 80
sudo lsof -i :80
```

### Tout réinitialiser proprement

```bash
docker compose down          # arrêter et supprimer les containers
docker compose up -d         # relancer (les données sont conservées)
```

---

## Workflow quotidien recommandé

### Matin — démarrer

```bash
cd "/Users/Apple/Documents/Kasuku App/kasuku-cultural-calendar-170426/.claude/worktrees/jovial-mayer-29de82"
docker compose start          # si déjà créés
# ou
docker compose up -d          # si besoin de recréer
```

### Soir — éteindre

```bash
docker compose stop
```

Les données restent intactes, le lendemain `docker compose start` suffit.

### Après avoir modifié du code

```bash
docker compose build --no-cache api frontend
docker compose up -d --no-deps api frontend
docker compose restart nginx
```

---

## Accès admin

| URL                             | Identifiants                      |
|---------------------------------|-----------------------------------|
| http://localhost/admin          | Email + mot de passe définis dans `.env` (`INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD`) |
| http://localhost:9001 (MinIO)   | `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` dans `.env` |

---

## Structure des volumes (données persistantes)

| Volume        | Contenu                          | Supprimé par `down -v` |
|---------------|----------------------------------|------------------------|
| `mongo_data`  | Toute la base de données         | Oui ⚠️                |
| `redis_data`  | Cache et sessions                | Oui                    |
| `minio_data`  | Fichiers uploadés (images, PDF…) | Oui ⚠️                |

> Les volumes survivent à `docker compose down` (sans `-v`) et aux redémarrages machine.
