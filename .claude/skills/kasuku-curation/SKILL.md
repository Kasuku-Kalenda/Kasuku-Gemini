---
name: kasuku-curation
description: >-
  Curer des événements Kasuku riches et sourcés (fierté africaine : histoire, sport,
  personnalités, culture, sciences, civilisations…) dans un CSV importable en masse,
  au standard éditorial Kasuku 1.2 — courte ET longue description, médias vérifiés.
  À utiliser pour remplir/étendre le contenu de Kasuku vers l'objectif de 1000 événements,
  ou dès qu'on prépare un lot d'événements à importer via « Import en masse ».
---

# Kasuku — Curation de contenu (vers 1000 événements)

Tu produis des **événements de calendrier** pour Kasuku, au format CSV prêt pour l'**Import en masse**
(Admin → Import en masse → Événements), au **standard éditorial Kasuku 1.2**.

> 🇸🇳 **Campagne en cours — Édition JOJ Dakar 2026 (patrimoine sportif sénégalais).**
> **Lis d'abord `references/MISSION_JOJ_DAKAR_2026.md`** : contexte, objectif (1000 fiches offline),
> périmètre (disciplines JOJ + 10 récits prioritaires), formats exacts, et **premier chantier : la lutte
> sénégalaise (Lamb)** à partir de l'exposition fournie.

## 0. Ton éditorial & règles — NON NÉGOCIABLE
Kasuku célèbre la **fierté, la dignité et l'excellence africaines** : civilisations, génie, résistances
victorieuses, créativité, sport, rayonnement mondial et diaspora. Écris **factuel et sourcé**, jamais
militant ni approximatif. Chaque drame (traite, colonisation, génocide) est **relié à la résistance, la
résilience ou la renaissance** — jamais d'afro-pessimisme. Noms propres, dates, lieux et chiffres précis.

**Le ton Kasuku** = ni le froid de Wikipédia, ni le journalistique de la presse : **pédagogique, narratif et
fier**. On ne donne pas qu'une information, on **raconte une histoire**.

