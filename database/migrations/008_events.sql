-- ============================================================
--  Migration 008 — Événements (objet central de Kasuku)
-- ============================================================

CREATE TABLE events (
  id                    UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  VARCHAR(255)     UNIQUE NOT NULL,
  lang                  VARCHAR(5)       NOT NULL DEFAULT 'fr',

  -- Contenu principal
  title                 VARCHAR(255)     NOT NULL,
  summary               TEXT,
  content               TEXT,

  -- Crédits éditoriaux libres (non liés à users)
  -- Ex: [{"name":"Amara Diallo","role":"author"},{"name":"IFAN","role":"source"}]
  -- Rôles courants : author, researcher, translator, photographer, source, institution
  contributors          JSONB            NOT NULL DEFAULT '[]',

  -- ── Temporalité ─────────────────────────────────────────────
  temporal_type         temporal_type    NOT NULL DEFAULT 'exact_date',
  start_date            DATE,            -- date de début ou date unique
  end_date              DATE,            -- date de fin (uniquement pour date_range)
  display_date          VARCHAR(255),    -- libellé affiché : "vers 1450", "XIVe siècle", "ca. 1820"
  approx_century        SMALLINT,        -- 20 = XXe s., -5 = Ve s. av. J.-C.
  approx_decade         SMALLINT,        -- 1960, 1970, 1980... (multiple de 10)
  annual_recurrence     BOOLEAN          NOT NULL DEFAULT FALSE,
  -- FALSE par défaut. Activer pour : anniversaires, fêtes, commémorations.

  -- ── Géographie primaire (pour filtrage rapide sans join) ────
  primary_country_code  VARCHAR(2),      -- ISO 3166-1 alpha-2
  primary_place_id      UUID             REFERENCES places(id) ON DELETE SET NULL,

  -- ── Mise en avant ────────────────────────────────────────────
  featured              BOOLEAN          NOT NULL DEFAULT FALSE,
  featured_position     SMALLINT,        -- 1 = première position en vedette

  -- ── Fiabilité historique ─────────────────────────────────────
  reliability           reliability_type NOT NULL DEFAULT 'confirmed',
  source_label          TEXT,            -- "Encyclopédie Africaine, vol. 3, p. 142"
  source_url            TEXT,            -- URL de la source primaire

  -- ── Workflow éditorial ───────────────────────────────────────
  status                content_status   NOT NULL DEFAULT 'draft',
  published_at          TIMESTAMPTZ,
  created_by            UUID             REFERENCES users(id) ON DELETE SET NULL,
  updated_by            UUID             REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ      NOT NULL DEFAULT now(),
  deleted_at            TIMESTAMPTZ,     -- soft delete : jamais supprimé physiquement

  -- ── Full-text search ─────────────────────────────────────────
  search_vector         TSVECTOR,

  -- ── Contraintes métier ───────────────────────────────────────
  CONSTRAINT chk_events_date_range     CHECK (end_date IS NULL OR end_date >= start_date),
  CONSTRAINT chk_events_featured_pos   CHECK (featured_position IS NULL OR featured = TRUE),
  CONSTRAINT chk_events_approx_century CHECK (approx_century IS NULL OR approx_century BETWEEN -50 AND 21),
  CONSTRAINT chk_events_approx_decade  CHECK (approx_decade  IS NULL OR approx_decade % 10 = 0),
  CONSTRAINT chk_events_temporal_dates CHECK (
    (temporal_type = 'exact_date'  AND start_date IS NOT NULL) OR
    (temporal_type = 'date_range'  AND start_date IS NOT NULL AND end_date IS NOT NULL) OR
    (temporal_type = 'approximate' AND (approx_century IS NOT NULL OR approx_decade IS NOT NULL)) OR
    (temporal_type = 'unknown')
  )
);

COMMENT ON TABLE  events                     IS 'Objet central de Kasuku. Tout part d''un événement.';
COMMENT ON COLUMN events.lang                IS 'Langue de rédaction principale du contenu (fr, en, ar, sw...).';
COMMENT ON COLUMN events.contributors        IS 'Crédits libres : auteurs, chercheurs, institutions sources. Non lié à users.';
COMMENT ON COLUMN events.display_date        IS 'Libellé textuel libre affiché en UI, indépendant des dates machine.';
COMMENT ON COLUMN events.approx_century      IS 'Utilisé quand temporal_type = approximate. 20 = XXe siècle.';
COMMENT ON COLUMN events.approx_decade       IS 'Granularité décennie, toujours multiple de 10 (1960, 1970...).';
COMMENT ON COLUMN events.annual_recurrence   IS 'TRUE = réapparaît chaque année à la date anniversaire (calendrier "aujourd''hui dans l''histoire").';
COMMENT ON COLUMN events.primary_country_code IS 'Code pays ISO pour filtrage rapide sans join sur places.';
COMMENT ON COLUMN events.featured_position   IS 'Ordre en page d''accueil. NULL si non mis en avant.';
COMMENT ON COLUMN events.reliability         IS 'Niveau de certitude historique : confirmed, probable, contested, unknown.';
COMMENT ON COLUMN events.source_label        IS 'Référence bibliographique de la source principale.';
COMMENT ON COLUMN events.deleted_at          IS 'Soft delete. Un événement effacé n''est jamais détruit en base.';
COMMENT ON COLUMN events.search_vector       IS 'Vecteur full-text pondéré (A=title, B=summary, C=content). Mis à jour par trigger.';

-- Index de recherche et filtrage
CREATE INDEX idx_events_slug           ON events(slug);
CREATE INDEX idx_events_start_date     ON events(start_date)           WHERE deleted_at IS NULL;
CREATE INDEX idx_events_status         ON events(status)               WHERE deleted_at IS NULL;
CREATE INDEX idx_events_country        ON events(primary_country_code)  WHERE deleted_at IS NULL;
CREATE INDEX idx_events_place          ON events(primary_place_id)      WHERE primary_place_id IS NOT NULL;
CREATE INDEX idx_events_century        ON events(approx_century)        WHERE temporal_type = 'approximate';
CREATE INDEX idx_events_decade         ON events(approx_decade)         WHERE temporal_type = 'approximate';
CREATE INDEX idx_events_featured       ON events(featured_position)     WHERE featured = TRUE;
CREATE INDEX idx_events_annual         ON events(start_date)            WHERE annual_recurrence = TRUE;
CREATE INDEX idx_events_lang           ON events(lang);
CREATE INDEX idx_events_reliability    ON events(reliability);
CREATE INDEX idx_events_deleted        ON events(deleted_at)            WHERE deleted_at IS NULL;

-- Index full-text et trigramme
CREATE INDEX idx_events_search         ON events USING GIN(search_vector);
CREATE INDEX idx_events_title_trgm     ON events USING GIN(title gin_trgm_ops);
CREATE INDEX idx_events_contributors   ON events USING GIN(contributors);
