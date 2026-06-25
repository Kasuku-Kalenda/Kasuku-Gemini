# Images Lamb sur MinIO — couvertures préparées depuis l'exposition LÀMB

Couvertures recadrées depuis les panneaux de l'exposition **LÀMB — Demb ak Tay** (DCIA/IFAN, Dakar 2026),
**sans le texte autour**, uploadées sur MinIO via `scripts/recadrer_uploader.py`. À coller dans la colonne
`imageUrl` de la fiche correspondante. **Crédit image** : « Exposition LÀMB, DCIA/IFAN, Dakar 2026 ».

| Sujet | Panneau source | `imageUrl` (MinIO) | `imageLegende` suggérée |
|---|---|---|---|
| **Mbaye Guèye « le Tigre de Fass »** | `Exposition/20260112_184341.jpg` | `https://staging.kasuku.afrikia.org/storage/events/34cde667-8832-42e9-ac4d-23812cdbf581.jpg` | Mbaye Guèye au stade Demba Diouf |

## Comment ajouter les autres (par fiche)
La curation des images se fait **au fil des fiches** (l'image doit illustrer la fiche). Pour chaque fiche Lamb :
1. Repérer le panneau de l'expo qui correspond (`…/Curation /Exposition/`).
2. Recadrer + uploader :
   ```bash
   export KASUKU_TOKEN=…   # cf. en-tête de scripts/recadrer_uploader.py (login admin)
   python3 .claude/skills/kasuku-curation/scripts/recadrer_uploader.py \
       --src "/Users/Apple/Documents/Kasuku/Curation /Exposition/<panneau>.jpg" \
       --box 0.45,0.03,0.99,0.85   # fractions L,T,R,B — ajuster pour ne garder que la photo
   ```
3. Coller l'URL renvoyée dans `imageUrl`, ajouter `imageLegende` + le crédit.

> Panneaux utiles repérés (à recadrer selon la fiche) : biographies de lutteurs (grande photo) et scènes
> d'arène/ambiance en N&B. Éviter les panneaux **texte/crédits** et les **vues de salle** (cadres au mur,
> vitrines) qui n'illustrent pas un sujet précis.
