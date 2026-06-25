# Handoff — Agent de curation Kasuku (édition JOJ Dakar 2026)

Tout ce dont l'agent a besoin pour démarrer. Le détail éditorial/technique est dans le skill `kasuku-curation`.

## 0. Prompt de lancement (à coller à l'agent)
> Tu es **l'agent de curation Kasuku — édition JOJ Dakar 2026** (patrimoine sportif sénégalais).
> Utilise le skill **`kasuku-curation`** de ce repo. **Lis dans l'ordre** : `references/MISSION_JOJ_DAKAR_2026.md`,
> `SKILL.md`, `references/STANDARD_EDITORIAL.md`, `references/FORMAT_CSV.md`.
> **Premier livrable** : le récit **« Le Lamb sur le Sable »** (la lutte sénégalaise devenue sport de
> compétition) — introduction globale + **≥ 5 fiches événements** liées + perspective.
> Source primaire fournie : l'exposition **LÀMB** dans `/Users/Apple/Documents/Kasuku/Curation /Exposition/`
> (33 panneaux ; ex. Mbaye Guèye). **Réécriture originale** (jamais de copie), **ton fier/narratif/intemporel**.
> Images : recadrer le panneau correspondant → MinIO (`scripts/recadrer_uploader.py`) ; l'image **doit illustrer**
> la fiche. Valide avec `scripts/verifier_csv.py`, importe sur **staging en brouillon**, puis assemble le récit.
> Travaille par lots, **staging avant prod**, et fais valider les brouillons avant publication.

## 1. Ordre de lecture du skill
1. `references/MISSION_JOJ_DAKAR_2026.md` — mission, périmètre (disciplines JOJ + 10 récits), formats, premier chantier.
2. `SKILL.md` — ton, règles (la LOI), format des 2 descriptions, médias, workflow, check-list.
3. `references/STANDARD_EDITORIAL.md` — standard 1.2 + exemple « gold ».
4. `references/FORMAT_CSV.md` — colonnes exactes + validation.
5. `references/THEMATIQUES.md` — domaines + équilibrage (pour la suite après le Lamb).
6. `assets/lamb_images.md` — images Lamb déjà sur MinIO + comment ajouter les autres.

## 2. Faits opérationnels (environnement)
- **API staging** : `https://staging.kasuku.afrikia.org/api/v1` (travailler ICI ; prod = `kasuku.afrikia.org`, ne pas toucher).
- **Admin** : `kasukukalenda@gmail.com` / mot de passe = `INITIAL_ADMIN_PASSWORD` (dans `/opt/kasuku/.env.staging` sur le serveur `root@77.42.76.120`). **Ne jamais afficher la valeur du mot de passe.**
- **Thème `sport`** : déjà créé en base ✅ (slug `sport`).
- **Exposition LÀMB** : `/Users/Apple/Documents/Kasuku/Curation /Exposition/` (33 `.jpg`).
- **Déjà fait** : la cover **Mbaye Guèye** est sur MinIO (cf. `assets/lamb_images.md`) — réutiliser pour sa fiche.
- ⚠️ Serveur Hetzner sujet à des coupures réseau ponctuelles : si l'API ne répond pas, attendre/retenter.

## 3. Obtenir un token admin (pour importer + uploader des images)
Le mot de passe ne doit pas transiter par les scripts. L'opérateur (ou l'agent) génère un token :
```bash
export KPW='<INITIAL_ADMIN_PASSWORD>'
export KASUKU_TOKEN=$(python3 -c "import os,json;print(json.dumps({'email':'kasukukalenda@gmail.com','password':os.environ['KPW']}))" \
  | curl -s https://staging.kasuku.afrikia.org/api/v1/auth/login -H 'Content-Type: application/json' --data @- \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")
unset KPW
```
Le token expire → relancer si une requête renvoie 401.

## 4. Workflow d'un lot
1. **Choisir** le sujet (ici : récit Lamb) → **vérifier l'existant** : `GET /api/v1/events?limit=1000` (éviter doublons de titre/slug).
2. **Rechercher** : lire les panneaux de l'expo + corroborer dates/noms par ≥ 1 source web (APS, Wiwsport, presse).
3. **Rédiger** chaque fiche : `titre` (≤60) / `resume` (teaser « Le saviez‑vous ? », ≥40 car.) / `contenu` (150–300 mots, ton Kasuku, **réécriture**) / date / `codePays=SN` / `slugsThemes` (`sport` + éventuellement `histoire`,`culture`) / source.
4. **Image** : recadrer le panneau correspondant sur la photo utile (sans texte) et l'uploader :
   ```bash
   python3 .claude/skills/kasuku-curation/scripts/recadrer_uploader.py \
     --src "/Users/Apple/Documents/Kasuku/Curation /Exposition/<panneau>.jpg" --box 0.45,0.03,0.99,0.85
   ```
   → coller l'URL `/storage/…` dans `imageUrl`, ajouter `imageLegende` + crédit « Exposition LÀMB, DCIA/IFAN, 2026 ».
   Si une image **libre pertinente** (Wikimedia) existe, la préférer. **Jamais d'image hors‑sujet.**
5. **Assembler le CSV** (gabarit `assets/evenements_modele.csv`) → **valider** : `python3 scripts/verifier_csv.py lot.csv` (vert obligatoire).
6. **Importer** (cf. §5) → **publier** après relecture.
7. **Assembler le récit** : créer le récit « Le Lamb sur le Sable » et y lier les ≥5 événements (formulaire Récit admin, ou onglet « Moments » de l'import). Intro globale + perspective.

## 5. Deux façons d'importer
- **(a) Humain dans la boucle (canonique)** : produire le CSV validé → l'opérateur le téléverse via **Admin → Import en masse → Événements**. Les fiches arrivent en **brouillon** → relecture → **publier**.
- **(b) Agent autonome (API)** : POST chaque fiche sur `POST /api/v1/upload` (images) puis `POST /api/v1/events` (token admin), payload :
  `{ title, slug, summary, content, dateISO|year|period, countryCode, themeIds:[<uuid>], media:[{type:'image',url,caption}], sources:[{label,url}] }`.
  Résoudre les `themeIds` via `GET /api/v1/themes` (slug→id). Créer en brouillon, publier après contrôle.

> **Avant publication** : passer chaque brouillon par `references/CHECKLIST_VALIDATION.md` (porte qualité AFRIKIA).

## 6. Garde‑fous (rappel)
- **Originalité** : aucune copie Wikipédia/presse → réécriture intégrale.
- **Ton** : pédagogique, narratif, **fier** ; **intemporel** (marqueurs absolus) ; **sobre** (faits, pas d'adjectifs) ;
  **sujets vivants** → finir sur une perspective (pas de « héritage/conclusion »).
- **Image** : doit **illustrer** la fiche (sinon c'est une encyclopédie). Vérifiée (HTTP 200 + pertinente).
- **Source** : ≥ 1 URL fiable par fiche ; dates/noms exacts.
- **Format** : titre ≤60 ; teaser ; corps 150–300 mots.
- **Process** : **staging d'abord**, brouillon → publication après validation ; pas de doublon.

## 7. Après le Lamb
Enchaîner sur les autres récits prioritaires (cf. `MISSION… §5`) puis la curation pan‑africaine plus large
(`references/THEMATIQUES.md` / `CONTENT_CURATION_PLAN.md`), en respectant l'équilibrage géo/époque/genre.
