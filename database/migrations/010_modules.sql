-- ============================================================
--  Migration 010 — Modules pédagogiques (cours)
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

  -- Contenu structuré en blocs JSON
  -- Types de blocs supportés :
  --   {"type":"text",     "body":"..."}
  --   {"type":"video",    "url":"...","title":"..."}
  --   {"type":"image",    "url":"...","alt":"...","credit":"..."}
  --   {"type":"audio",    "url":"...","title":"...","duration_s":120}
  --   {"type":"quiz",     "question":"...","options":["A","B","C"],"answer":0}
  --   {"type":"resource", "media_id":"<uuid>","label":"..."}
  content          JSONB          NOT NULL DEFAULT '[]',

  -- Crédits éditoriaux libres (non liés à users)
  -- Ex: [{"name":"Dr. Koné","role":"author"},{"name":"UNICEF","role":"institution"}]
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
  search_vector    TSVECTOR,

  CONSTRAINT chk_modules_level CHECK (
    level IS NULL OR level IN ('beginner', 'intermediate', 'advanced')
  ),
  CONSTRAINT chk_modules_duration CHECK (
    duration_minutes IS NULL OR duration_minutes > 0
  )
);

COMMENT ON TABLE  modules          IS 'Module pédagogique = cours rattaché à un ou plusieurs événements.';
COMMENT ON COLUMN modules.level    IS 'beginner | intermediate | advanced.';
COMMENT ON COLUMN modules.content  IS 'Blocs structurés : text, video, image, audio, quiz, resource.';
COMMENT ON COLUMN modules.contributors IS 'Crédits libres : auteurs, experts, institutions. Non lié à users.';

CREATE INDEX idx_modules_status     ON modules(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_modules_lang       ON modules(lang);
CREATE INDEX idx_modules_level      ON modules(level);
CREATE INDEX idx_modules_slug       ON modules(slug);
CREATE INDEX idx_modules_search     ON modules USING GIN(search_vector);
CREATE INDEX idx_modules_title_trgm ON modules USING GIN(title gin_trgm_ops);
