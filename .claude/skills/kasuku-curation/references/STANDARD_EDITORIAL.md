# Standard éditorial Kasuku 1.2

Issu du « MODÈLE DE RÉCIT KASUKU (Standard 1.2) ». Référence de **qualité et de ton** pour les
deux descriptions de chaque événement, et pour l'assemblage en récits.

## A. Les deux descriptions

### `resume` (courte — accroche)
1 à 2 phrases. Situe l'événement et donne envie. ≥ 40 caractères.
> *Ex.* « Le 31 mai 2002, le Sénégal renverse la France, championne du monde en titre, pour ses
> débuts en Coupe du monde — un choc qui devient un symbole de fierté africaine. »

### `contenu` (longue — récit complet, le cœur du standard 1.2)
≈ 600–1200 caractères, 5 à 10 phrases. Structure implicite :
1. **Le fait, daté et localisé** (qui, quoi, où, quand).
2. **Le déroulé concret** avec détails précis (noms, scores, chiffres, protagonistes).
3. **La portée / la signification** — pourquoi c'est un marqueur de fierté, de rupture ou de construction.

**Exemple GOLD** (événement « L'épopée de Séoul », tiré du modèle) :
> « Le 31 mai 2002 à Séoul, le Sénégal affronte en match d'ouverture la France, championne du monde
> en titre. Les Lions de la Teranga, qui disputent leur première Coupe du Monde, font tomber les Bleus
> grâce à un but de Papa Bouba Diop en première période. Avec un quart de finale atteint, les Sénégalais
> égalent la meilleure performance africaine en Coupe du monde, imitant le Cameroun de 1990, et réalisent
> la meilleure performance ouest-africaine de la compétition. La célébration iconique de Bouba Diop autour
> du poteau de corner fait le tour du monde et devient un symbole durable de fierté africaine. »

### Ton — à faire / à éviter
- ✅ Factuel, précis, narratif, **fier** ; noms propres et chiffres exacts ; finir sur la portée.
- ✅ Relier les épisodes douloureux à la résistance / résilience / renaissance.
- ❌ Pas d'emphase creuse, pas de jugement militant, **aucune invention non sourcée**, pas d'afro-pessimisme.

## B. Sources
Au moins une source crédible par événement (`sourceLabel` + `sourceUrl`). Exemples du modèle : Wikipédia,
Jeune Afrique, France 24, RSSSF, fédérations sportives, UNESCO, presse panafricaine. Vérifier l'orthographe
des noms et la cohérence des dates avec la source.

## C. Médias
1 image de couverture par événement : URL **directe** vérifiée (HTTP 200), **pertinente** (le nom de
fichier correspond au sujet), avec une **légende** (`imageLegende`) — comme dans le modèle où chaque
événement porte une photo légendée. Voir `scripts/verifier_csv.py` et la blocklist (SKILL.md §4).

## D. Récit (option — regrouper des événements)
Un **récit** Standard 1.2 = un fil thématique de ~6 à 12 événements, avec :
1. **Titre du récit** (ex. « L'ascension du football sénégalais : un demi-siècle vers l'élite »).
2. **Introduction globale (le cadre)** — un paragraphe qui pose la trajectoire d'ensemble (devient le
   `resume`/`summary` du récit).
3. **La timeline** — les événements (chacun = une ligne du CSV événements, avec `contenu` riche), ordonnés
   par date.
4. **Perspective (dynamique actuelle)** — un paragraphe de clôture tourné vers l'avenir.

Pour assembler : créer les événements d'abord (CSV événements), puis le récit qui les regroupe (formulaire
Récit, ou onglet « Moments » de l'import : `slugTimeline,slugEvenement,titre,recit,typeDuration,dateExact,…`).
Le champ `recit` d'un moment peut reprendre/condenser le `contenu` de l'événement.

## E. Mapping standard 1.2 → champs Kasuku
| Élément du modèle | Champ événement (CSV) |
|---|---|
| Titre de l'événement | `titre` |
| « Date de référence : JJ-MM-AAAA » | `dateISO` (= `AAAA-MM-JJ`) ; ou `periode` si tranche/époque |
| Paragraphe descriptif riche | `contenu` (longue description) |
| Accroche (à rédiger) | `resume` (courte description) |
| Image + légende | `imageUrl` + `imageLegende` |
| Sources | `sourceLabel` + `sourceUrl` |
| Pays concerné | `codePays` (ISO 2 lettres) |
| Domaine (cf. THEMATIQUES) | `slugsThemes` |
