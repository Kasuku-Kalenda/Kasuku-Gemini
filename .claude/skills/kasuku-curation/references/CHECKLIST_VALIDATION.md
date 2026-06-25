# Checklist de validation — avant publication

Porte de qualité AFRIKIA. À passer sur **chaque brouillon** avant de le publier. Sert aussi d'**auto‑contrôle**
à l'agent avant soumission. Règle d'or : **au moindre ❌ rouge → on ne publie pas**, on corrige.

## A. Par fiche (événement)

### Éditorial / ton
- [ ] **Ton Kasuku** : pédagogique, narratif et **fier** — ça **raconte une histoire**, ce n'est pas une notice.
- [ ] **Intemporalité** : aucun marqueur relatif (« aujourd'hui », « actuellement », « récemment », « bientôt »).
      Uniquement des marqueurs absolus (« Depuis 2022 », « À l'horizon 2026 »).
- [ ] **Sobriété** : des faits chiffrés, pas d'adjectifs subjectifs (« gigantesque », « incroyable »).
- [ ] **Sujet vivant** (athlète actif, infrastructure récente) : se termine sur un **fait récent / une perspective**,
      **sans** mot de clôture (« héritage », « testament », « conclusion »).
- [ ] **Pas d'afro‑pessimisme** : un fait douloureux est relié à une résistance / résilience / renaissance.

### Originalité (anti‑plagiat) — éliminatoire
- [ ] Le texte est une **réécriture originale**. **Aucune phrase copiée** de Wikipédia ou de la presse.
      (Au doute : reformuler entièrement.)

### Format
- [ ] **Titre ≤ 60 caractères**, percutant.
- [ ] **`resume`** (teaser « Le saviez‑vous ? ») présent, **≥ 40 caractères**, accrocheur.
- [ ] **`contenu`** (corps) = **150–300 mots**, structuré (fait daté → déroulé précis → portée).

### Exactitude / sources
- [ ] **Date** présente et exacte (`dateISO` AAAA‑MM‑JJ, ou `annee`, ou `periode`), cohérente avec la source.
- [ ] Noms propres correctement orthographiés ; chiffres/scores vérifiés.
- [ ] **≥ 1 source fiable** (`sourceLabel` + `sourceUrl`) : APS, presse, site officiel CIO/Dakar 2026, IFAN, fédération…
      (L'exposition seule ne suffit pas : corroborer par une 2e source quand c'est possible.)

### Image — doit ILLUSTRER
- [ ] Image présente, **pertinente** (illustre vraiment le sujet — pas une carte, un drapeau, un panneau de texte,
      ni une vue de salle de musée).
- [ ] URL **directe** qui répond **HTTP 200** (testée par `verifier_csv.py`).
- [ ] **Recadrée proprement** si issue d'un panneau (le visuel seul, **sans le texte autour**).
- [ ] **`imageLegende`** renseignée + **crédit** (ex. « Exposition LÀMB, DCIA/IFAN, 2026 »).

### Classement / cohérence
- [ ] **≥ 1 `slugThemes` valide** (`sport` pour l'édition JOJ ; + `histoire`/`culture`… si pertinent).
- [ ] **`codePays`** correct (édition Sénégal : `SN`), ou vide si transnational.
- [ ] **Pas de doublon** d'un événement déjà en base (vérifier titre/slug via `GET /events?limit=1000`).

## B. Par récit (storytelling)
- [ ] **Titre de récit** clair + **introduction globale** (le cadre).
- [ ] **≥ 5 fiches événements** liées, chacune valide (section A).
- [ ] Ordre **chronologique** cohérent ; le fil raconte une vraie trajectoire.
- [ ] **Perspective** finale (dynamique actuelle / à venir), sans ton de clôture.

## C. Rejets automatiques (red flags → ne PAS publier)
- ❌ Phrase copiée telle quelle d'une source (plagiat).
- ❌ Image hors‑sujet, cassée (≠ 200), ou panneau avec texte/vue de salle utilisé comme cover.
- ❌ Aucune source, ou date inventée/incohérente.
- ❌ Marqueur temporel relatif, ton de clôture sur un sujet vivant, ou adjectifs grandiloquents.
- ❌ Titre > 60 car., `resume` < 40 car., ou `contenu` hors 150–300 mots.

## D. Process
- [ ] Validé **sur staging** d'abord ; passage en **`published`** seulement après cette checklist.
- [ ] CSV passé au vert par `scripts/verifier_csv.py` avant import.
- [ ] Lot équilibré (cf. `THEMATIQUES.md` : géographie / époque / genre / registre positif).
