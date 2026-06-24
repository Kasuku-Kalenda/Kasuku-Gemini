# Format CSV — Import en masse « Événements »

En-têtes **exacts**, en minuscules, dans cet ordre (ne pas renommer, ne pas retirer de colonne) :

```
titre,slug,resume,contenu,dateISO,annee,periode,codePays,slugsThemes,imageUrl,imageLegende,sourceLabel,sourceUrl,slugTimeline
```

| Colonne | Rôle | Requis | Règle de validation |
|---|---|---|---|
| `titre` | Titre de l'événement | ✅ | ≥ 3 caractères |
| `slug` | Identifiant URL | — | auto-généré depuis le titre si vide ; sinon `a-z0-9-` |
| `resume` | Courte description (accroche) | ✅ | **≥ 40 caractères** |
| `contenu` | Longue description (récit 1.2) | recommandé | viser 600–1200 car. ; multi-phrases sourcées |
| `dateISO` | Date précise | —* | format **`AAAA-MM-JJ`** |
| `annee` | Année seule | —* | entier (ex. `1960`) |
| `periode` | Période / époque (texte) | —* | libre (`1914-1918`, `XIIIe siècle`, `Époque précoloniale`) |
| `codePays` | Pays | — | **ISO 3166-1 alpha-2** (2 lettres : `SN`, `CD`, `EG`…) ; vide si transnational |
| `slugsThemes` | Thèmes | — | slugs séparés par virgule ; **mettre la cellule entre guillemets** |
| `imageUrl` | Image de couverture | — | URL **directe** d'image, vérifiée HTTP 200 |
| `imageLegende` | Légende de l'image | — | texte court |
| `sourceLabel` | Nom de la source | — | requis si `sourceUrl` présent |
| `sourceUrl` | URL de la source | — | requis si `sourceLabel` présent |
| `slugTimeline` | Récit à lier | — | slug d'un récit **existant** (sinon laisser vide) |

\* **Au moins un** parmi `dateISO` / `annee` / `periode`.

## Slugs de thèmes valides
`histoire` · `politique` · `culture` · `personnages` · `geographie` · `science` · `spiritualite` · `sport`

- Plusieurs thèmes : `"histoire,politique"` (guillemets obligatoires car la virgule est le séparateur CSV).
- ⚠️ Un slug **inconnu est silencieusement ignoré** par l'importateur → vérifier l'orthographe exacte.
- ⚠️ Le thème **`sport`** doit exister en base avant d'importer des événements sportifs (sinon ignoré).

## Règles CSV
- Encodage **UTF-8** (BOM accepté). Séparateur **virgule**. Fin de ligne LF ou CRLF.
- Tout champ contenant une virgule, un guillemet ou un retour à la ligne **doit être entre guillemets** `"…"`.
- Un guillemet littéral à l'intérieur d'un champ se double : `""`.
- 1 ligne d'en-tête + 1 ligne par événement. **Max 1000 lignes** par fichier (lots de 30–50 conseillés).
- Les lignes invalides sont **ignorées** à l'import (pas bloquantes) — d'où l'intérêt de valider avant.

## Comportement de l'importateur (pour info)
- Mappe `resume`→`summary`, `contenu`→`content`, `periode`→période, `codePays`→pays, `slugsThemes`→thèmes
  (résolus par slug), `imageUrl`/`imageLegende`→média de couverture, `sourceLabel`/`sourceUrl`→source.
- Crée chaque événement en statut **brouillon** par défaut → à **publier** ensuite (admin) pour qu'il
  apparaisse côté public.
- `slug` en doublon : l'API renvoie une erreur sur cette ligne (les autres passent) → garder des slugs uniques.

## Vérification avant import
```
python3 .claude/skills/kasuku-curation/scripts/verifier_csv.py mon_lot.csv
```
Le script valide chaque champ et teste chaque `imageUrl` (HTTP 200 + blocklist). Corriger jusqu'au vert.
