-- ============================================================
--  KASUKU — Schéma PostgreSQL complet
--  Version  : 1.0.0
--  Encodage : UTF-8
--  Collation : fr-FR (French full-text search par défaut)
-- ============================================================
--
--  Philosophie :
--    • Event  = objet central, hub de toute la connaissance
--    • Story  = couche narrative (suite ordonnée d'Events)
--    • Module = couche pédagogique (cours rattaché à des Events)
--    • Theme  = classification hiérarchique (remplace categories)
--    • Tag    = mot-clé libre et léger
--    • Kalenda = paquet de contenus pour déploiement offline
--
--  Conventions :
--    • PK     : UUID (gen_random_uuid())
--    • Dates  : TIMESTAMPTZ (toujours avec timezone)
--    • Soft delete : colonne deleted_at NULL
--    • Statut éditorial : draft → published → archived
--    • Multilingue : table translations (Option B)
--    • Crédits : JSONB contributors/creators (libre, non lié à users)
-- ============================================================


-- ============================================================
--  0. EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";     -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "unaccent";     -- recherche sans accents
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- recherche approximative (LIKE rapide)


-- ============================================================
--  1. TYPES ÉNUMÉRÉS
-- ============================================================

-- Type de temporalité d'un événement
CREATE TYPE temporal_type AS ENUM (
  'exact_date',   -- date précise connue
  'date_range',   -- période (start_date → end_date)
  'approximate',  -- siècle ou décennie approximatif
  'unknown'       -- date inconnue
);

-- Statut éditorial (partagé par tous les objets publiables)
CREATE TYPE content_status AS ENUM (
  'draft',        -- brouillon, non visible publiquement
  'published',    -- publié, visible
  'archived'      -- archivé, non visible mais conservé
);

-- Fiabilité historique d'un événement
CREATE TYPE reliability_type AS ENUM (
  'confirmed',    -- date/fait confirmé par des sources fiables
  'probable',     -- probable mais non certifié
  'contested',    -- sujet à débat historiographique
  'unknown'       -- origine ou date incertaine
);

-- Nature de la relation entre deux événements
CREATE TYPE relation_type AS ENUM (
  'cause',        -- A a causé B
  'consequence',  -- B est une conséquence de A
  'concurrent',   -- A et B sont contemporains et liés
  'response',     -- B est une réponse directe à A
  'context',      -- A fournit le contexte de B
  'related'       -- relation générique
);

-- Type de fichier média
CREATE TYPE media_type AS ENUM (
  'image',
  'video',
  'audio',
  'pdf',
  'document'
);

-- Rôle d'une personne dans un événement
CREATE TYPE person_role AS ENUM (
  'protagonist',  -- acteur principal
  'witness',      -- témoin
  'author',       -- auteur d'un texte lié
  'organizer',    -- organisateur
  'opponent',     -- opposant
  'victim',       -- victime
  'other'
);

-- Rôle d'un lieu dans un événement
CREATE TYPE place_role AS ENUM (
  'primary',      -- lieu principal de l'événement
  'related',      -- lieu secondaire
  'origin',       -- lieu d'origine (départ)
  'destination'   -- lieu d'arrivée
);

-- Type de lieu géographique
CREATE TYPE place_type AS ENUM (
  'continent',
  'country',
  'region',
  'city',
  'site',         -- lieu historique, monument, quartier
  'virtual'       -- espace non géographique (ex : internet, espace)
);

-- Rôle d'un utilisateur dans l'administration
CREATE TYPE user_role AS ENUM (
  'admin',        -- accès total
  'editor',       -- peut publier
  'contributor',  -- peut créer, ne peut pas publier
  'viewer'        -- lecture seule (admin)
);


-- ============================================================
--  2. UTILISATEURS (workflow éditorial)
-- ============================================================

CREATE TABLE users (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email        VARCHAR(255) UNIQUE NOT NULL,
  name         VARCHAR(255) NOT NULL,
  role         user_role    NOT NULL DEFAULT 'contributor',
  avatar_url   TEXT,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ
);

COMMENT ON TABLE  users              IS 'Comptes éditoriaux internes — ne pas confondre avec les contributeurs de contenu (JSONB).';
COMMENT ON COLUMN users.role         IS 'admin > editor > contributor > viewer';
COMMENT ON COLUMN users.is_active    IS 'FALSE = compte désactivé sans suppression.';


-- ============================================================
--  3. THÈMES (hiérarchiques — remplace categories + ancien themes)
-- ============================================================

CREATE TABLE themes (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         VARCHAR(255) UNIQUE NOT NULL,
  name         VARCHAR(255) NOT NULL,
  description  TEXT,
  parent_id    UUID        REFERENCES themes(id) ON DELETE SET NULL,
  color        VARCHAR(7),           -- code hex ex: #E63946
  icon         VARCHAR(100),         -- nom d'icône ou URL SVG
  position     SMALLINT    NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  themes           IS 'Classification hiérarchique. Un thème sans parent est une catégorie racine.';
COMMENT ON COLUMN themes.parent_id IS 'NULL = thème racine (ex: "Histoire"). Sinon sous-thème.';
COMMENT ON COLUMN themes.position  IS 'Ordre d'affichage entre thèmes du même niveau.';

CREATE INDEX idx_themes_parent   ON themes(parent_id);
CREATE INDEX idx_themes_slug     ON themes(slug);


-- ============================================================
--  4. LIEUX (hiérarchiques : continent → pays → région → ville → site)
-- ============================================================

CREATE TABLE places (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(255) NOT NULL,
  place_type    place_type   NOT NULL DEFAULT 'city',
  country_code  VARCHAR(2),           -- ISO 3166-1 alpha-2 (ex: SN, CD, ML)
  parent_id     UUID        REFERENCES places(id) ON DELETE SET NULL,
  lat           NUMERIC(9,6),
  lng           NUMERIC(9,6),
  wikipedia_url TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  places              IS 'Géographie hiérarchique. Ex: Afrique → Congo → Kinshasa → Cité de l'OUA.';
COMMENT ON COLUMN places.country_code IS 'ISO 3166-1 alpha-2. NULL pour continents et lieux virtuels.';
COMMENT ON COLUMN places.parent_id    IS 'Relation hiérarchique : ville → région → pays → continent.';
COMMENT ON COLUMN places.lat          IS 'Latitude WGS84. NULL si localisation inconnue ou virtuelle.';

CREATE INDEX idx_places_parent      ON places(parent_id);
CREATE INDEX idx_places_country     ON places(country_code);
CREATE INDEX idx_places_type        ON places(place_type);
CREATE INDEX idx_places_geo         ON places(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;
CREATE INDEX idx_places_slug        ON places(slug);


-- ============================================================
--  5. PERSONNES
-- ============================================================

CREATE TABLE people (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           VARCHAR(255) UNIQUE NOT NULL,
  name           VARCHAR(255) NOT NULL,
  birth_date     DATE,
  death_date     DATE,
  birth_place_id UUID        REFERENCES places(id) ON DELETE SET NULL,
  nationality    VARCHAR(2),           -- ISO 3166-1 alpha-2
  bio            TEXT,
  photo_url      TEXT,
  wikipedia_url  TEXT,
  search_vector  TSVECTOR,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_people_dates CHECK (death_date IS NULL OR birth_date IS NULL OR death_date >= birth_date)
);

COMMENT ON TABLE  people               IS 'Personnalités historiques, politiques, culturelles, scientifiques.';
COMMENT ON COLUMN people.nationality   IS 'Nationalité principale ISO 3166-1. Non restrictif : une personne peut être liée à plusieurs pays via event_people.';
COMMENT ON COLUMN people.search_vector IS 'Vecteur full-text mis à jour par trigger.';

CREATE INDEX idx_people_nationality ON people(nationality);
CREATE INDEX idx_people_search      ON people USING GIN(search_vector);
CREATE INDEX idx_people_slug        ON people(slug);


-- ============================================================
--  6. MÉDIAS & RESSOURCES (avec métadonnées bibliographiques)
-- ============================================================

CREATE TABLE media (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type             media_type  NOT NULL,
  url              TEXT        NOT NULL,

  -- Identification
  title            TEXT        NOT NULL,
  description      TEXT,
  lang             VARCHAR(5),

  -- Métadonnées bibliographiques
  creators         JSONB       NOT NULL DEFAULT '[]',
  -- Structure : [{"name":"Malick Sidibé","role":"photographer"}, {"name":"INA","role":"editor"}]
  -- Rôles libres : photographer, director, author, illustrator,
  --                composer, editor, translator, archivist, producer

  creation_year    SMALLINT,            -- année de création de l'œuvre originale
  publication_date DATE,                -- date de publication (peut différer de creation_year)
  source           TEXT,                -- origine du fichier : "Archives nationales du Mali", "AFP"
  publisher        TEXT,                -- éditeur : "Présence Africaine", "L'Harmattan", "UNESCO"
  edition          TEXT,                -- "3e éd. revue et augmentée"
  isbn             VARCHAR(20),         -- pour PDF/documents

  -- Droits
  credit           TEXT,                -- mention légale : "© AFP 1960"
  license          VARCHAR(100),        -- "CC-BY-4.0", "public_domain", "all_rights_reserved"
  rights_expiry    DATE,                -- expiration des droits si applicable

  -- Technique
  duration_s       INT,                 -- durée en secondes (audio/vidéo)
  width            INT,                 -- largeur en pixels (image/vidéo)
  height           INT,                 -- hauteur en pixels
  size_bytes       BIGINT,
  mime_type        VARCHAR(100),        -- "application/pdf", "audio/mpeg", "video/mp4"

  -- Accessibilité
  alt_text         TEXT,                -- description image pour lecteurs d'écran
  transcript_url   TEXT,                -- URL de la transcription (audio/vidéo)

  -- Upload
  created_by       UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_media_year CHECK (creation_year BETWEEN 1 AND 2100)
);

COMMENT ON TABLE  media                  IS 'Ressources documentaires : images, vidéos, audios, PDFs.';
COMMENT ON COLUMN media.creators         IS 'Tableau JSON de créateurs avec rôle libre. Pas lié à la table users.';
COMMENT ON COLUMN media.creation_year    IS 'Année de création de l'œuvre originale (≠ date d'upload).';
COMMENT ON COLUMN media.source           IS 'Institution ou fonds d'origine du fichier.';
COMMENT ON COLUMN media.publisher        IS 'Éditeur au sens bibliographique.';
COMMENT ON COLUMN media.rights_expiry    IS 'Permet d'alerter sur les droits expirant prochainement.';
COMMENT ON COLUMN media.transcript_url   IS 'Transcription textuelle pour accessibilité et indexation full-text.';

CREATE INDEX idx_media_type          ON media(type);
CREATE INDEX idx_media_creation_year ON media(creation_year);
CREATE INDEX idx_media_lang          ON media(lang);
CREATE INDEX idx_media_license       ON media(license);
CREATE INDEX idx_media_creators      ON media USING GIN(creators);


-- ============================================================
--  7. TAGS (mots-clés légers)
-- ============================================================

CREATE TABLE tags (
  id   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL
);

COMMENT ON TABLE tags IS 'Mots-clés libres et légers. Pas hiérarchiques. Complémentaires aux thèmes.';

-- Pivot polymorphique : un tag peut s'attacher à n'importe quelle entité
CREATE TABLE taggables (
  tag_id      UUID        NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  entity_type VARCHAR(20) NOT NULL,   -- 'event','story','module','media'
  entity_id   UUID        NOT NULL,
  PRIMARY KEY (tag_id, entity_type, entity_id)
);

COMMENT ON TABLE  taggables             IS 'Association polymorphique tags ↔ entités.';
COMMENT ON COLUMN taggables.entity_type IS 'Nom de la table cible : event, story, module, media.';

CREATE INDEX idx_taggables_entity ON taggables(entity_type, entity_id);


-- ============================================================
--  8. ÉVÉNEMENTS (objet central du graphe Kasuku)
-- ============================================================

CREATE TABLE events (
  id                   UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                 VARCHAR(255)     UNIQUE NOT NULL,
  lang                 VARCHAR(5)       NOT NULL DEFAULT 'fr',

  -- Contenu principal
  title                VARCHAR(255)     NOT NULL,
  summary              TEXT,
  content              TEXT,

  -- Crédits éditoriaux (libres, non liés à users)
  contributors         JSONB            NOT NULL DEFAULT '[]',
  -- Structure : [{"name":"Amara Diallo","role":"author"}, {"name":"IFAN","role":"source"}]

  -- ── Temporalité ─────────────────────────────────────────
  temporal_type        temporal_type    NOT NULL DEFAULT 'exact_date',
  start_date           DATE,            -- date de début (ou date unique)
  end_date             DATE,            -- date de fin (pour date_range)
  display_date         VARCHAR(255),    -- libellé affiché : "vers 1450", "XIVe siècle", "ca. 1820"
  approx_century       SMALLINT,        -- ex: 20 = XXe siècle, -5 = Ve siècle av. J.-C.
  approx_decade        SMALLINT,        -- ex: 1960, 1970 (arrondi à la dizaine)
  annual_recurrence    BOOLEAN          NOT NULL DEFAULT FALSE,
  -- FALSE par défaut : activer manuellement pour anniversaires, fêtes, commémorations

  -- ── Géographie primaire (filtrage rapide) ───────────────
  primary_country_code VARCHAR(2),      -- ISO 3166-1 alpha-2
  primary_place_id     UUID            REFERENCES places(id) ON DELETE SET NULL,

  -- ── Mise en avant ────────────────────────────────────────
  featured             BOOLEAN          NOT NULL DEFAULT FALSE,
  featured_position    SMALLINT,        -- 1 = première position en vedette

  -- ── Fiabilité historique ──────────────────────────────────
  reliability          reliability_type NOT NULL DEFAULT 'confirmed',
  source_label         TEXT,            -- ex: "Encyclopédie Africaine, vol. 3, p. 142"
  source_url           TEXT,            -- URL de la source primaire

  -- ── Workflow éditorial ───────────────────────────────────
  status               content_status   NOT NULL DEFAULT 'draft',
  published_at         TIMESTAMPTZ,
  created_by           UUID            REFERENCES users(id) ON DELETE SET NULL,
  updated_by           UUID            REFERENCES users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ      NOT NULL DEFAULT now(),
  deleted_at           TIMESTAMPTZ,     -- soft delete

  -- ── Full-text search ─────────────────────────────────────
  search_vector        TSVECTOR,

  -- ── Contraintes ──────────────────────────────────────────
  CONSTRAINT chk_events_date_range     CHECK (end_date IS NULL OR end_date >= start_date),
  CONSTRAINT chk_events_featured_pos   CHECK (featured_position IS NULL OR featured = TRUE),
  CONSTRAINT chk_events_approx_century CHECK (approx_century IS NULL OR approx_century BETWEEN -50 AND 21),
  CONSTRAINT chk_events_approx_decade  CHECK (approx_decade IS NULL OR approx_decade % 10 = 0),
  CONSTRAINT chk_events_temporal_dates CHECK (
    (temporal_type = 'exact_date'   AND start_date IS NOT NULL) OR
    (temporal_type = 'date_range'   AND start_date IS NOT NULL AND end_date IS NOT NULL) OR
    (temporal_type = 'approximate'  AND (approx_century IS NOT NULL OR approx_decade IS NOT NULL)) OR
    (temporal_type = 'unknown')
  )
);

COMMENT ON TABLE  events                    IS 'Objet central de Kasuku. Tout part d'un événement.';
COMMENT ON COLUMN events.lang               IS 'Langue de rédaction principale du contenu.';
COMMENT ON COLUMN events.contributors       IS 'Crédits libres : auteurs, chercheurs, institutions sources.';
COMMENT ON COLUMN events.display_date       IS 'Libellé textuel libre affiché en UI, indépendant des dates machine.';
COMMENT ON COLUMN events.approx_century     IS 'Utilisé quand temporal_type = approximate. 20 = XXe siècle.';
COMMENT ON COLUMN events.approx_decade      IS 'Granularité décennie. Toujours multiple de 10 (1960, 1970...).';
COMMENT ON COLUMN events.annual_recurrence  IS 'TRUE = réapparaît chaque année à la date anniversaire.';
COMMENT ON COLUMN events.primary_country_code IS 'Code pays principal pour filtrage rapide sans join.';
COMMENT ON COLUMN events.featured_position  IS 'Ordre d'affichage sur la page d'accueil. NULL si non mis en avant.';
COMMENT ON COLUMN events.reliability        IS 'Niveau de certitude historique de l'événement.';
COMMENT ON COLUMN events.source_label       IS 'Référence bibliographique de la source principale.';
COMMENT ON COLUMN events.deleted_at         IS 'Soft delete. Un événement effacé n'est jamais détruit en base.';
COMMENT ON COLUMN events.search_vector      IS 'Vecteur full-text (pondéré) mis à jour automatiquement par trigger.';

-- Index principaux
CREATE INDEX idx_events_slug          ON events(slug);
CREATE INDEX idx_events_start_date    ON events(start_date)          WHERE deleted_at IS NULL;
CREATE INDEX idx_events_status        ON events(status)              WHERE deleted_at IS NULL;
CREATE INDEX idx_events_country       ON events(primary_country_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_century       ON events(approx_century)      WHERE temporal_type = 'approximate';
CREATE INDEX idx_events_decade        ON events(approx_decade)       WHERE temporal_type = 'approximate';
CREATE INDEX idx_events_featured      ON events(featured_position)   WHERE featured = TRUE;
CREATE INDEX idx_events_annual        ON events(start_date)          WHERE annual_recurrence = TRUE;
CREATE INDEX idx_events_search        ON events USING GIN(search_vector);
CREATE INDEX idx_events_contributors  ON events USING GIN(contributors);
CREATE INDEX idx_events_deleted       ON events(deleted_at)          WHERE deleted_at IS NULL;
CREATE INDEX idx_events_lang          ON events(lang);

-- Index trigramme pour ILIKE rapide sur title
CREATE INDEX idx_events_title_trgm    ON events USING GIN(title gin_trgm_ops);


-- ============================================================
--  9. RÉCITS / STORIES (couche narrative)
-- ============================================================

CREATE TABLE stories (
  id                  UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                VARCHAR(255)   UNIQUE NOT NULL,
  lang                VARCHAR(5)     NOT NULL DEFAULT 'fr',

  title               VARCHAR(255)   NOT NULL,
  summary             TEXT,
  cover_url           TEXT,

  -- Crédits éditoriaux
  contributors        JSONB          NOT NULL DEFAULT '[]',

  -- Dates calculées automatiquement via trigger sur story_events
  computed_start_date DATE,
  computed_end_date   DATE,

  -- Workflow éditorial
  status              content_status NOT NULL DEFAULT 'draft',
  published_at        TIMESTAMPTZ,
  created_by          UUID           REFERENCES users(id) ON DELETE SET NULL,
  updated_by          UUID           REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ    NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ,

  -- Full-text search
  search_vector       TSVECTOR
);

COMMENT ON TABLE  stories                    IS 'Récit = suite ordonnée d'événements avec enrichissement narratif contextuel.';
COMMENT ON COLUMN stories.computed_start_date IS 'MIN(start_date) des événements du récit. Calculé par trigger.';
COMMENT ON COLUMN stories.computed_end_date   IS 'MAX(start_date|end_date) des événements du récit. Calculé par trigger.';
COMMENT ON COLUMN stories.cover_url           IS 'URL directe de l'image de couverture.';

CREATE INDEX idx_stories_status  ON stories(status)                                    WHERE deleted_at IS NULL;
CREATE INDEX idx_stories_dates   ON stories(computed_start_date, computed_end_date);
CREATE INDEX idx_stories_search  ON stories USING GIN(search_vector);
CREATE INDEX idx_stories_slug    ON stories(slug);
CREATE INDEX idx_stories_lang    ON stories(lang);
CREATE INDEX idx_stories_title_trgm ON stories USING GIN(title gin_trgm_ops);


-- ============================================================
--  10. MODULES PÉDAGOGIQUES (cours)
-- ============================================================

CREATE TABLE modules (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             VARCHAR(255)   UNIQUE NOT NULL,
  lang             VARCHAR(5)     NOT NULL DEFAULT 'fr',

  title            VARCHAR(255)   NOT NULL,
  summary          TEXT,
  thumbnail_url    TEXT,
  duration_minutes INT,
  level            VARCHAR(20),
  -- Valeurs : 'beginner', 'intermediate', 'advanced'

  -- Contenu structuré en blocs (format actuel de l'app conservé)
  content          JSONB          NOT NULL DEFAULT '[]',
  -- Structure d'un bloc :
  -- {"type":"text","body":"..."}
  -- {"type":"video","url":"...","title":"..."}
  -- {"type":"image","url":"...","alt":"...","credit":"..."}
  -- {"type":"quiz","question":"...","options":["A","B","C"],"answer":0}
  -- {"type":"resource","media_id":"<uuid>","label":"..."}

  -- Crédits éditoriaux
  contributors     JSONB          NOT NULL DEFAULT '[]',

  -- Workflow éditorial
  status           content_status NOT NULL DEFAULT 'draft',
  published_at     TIMESTAMPTZ,
  created_by       UUID           REFERENCES users(id) ON DELETE SET NULL,
  updated_by       UUID           REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ,

  -- Full-text search
  search_vector    TSVECTOR
);

COMMENT ON TABLE  modules          IS 'Module = cours pédagogique rattaché à un ou plusieurs événements.';
COMMENT ON COLUMN modules.level    IS 'beginner | intermediate | advanced.';
COMMENT ON COLUMN modules.content  IS 'Blocs structurés : text, video, image, quiz, resource.';

CREATE INDEX idx_modules_status     ON modules(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_modules_lang       ON modules(lang);
CREATE INDEX idx_modules_level      ON modules(level);
CREATE INDEX idx_modules_search     ON modules USING GIN(search_vector);
CREATE INDEX idx_modules_slug       ON modules(slug);
CREATE INDEX idx_modules_title_trgm ON modules USING GIN(title gin_trgm_ops);


-- ============================================================
--  11. KALENDA (paquets de contenu offline)
-- ============================================================

CREATE TABLE kalendas (
  id                  UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                VARCHAR(255)   UNIQUE NOT NULL,
  name                VARCHAR(255)   NOT NULL,
  description         TEXT,
  version             VARCHAR(20)    NOT NULL DEFAULT '1.0.0',
  region              VARCHAR(255),             -- ex: "Afrique centrale", "Mali — Bamako"
  cover_url           TEXT,

  -- Déploiement
  target_lang         VARCHAR(5),               -- langue cible principale du déploiement
  offline_size_bytes  BIGINT,                   -- taille estimée du paquet généré
  last_exported_at    TIMESTAMPTZ,              -- dernier export physique du paquet

  -- Workflow
  status              content_status NOT NULL DEFAULT 'draft',
  published_at        TIMESTAMPTZ,
  created_by          UUID           REFERENCES users(id) ON DELETE SET NULL,
  updated_by          UUID           REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ    NOT NULL DEFAULT now()
);

COMMENT ON TABLE  kalendas              IS 'Paquet de contenus sélectionnés pour déploiement local hors-ligne.';
COMMENT ON COLUMN kalendas.version      IS 'Versioning sémantique du paquet (ex: 1.2.0).';
COMMENT ON COLUMN kalendas.region       IS 'Zone géographique cible du déploiement (libre).';
COMMENT ON COLUMN kalendas.target_lang  IS 'Langue principale pour ce déploiement.';
COMMENT ON COLUMN kalendas.last_exported_at IS 'Dernière génération physique du fichier de paquet.';

CREATE INDEX idx_kalendas_status ON kalendas(status);


-- ============================================================
--  12. TABLES PIVOT — Relations N-N
-- ============================================================

-- ── Story ↔ Événement (avec enrichissement narratif) ────────

CREATE TABLE story_events (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id            UUID        NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  event_id            UUID        NOT NULL REFERENCES events(id)  ON DELETE RESTRICT,
  -- RESTRICT : on ne peut pas supprimer un événement présent dans un récit
  position            SMALLINT    NOT NULL DEFAULT 0,
  lang                VARCHAR(5),

  -- Enrichissement contextuel (angle narratif propre à ce récit)
  narrative_text      TEXT,
  narrative_audio_url TEXT,
  narrative_video_url TEXT,
  quote               TEXT,
  quote_author        TEXT,
  cta                 JSONB,
  -- Structure CTA : {"label":"En savoir plus","url":"...","type":"link|module|event"}

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(story_id, event_id)
  -- Un même événement ne peut apparaître qu'une fois par récit
);

COMMENT ON TABLE  story_events                  IS 'Junction Story ↔ Event avec enrichissement narratif contextuel. Cœur de la proposition Kasuku.';
COMMENT ON COLUMN story_events.position         IS 'Ordre de l'événement dans le récit (0-based).';
COMMENT ON COLUMN story_events.narrative_text   IS 'Texte narratif propre à cet angle du récit (peut différer selon le Story).';
COMMENT ON COLUMN story_events.cta              IS 'Call-to-action optionnel : lien, module associé, autre événement.';

CREATE INDEX idx_story_events_story ON story_events(story_id, position);
CREATE INDEX idx_story_events_event ON story_events(event_id);


-- ── Événement ↔ Module ───────────────────────────────────────

CREATE TABLE event_modules (
  event_id  UUID NOT NULL REFERENCES events(id)  ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, module_id)
);

COMMENT ON TABLE event_modules IS 'Un module est accessible partout où l'événement auquel il est rattaché apparaît.';

CREATE INDEX idx_event_modules_module ON event_modules(module_id);


-- ── Événement ↔ Thème ────────────────────────────────────────

CREATE TABLE event_themes (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, theme_id)
);

CREATE INDEX idx_event_themes_theme ON event_themes(theme_id);


-- ── Récit ↔ Thème ────────────────────────────────────────────

CREATE TABLE story_themes (
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  theme_id UUID NOT NULL REFERENCES themes(id)  ON DELETE CASCADE,
  PRIMARY KEY (story_id, theme_id)
);

CREATE INDEX idx_story_themes_theme ON story_themes(theme_id);


-- ── Module ↔ Thème ───────────────────────────────────────────

CREATE TABLE module_themes (
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  theme_id  UUID NOT NULL REFERENCES themes(id)  ON DELETE CASCADE,
  PRIMARY KEY (module_id, theme_id)
);

CREATE INDEX idx_module_themes_theme ON module_themes(theme_id);


-- ── Événement ↔ Personne (avec rôle) ────────────────────────

CREATE TABLE event_people (
  event_id  UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  person_id UUID        NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  role      person_role NOT NULL DEFAULT 'other',
  note      TEXT,
  PRIMARY KEY (event_id, person_id, role)
);

COMMENT ON COLUMN event_people.note IS 'Précision libre sur le rôle : "Discours inaugural", "Signataire du traité".';

CREATE INDEX idx_event_people_person ON event_people(person_id);


-- ── Événement ↔ Lieu (avec rôle) ────────────────────────────

CREATE TABLE event_places (
  event_id UUID       NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  place_id UUID       NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  role     place_role NOT NULL DEFAULT 'primary',
  PRIMARY KEY (event_id, place_id, role)
);

CREATE INDEX idx_event_places_place ON event_places(place_id);


-- ── Événement ↔ Média ────────────────────────────────────────

CREATE TABLE event_media (
  event_id UUID     NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  media_id UUID     NOT NULL REFERENCES media(id)  ON DELETE CASCADE,
  position SMALLINT NOT NULL DEFAULT 0,
  is_cover BOOLEAN  NOT NULL DEFAULT FALSE,
  PRIMARY KEY (event_id, media_id)
);

COMMENT ON COLUMN event_media.is_cover IS 'TRUE = image principale de l'événement. Un seul par événement (enforcer en applicatif).';

CREATE INDEX idx_event_media_media ON event_media(media_id);


-- ── Récit ↔ Média ────────────────────────────────────────────

CREATE TABLE story_media (
  story_id UUID    NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  media_id UUID    NOT NULL REFERENCES media(id)   ON DELETE CASCADE,
  is_cover BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (story_id, media_id)
);

CREATE INDEX idx_story_media_media ON story_media(media_id);


-- ── Relations entre événements ───────────────────────────────

CREATE TABLE event_relations (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         UUID          NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  related_event_id UUID          NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  relation_type    relation_type NOT NULL,
  description      TEXT,
  created_by       UUID          REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT chk_no_self_relation CHECK (event_id != related_event_id),
  UNIQUE(event_id, related_event_id, relation_type)
);

COMMENT ON TABLE  event_relations              IS 'Graphe causal et contextuel entre événements. Alimente la vue Explorer.';
COMMENT ON COLUMN event_relations.relation_type IS 'cause | consequence | concurrent | response | context | related';
COMMENT ON COLUMN event_relations.description  IS 'Explication libre de la relation : "La défaite de Sedan entraîne directement..."';

CREATE INDEX idx_event_relations_event   ON event_relations(event_id);
CREATE INDEX idx_event_relations_related ON event_relations(related_event_id);
CREATE INDEX idx_event_relations_type    ON event_relations(relation_type);


-- ── Kalenda ↔ Événements / Récits / Modules / Thèmes ────────

CREATE TABLE kalenda_events (
  kalenda_id UUID NOT NULL REFERENCES kalendas(id) ON DELETE CASCADE,
  event_id   UUID NOT NULL REFERENCES events(id)   ON DELETE CASCADE,
  PRIMARY KEY (kalenda_id, event_id)
);

CREATE TABLE kalenda_stories (
  kalenda_id UUID NOT NULL REFERENCES kalendas(id)  ON DELETE CASCADE,
  story_id   UUID NOT NULL REFERENCES stories(id)   ON DELETE CASCADE,
  PRIMARY KEY (kalenda_id, story_id)
);

CREATE TABLE kalenda_modules (
  kalenda_id UUID NOT NULL REFERENCES kalendas(id)  ON DELETE CASCADE,
  module_id  UUID NOT NULL REFERENCES modules(id)   ON DELETE CASCADE,
  PRIMARY KEY (kalenda_id, module_id)
);

CREATE TABLE kalenda_themes (
  kalenda_id UUID NOT NULL REFERENCES kalendas(id)  ON DELETE CASCADE,
  theme_id   UUID NOT NULL REFERENCES themes(id)    ON DELETE CASCADE,
  PRIMARY KEY (kalenda_id, theme_id)
);

COMMENT ON TABLE kalenda_events  IS 'Contenu sélectionné dans un Kalenda. La résolution des dépendances se fait à l'export, pas à la sélection.';
COMMENT ON TABLE kalenda_stories IS 'Sélectionner un récit n'inclut pas automatiquement ses événements dans le Kalenda.';


-- ============================================================
--  13. TRADUCTIONS (multilingue — Option B)
-- ============================================================

CREATE TABLE translations (
  entity_type   VARCHAR(20)  NOT NULL,
  -- Valeurs : 'event','story','module','theme','tag','place','person','media','kalenda'

  entity_id     UUID         NOT NULL,
  lang          VARCHAR(5)   NOT NULL,
  -- Codes BCP 47 : 'en','sw','ar','pt','ha','yo','am','ln','so'...

  field         VARCHAR(50)  NOT NULL,
  -- Champs traduisibles par entité :
  -- event   : title, summary, content, display_date, source_label
  -- story   : title, summary
  -- module  : title, summary, content (JSON stringifié)
  -- theme   : name, description
  -- place   : name
  -- person  : bio
  -- media   : title, description, alt_text
  -- kalenda : name, description

  value         TEXT         NOT NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'draft',
  -- draft = brouillon de traduction
  -- reviewed = relu et validé
  -- published = mis en ligne

  translated_by UUID         REFERENCES users(id) ON DELETE SET NULL,
  translated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),

  PRIMARY KEY (entity_type, entity_id, lang, field)
);

COMMENT ON TABLE  translations              IS 'Traductions multilingues. Fallback vers la langue source si traduction absente.';
COMMENT ON COLUMN translations.entity_type  IS 'Nom logique de l'entité cible (event, story, module...).';
COMMENT ON COLUMN translations.lang         IS 'Code langue BCP 47 (en, sw, ar, pt, ha, yo, am, ln...).';
COMMENT ON COLUMN translations.field        IS 'Nom du champ traduit (title, summary, content...).';
COMMENT ON COLUMN translations.status       IS 'draft | reviewed | published.';

CREATE INDEX idx_translations_entity  ON translations(entity_type, entity_id);
CREATE INDEX idx_translations_lang    ON translations(lang);
CREATE INDEX idx_translations_status  ON translations(entity_type, lang, status);


-- ============================================================
--  14. HISTORIQUE DES RÉVISIONS (audit trail)
-- ============================================================

CREATE TABLE event_revisions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  changed_by    UUID        REFERENCES users(id) ON DELETE SET NULL,
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  change_type   VARCHAR(20) NOT NULL,
  -- create | update | publish | archive | restore | delete

  previous_data JSONB,
  -- Snapshot complet de la ligne events avant modification

  change_note   TEXT
  -- Note facultative du contributeur sur la modification
);

COMMENT ON TABLE  event_revisions              IS 'Historique complet des modifications sur les événements.';
COMMENT ON COLUMN event_revisions.previous_data IS 'Snapshot JSON de la ligne events avant la modification.';
COMMENT ON COLUMN event_revisions.change_type   IS 'create | update | publish | archive | restore | delete';

CREATE INDEX idx_revisions_event ON event_revisions(event_id, changed_at DESC);
CREATE INDEX idx_revisions_user  ON event_revisions(changed_by);


-- ============================================================
--  15. FONCTIONS ET TRIGGERS
-- ============================================================

-- ── Fonction générique : mise à jour de updated_at ──────────

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_stories_updated_at
  BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_modules_updated_at
  BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_media_updated_at
  BEFORE UPDATE ON media
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_story_events_updated_at
  BEFORE UPDATE ON story_events
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_kalendas_updated_at
  BEFORE UPDATE ON kalendas
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_people_updated_at
  BEFORE UPDATE ON people
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ── Fonction : published_at automatique au moment de la publication ──

CREATE OR REPLACE FUNCTION fn_set_published_at()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_events_published_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION fn_set_published_at();

CREATE TRIGGER trg_stories_published_at
  BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION fn_set_published_at();

CREATE TRIGGER trg_modules_published_at
  BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION fn_set_published_at();

CREATE TRIGGER trg_kalendas_published_at
  BEFORE UPDATE ON kalendas
  FOR EACH ROW EXECUTE FUNCTION fn_set_published_at();


-- ── Fonction : search_vector events ─────────────────────────

CREATE OR REPLACE FUNCTION fn_update_event_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', unaccent(coalesce(NEW.title,   ''))), 'A') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.summary, ''))), 'B') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.content, ''))), 'C');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_events_search_vector
  BEFORE INSERT OR UPDATE OF title, summary, content
  ON events
  FOR EACH ROW EXECUTE FUNCTION fn_update_event_search_vector();


-- ── Fonction : search_vector stories ────────────────────────

CREATE OR REPLACE FUNCTION fn_update_story_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', unaccent(coalesce(NEW.title,   ''))), 'A') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.summary, ''))), 'B');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_stories_search_vector
  BEFORE INSERT OR UPDATE OF title, summary
  ON stories
  FOR EACH ROW EXECUTE FUNCTION fn_update_story_search_vector();


-- ── Fonction : search_vector modules ────────────────────────

CREATE OR REPLACE FUNCTION fn_update_module_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', unaccent(coalesce(NEW.title,   ''))), 'A') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.summary, ''))), 'B');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_modules_search_vector
  BEFORE INSERT OR UPDATE OF title, summary
  ON modules
  FOR EACH ROW EXECUTE FUNCTION fn_update_module_search_vector();


-- ── Fonction : search_vector people ─────────────────────────

CREATE OR REPLACE FUNCTION fn_update_people_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', unaccent(coalesce(NEW.name, ''))), 'A') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.bio,  ''))), 'B');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_people_search_vector
  BEFORE INSERT OR UPDATE OF name, bio
  ON people
  FOR EACH ROW EXECUTE FUNCTION fn_update_people_search_vector();


-- ── Fonction : calcul automatique computed_start/end_date sur stories ──

CREATE OR REPLACE FUNCTION fn_refresh_story_dates()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
  v_story_id UUID;
BEGIN
  v_story_id := COALESCE(NEW.story_id, OLD.story_id);

  UPDATE stories SET
    computed_start_date = (
      SELECT MIN(e.start_date)
      FROM story_events se
      JOIN events e ON e.id = se.event_id
      WHERE se.story_id = v_story_id
        AND e.start_date IS NOT NULL
        AND e.deleted_at IS NULL
    ),
    computed_end_date = (
      SELECT MAX(COALESCE(e.end_date, e.start_date))
      FROM story_events se
      JOIN events e ON e.id = se.event_id
      WHERE se.story_id = v_story_id
        AND e.start_date IS NOT NULL
        AND e.deleted_at IS NULL
    )
  WHERE id = v_story_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_story_events_refresh_dates
  AFTER INSERT OR UPDATE OR DELETE ON story_events
  FOR EACH ROW EXECUTE FUNCTION fn_refresh_story_dates();


-- ── Fonction : audit trail automatique sur events ───────────

CREATE OR REPLACE FUNCTION fn_record_event_revision()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO event_revisions (event_id, changed_by, change_type, previous_data)
    VALUES (
      OLD.id,
      NEW.updated_by,
      CASE
        WHEN NEW.status = 'published' AND OLD.status != 'published' THEN 'publish'
        WHEN NEW.status = 'archived'  AND OLD.status != 'archived'  THEN 'archive'
        WHEN NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL   THEN 'delete'
        WHEN NEW.deleted_at IS NULL     AND OLD.deleted_at IS NOT NULL THEN 'restore'
        ELSE 'update'
      END,
      to_jsonb(OLD)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_events_audit
  AFTER UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION fn_record_event_revision();


-- ============================================================
--  16. VUES UTILITAIRES
-- ============================================================

-- Vue : événements publiés avec leur lieu et pays primaires
CREATE VIEW v_events_published AS
SELECT
  e.id,
  e.slug,
  e.lang,
  e.title,
  e.summary,
  e.temporal_type,
  e.start_date,
  e.end_date,
  e.display_date,
  e.approx_century,
  e.approx_decade,
  e.annual_recurrence,
  e.primary_country_code,
  p.name AS primary_place_name,
  e.featured,
  e.featured_position,
  e.reliability,
  e.published_at,
  e.created_at
FROM events e
LEFT JOIN places p ON p.id = e.primary_place_id
WHERE e.status = 'published'
  AND e.deleted_at IS NULL;

COMMENT ON VIEW v_events_published IS 'Événements publiés et non supprimés — vue lecture principale pour l'API publique.';


-- Vue : tableau de bord des traductions manquantes
CREATE VIEW v_translation_gaps AS
SELECT
  'event'       AS entity_type,
  e.id          AS entity_id,
  e.title       AS entity_title,
  l.lang,
  f.field,
  EXISTS (
    SELECT 1 FROM translations t
    WHERE t.entity_type = 'event'
      AND t.entity_id = e.id
      AND t.lang = l.lang
      AND t.field = f.field
  ) AS is_translated
FROM events e
CROSS JOIN (VALUES ('en'),('sw'),('ar'),('pt')) AS l(lang)
CROSS JOIN (VALUES ('title'),('summary')) AS f(field)
WHERE e.status = 'published'
  AND e.deleted_at IS NULL;

COMMENT ON VIEW v_translation_gaps IS 'Identifie les champs manquants pour chaque langue cible sur les événements publiés.';


-- Vue : événements du calendrier annuel (anniversaires du jour)
CREATE VIEW v_annual_calendar AS
SELECT
  e.id,
  e.slug,
  e.title,
  e.start_date,
  e.primary_country_code,
  EXTRACT(YEAR FROM e.start_date)::INT AS original_year,
  DATE_PART('month', e.start_date)::INT AS month,
  DATE_PART('day',   e.start_date)::INT AS day
FROM events e
WHERE e.annual_recurrence = TRUE
  AND e.start_date IS NOT NULL
  AND e.status = 'published'
  AND e.deleted_at IS NULL;

COMMENT ON VIEW v_annual_calendar IS 'Tous les événements récurrents annuels. Utiliser WHERE month=X AND day=Y pour "aujourd'hui dans l'histoire".';


-- ============================================================
--  17. REQUÊTES DE RÉFÉRENCE (commentées)
-- ============================================================

-- ── Récupérer un événement complet avec fallback de traduction ──
--
-- SELECT
--   e.id, e.slug,
--   COALESCE(t_title.value,   e.title)   AS title,
--   COALESCE(t_summary.value, e.summary) AS summary
-- FROM events e
-- LEFT JOIN translations t_title   ON t_title.entity_type  = 'event'
--                                  AND t_title.entity_id   = e.id
--                                  AND t_title.lang        = 'en'
--                                  AND t_title.field       = 'title'
-- LEFT JOIN translations t_summary ON t_summary.entity_type = 'event'
--                                  AND t_summary.entity_id  = e.id
--                                  AND t_summary.lang       = 'en'
--                                  AND t_summary.field      = 'summary'
-- WHERE e.slug = 'independance-congo'
--   AND e.status = 'published';

-- ── Recherche full-text avec ranking ────────────────────────────
--
-- SELECT e.id, e.slug, e.title,
--   ts_rank(e.search_vector, query) AS rank
-- FROM events e,
--   to_tsquery('french', unaccent('indépendance & congo')) AS query
-- WHERE e.search_vector @@ query
--   AND e.status = 'published'
--   AND e.deleted_at IS NULL
-- ORDER BY rank DESC
-- LIMIT 20;

-- ── Événements d'aujourd'hui dans l'histoire ────────────────────
--
-- SELECT * FROM v_annual_calendar
-- WHERE month = EXTRACT(MONTH FROM CURRENT_DATE)
--   AND day   = EXTRACT(DAY   FROM CURRENT_DATE)
-- ORDER BY original_year;

-- ── Récits avec leurs bornes temporelles ────────────────────────
--
-- SELECT s.id, s.title, s.computed_start_date, s.computed_end_date,
--   COUNT(se.event_id) AS event_count
-- FROM stories s
-- JOIN story_events se ON se.story_id = s.id
-- WHERE s.status = 'published'
-- GROUP BY s.id
-- ORDER BY s.computed_start_date;

-- ── Tableau de bord traductions manquantes en swahili ───────────
--
-- SELECT entity_title, field
-- FROM v_translation_gaps
-- WHERE lang = 'sw' AND is_translated = FALSE
-- ORDER BY entity_title, field;

-- ── Ressources dont les droits expirent dans 3 mois ────────────
--
-- SELECT id, title, type, license, rights_expiry, credit
-- FROM media
-- WHERE rights_expiry BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 months'
-- ORDER BY rights_expiry;

-- ── Photos d'un photographe donné ──────────────────────────────
--
-- SELECT id, title, creation_year, source
-- FROM media
-- WHERE type = 'image'
--   AND creators @> '[{"name":"Malick Sidibé"}]'
-- ORDER BY creation_year;


-- ============================================================
--  FIN DU SCHÉMA
-- ============================================================
