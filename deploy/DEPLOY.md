# Déploiement Kasuku sur Hetzner — kasuku.afrikia.org

## Prérequis
- Compte Hetzner : https://hetzner.com
- Accès DNS de `afrikia.org`
- Repo GitHub connecté

---

## Étape 1 — Créer le VPS Hetzner (5 min)

1. Va sur https://console.hetzner.cloud
2. **New Project** → "Kasuku"
3. **Add Server** :
   - Location : **Falkenstein** (EU, moins cher)
   - Image : **Ubuntu 24.04**
   - Type : **CX32** (4 vCPU / 8 GB RAM / 80 GB) — €8.18/mois
   - SSH Key : ajoute ta clé publique (`~/.ssh/id_rsa.pub`)
   - Name : `kasuku-prod`
4. Clique **Create & Buy**
5. Note l'**adresse IP** affichée (ex: `65.21.xxx.xxx`)

---

## Étape 2 — Configurer le DNS (2 min)

Dans ton registrar (là où tu gères `afrikia.org`), ajoute :

| Type | Nom | Valeur | TTL |
|------|-----|--------|-----|
| A | `kasuku` | `[IP Hetzner]` | 3600 |

→ Le site sera accessible sur `kasuku.afrikia.org`

---

## Étape 3 — Installer Docker + Coolify (5 min)

Connecte-toi au serveur puis lance le script :

```bash
ssh root@[IP_HETZNER]
curl -fsSL https://raw.githubusercontent.com/Kasuku-Kalenda/Kasuku-Gemini/main/deploy/setup-server.sh | bash
```

À la fin, Coolify est accessible sur `http://[IP]:8000`

---

## Étape 4 — Configurer Coolify (10 min)

1. Ouvre `http://[IP]:8000`
2. Crée ton compte admin Coolify
3. **Sources** → Add GitHub → connecte `Kasuku-Kalenda`
4. **New Resource** → **Docker Compose**
5. Sélectionne le repo `Kasuku-Gemini`
6. **Docker Compose Location** : `deploy/docker-compose.prod.yml`
7. **Domain** : `kasuku.afrikia.org`
8. Coolify configure automatiquement SSL (Let's Encrypt)

---

## Étape 5 — Variables d'environnement (5 min)

Dans Coolify, section **Environment Variables**, colle le contenu de `.env.prod`
(à créer depuis `deploy/.env.prod.example` avec tes vraies valeurs).

Génère les secrets avec :
```bash
openssl rand -base64 48   # pour JWT_SECRET
openssl rand -base64 32   # pour les mots de passe DB/Redis/MinIO
```

---

## Étape 6 — Déployer 🚀

Dans Coolify → clique **Deploy**

Coolify va :
- Cloner le repo
- Builder les images Docker
- Lancer tous les services
- Configurer SSL automatiquement
- Rendre le site accessible sur `https://kasuku.afrikia.org`

---

## URLs finales

| Service | URL |
|---------|-----|
| App principale | `https://kasuku.afrikia.org` |
| Kasuku Immersive | `https://kasuku.afrikia.org/immersive` |
| API | `https://kasuku.afrikia.org/api/v1` |
| Stockage médias | `https://kasuku.afrikia.org/storage` |

---

## Utilisation locale (inchangée)

Le dev local reste **exactement comme avant** :

```bash
cd kasuku-cultural-calendar-170426
docker compose up -d        # utilise docker-compose.yml (local)
```

Le fichier `deploy/docker-compose.prod.yml` est **uniquement pour la production**.