Règles d'écriture (la LOI) :
1. **Intemporalité (archives)** : marqueurs absolus (« Depuis 2022 », « À l'horizon 2026 »), jamais relatifs
   (« aujourd'hui », « actuellement », « bientôt »).
2. **Sobriété** : remplacer l'adjectif subjectif par le fait concret (« 50 000 places, normes FIFA cat. 1 »,
   pas « stade incroyablement gigantesque »).
3. **Originalité OBLIGATOIRE** : **ne jamais copier** Wikipédia/presse → réécriture intégrale. Le plagiat est rejeté.
4. **Sujets vivants** : pas de ton définitif (pas de « héritage/conclusion ») → finir sur un **fait récent ou
   une perspective**. Un récit Kasuku est une **trajectoire**, pas une biographie finale.

## 1. Le format d'une fiche (les DEUX descriptions — cœur de la demande)
Chaque événement = un **titre court** + **deux** textes, et tu remplis **les deux** :

- **`titre`** — percutant, **≤ 60 caractères**.
- **`resume` (courte, OBLIGATOIRE, ≥ 40 caractères)** — le **teaser**, style « **Le saviez‑vous ?** » :
  1 à 2 phrases qui donnent envie. C'est ce qui s'affiche sur les cartes et le calendrier.
- **`contenu` (longue, le corps du récit)** — **150 à 300 mots**, narratifs et sourcés, au standard 1.2 :
  *ce qui s'est passé*, *qui*, *où*, *avec quels chiffres*, et une **fin sur la portée / la perspective**
  (jamais un ton de clôture pour un sujet vivant — cf. règle §0.4).

> Contrairement aux anciens événements (résumé seul), ici la **longue description (`contenu`) est la norme**.
> Modèle exact + exemple « gold » : `references/STANDARD_EDITORIAL.md`. Format/règles d'import : `references/FORMAT_CSV.md`.

## 2. Format CSV (importateur officiel)
Colonnes (en-têtes **exacts, en minuscules**, ne pas renommer) :

```
titre,slug,resume,contenu,dateISO,annee,periode,codePays,slugsThemes,imageUrl,imageLegende,sourceLabel,sourceUrl,slugTimeline
```

- `titre` ✅, `resume` ✅ (≥40 car.). Tout le reste est optionnel mais **`contenu`, `dateISO`/`periode`,
  `codePays`, `slugsThemes`, `imageUrl`, `sourceLabel`+`sourceUrl` sont attendus pour un événement de qualité**.
- **Dates** : `dateISO` = `AAAA-MM-JJ` (date précise) ; sinon `annee` (année seule) ; sinon `periode`
  (texte libre, ex. `1914-1918`, `XIIIe siècle`, `Époque précoloniale`). Au moins l'un des trois.
- `codePays` = ISO **2 lettres** (`SN`, `CD`, `EG`…). Laisser vide si transnational/diaspora.
- `slugsThemes` = slugs séparés par virgule → **la cellule DOIT être entre guillemets** (ex. `"histoire,politique"`).
  Slugs valides : `histoire`, `politique`, `culture`, `personnages`, `geographie`, `science`, `spiritualite`,
  `sport`. ⚠️ Un slug **inexistant est silencieusement ignoré** → l'événement n'aura pas ce thème.
- `imageUrl` + `imageLegende` : 1 image de couverture (URL directe **vérifiée**, cf. §4) + sa légende.
- `sourceLabel` + `sourceUrl` : au moins une source crédible (Wikipédia, UNESCO, presse, fédération…).
- `slugTimeline` : laisser vide (sauf si on rattache l'événement à un récit existant déjà en base).

Détail complet des colonnes + règles de validation : `references/FORMAT_CSV.md`.
Modèle prêt à remplir : `assets/evenements_modele.csv`.

## 3. Quoi curer — thématiques & équilibrage
Le plan complet (14 domaines, cibles ≈1000, exemples concrets) est dans
**`references/THEMATIQUES.md`** (et `CONTENT_CURATION_PLAN.md` à la racine du repo).

Respecte les **règles d'équilibrage** sur chaque lot et sur l'ensemble :
- **Géographie** : viser les 54 pays + diaspora ; ne pas surconcentrer sur Mali/Sénégal/Congo/Éthiopie.
- **Époque** : inclure Antiquité/Médiéval (fierté des civilisations) ET XXIe siècle (renaissance), pas que le colonial.
- **Genre** : ≥ 25–30 % de femmes.
- **Registre** : ≥ 60 % d'événements « positifs » (création, victoire, accomplissement).
- **Pas de doublon** : avant d'écrire, récupère les slugs existants (`GET /api/v1/events?limit=1000`) et
  évite les titres/slugs déjà présents.

## 4. Médias — l'image DOIT illustrer le texte (impératif)
**Principe non négociable : une image hors-sujet est INTERDITE** (sinon ce n'est plus qu'une encyclopédie).
Ordre de préférence :
1. **Image libre PERTINENTE** (Wikimedia / domaine public), URL directe testée **HTTP 200**.
2. **À défaut** (fréquent pour des figures sportives sénégalaises précises) : une **photo fournie/propre**
   **recadrée sur la partie utile** (le visuel seul, **sans le texte autour**), **téléversée sur MinIO**
   (`/storage/…`). Pour le chantier **Lamb**, partir des photos de l'exposition (cf. `MISSION_JOJ_DAKAR_2026.md §6`).

Règles de vérification (issues d'erreurs réelles, cf. repo `ERRORS.md`) :
- **URL directe** d'image (`https://upload.wikimedia.org/…/Fichier.jpg`), pas une page web.
- Source fiable : **Wikimedia Commons** (recherche `filetype:bitmap`) ou image d'article Wikipédia.
- **Rejeter** : cartes/locators (`*_in_its_region*`, `locator`, `orthographic`), drapeaux/blasons quand on
  veut une photo de sujet, fichiers `.svg`/`.tif`, et les enregistrements **Lingua Libre `LL-Q*`** pour l'audio.
- **Pertinence** : le nom de fichier doit correspondre au sujet (un HTTP 200 ne garantit pas la pertinence —
  ex. « Dan mask » a déjà renvoyé une photo d'Elon Musk). Vérifie visuellement le nom de fichier.
- **Vérification obligatoire** : passe ton CSV dans `scripts/verifier_csv.py` — il teste chaque `imageUrl`
  (HTTP 200, suit les redirections), applique la blocklist, et valide les champs (resume ≥40, dateISO, codePays,
  longueur de `contenu`). N'importe **aucune** ligne tant que le script n'est pas vert.

```
python3 .claude/skills/kasuku-curation/scripts/verifier_csv.py mon_lot.csv
```

## 5. Workflow d'un lot (30–50 événements)
1. **Choisir un domaine/lot** dans `references/THEMATIQUES.md` (ex. Sport, Civilisations…).
2. **Lister l'existant** pour ne pas dupliquer (`GET /api/v1/events?limit=1000` → titres/slugs/pays/époques).
3. **Rédiger chaque ligne** : titre, `resume` (accroche), `contenu` (récit 1.2), date, pays, thèmes, source(s).
4. **Trouver + vérifier l'image** de chaque événement (§4).
5. **Assembler le CSV** depuis `assets/evenements_modele.csv` (mêmes en-têtes), 1 ligne/événement.
6. **Valider** : `python3 …/scripts/verifier_csv.py lot.csv` → corriger jusqu'au vert.
7. **Importer** : Admin → *Import en masse* → onglet **Événements** → téléverser le CSV → vérifier la
   prévisualisation (lignes valides) → *Importer*. (Faire d'abord sur **staging**.)
8. **Vérifier** après import : l'événement apparaît, image OK, longue description présente
   (`GET /api/v1/events/slug/<slug>` → champ `content` non vide).

> ⚠️ **Thème `sport`** : s'il n'existe pas encore en base, le créer **avant** d'importer des événements sport
> (sinon le thème est ignoré). Demander à l'admin / via l'API thèmes.
> ⚠️ **Staging avant prod** — toujours.

## 6. Check-list qualité (par ligne)
- [ ] `resume` = accroche claire ≥ 40 car. ; `contenu` = récit riche (≈600–1200 car.), factuel, fier, finissant sur la portée.
- [ ] Date renseignée (dateISO **ou** annee **ou** periode) ; `codePays` correct (ou vide si transnational).
- [ ] ≥ 1 `slugThemes` valide (cellule entre guillemets si plusieurs).
- [ ] `imageUrl` directe **vérifiée 200 + pertinente** + `imageLegende`.
- [ ] ≥ 1 source (`sourceLabel` + `sourceUrl`).
- [ ] Pas de doublon ; orthographe des noms propres exacte ; aucune invention non sourcée.

## 7. (Option) Assembler des RÉCITS
Le standard 1.2 est en réalité un **récit** = ~9 événements autour d'un fil, avec une **introduction
globale** et une **perspective**. Pour ça : créer d'abord les événements (ci-dessus), puis le récit
(timeline) qui les regroupe via l'onglet **Moments** de l'import (modèle `slugTimeline,slugEvenement,…`)
ou via le formulaire Récit. Voir `references/STANDARD_EDITORIAL.md` §Récit.

## Fichiers de ce skill
- `references/MISSION_JOJ_DAKAR_2026.md` — **la mission en cours** (édition JOJ Sénégal, périmètre, premier chantier lutte). À lire en premier.
- `references/STANDARD_EDITORIAL.md` — le standard 1.2 (structure, exemple gold, style des 2 descriptions).
- `references/FORMAT_CSV.md` — colonnes exactes + règles de validation de l'importateur.
- `references/THEMATIQUES.md` — les 14 domaines + cibles + équilibrage.
- `assets/evenements_modele.csv` — gabarit CSV (en-têtes + 2 exemples au standard).
- `scripts/verifier_csv.py` — validation des champs + vérification HTTP 200 + blocklist des images.
