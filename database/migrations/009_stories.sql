-- ============================================================
--  Migration 009 — Récits / Stories (couche narrative)
-- ============================================================

CREATE TABLE stories (
  id                  UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                VARCHAR(255)   UNIQUE NOT NULL,
  lang                VARCHAR(5)     NOT NULL DEFAULT 'fr',

  title               VARCHAR(255)   NOT NULL,
  summary             TEXT,
  cover_url           TEXT,

  -- Crédits éditoriaux libres (non liés à users)
  -- Ex: [{"name":"Fatou Ndiaye","role":"author"},{"name":"Université de Dakar","role":"institution"}]
  contributors        JSONB          NOT NULL DEFAULT '[]',

  -- Dates calculées automatiquement par trigger sur story_events
  -- MIN et MAX des start_date des événements liés
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

COMMENT ON TABLE  stories                    IS 'Récit = suite ordonnée d''événements avec enrichissement narratif contextuel par angle.';
COMMENT ON COLUMN stories.computed_start_date IS 'MIN(start_date) des événements du récit. Calculé automatiquement par trigger.';
COMMENT ON COLUMN stories.computed_end_date   IS 'MAX(start_date ou end_date) des événements du récit. Calculé automatiquement par trigger.';
COMMENT ON COLUMN stories.cover_url           IS 'URL directe de l''image de couverture (stockée dans MinIO).';
COMMENT ON COLUMN stories.contributors        IS 'Crédits libres : auteurs, narrateurs, rédacteurs. Non lié à users.';

CREATE INDEX idx_stories_status     ON stories(status)                                WHERE deleted_at IS NULL;
CREATE INDEX idx_stories_dates      ON stories(computed_start_date, computed_end_date);
CREATE INDEX idx_stories_lang       ON stories(lang);
CREATE INDEX idx_stories_slug       ON stories(slug);
CREATE INDEX idx_stories_search     ON stories USING GIN(search_vector);
CREATE INDEX idx_stories_title_trgm ON stories USING GIN(title gin_trgm_ops);
