-- ============================================================
--  Migration 022 — Heritage Items (Patrimoine culturel)
-- ============================================================

-- ── Table principale ─────────────────────────────────────────

CREATE TABLE heritage_items (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         VARCHAR(255) UNIQUE NOT NULL,
  lang         VARCHAR(5)   NOT NULL DEFAULT 'fr',
  title        VARCHAR(255) NOT NULL,
  category     VARCHAR(20)  NOT NULL DEFAULT 'other',
  summary      TEXT,
  period       VARCHAR(255),          -- libellé libre : "XVe siècle", "Époque précoloniale"
  country_code VARCHAR(2),            -- ISO 3166-1 alpha-2, optionnel
  cover_url    TEXT,
  status       content_status NOT NULL DEFAULT 'draft',
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at   TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  search_vector TSVECTOR,

  CONSTRAINT chk_heritage_category
    CHECK (category IN ('mask','proverb','symbol','recipe','craft','music','other'))
);

CREATE INDEX idx_heritage_items_status   ON heritage_items(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_heritage_items_category ON heritage_items(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_heritage_items_country  ON heritage_items(country_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_heritage_items_search   ON heritage_items USING GIN(search_vector);
CREATE INDEX idx_heritage_items_slug     ON heritage_items(slug);

-- ── Ressources complémentaires ───────────────────────────────

CREATE TABLE heritage_resources (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  heritage_item_id UUID NOT NULL REFERENCES heritage_items(id) ON DELETE CASCADE,
  type             VARCHAR(20) NOT NULL,   -- 'audio' | 'image' | 'video' | 'pdf' | 'link'
  url              TEXT NOT NULL,
  title            TEXT,
  credit           TEXT,
  position         SMALLINT NOT NULL DEFAULT 0,
  CONSTRAINT chk_heritage_resource_type
    CHECK (type IN ('audio','image','video','pdf','link'))
);

CREATE INDEX idx_heritage_resources_item ON heritage_resources(heritage_item_id);

-- ── Pivot thèmes ─────────────────────────────────────────────

CREATE TABLE heritage_themes (
  heritage_item_id UUID NOT NULL REFERENCES heritage_items(id) ON DELETE CASCADE,
  theme_id         UUID NOT NULL REFERENCES themes(id)         ON DELETE CASCADE,
  PRIMARY KEY (heritage_item_id, theme_id)
);

-- ── Pivot personnages ────────────────────────────────────────

CREATE TABLE heritage_people (
  heritage_item_id UUID NOT NULL REFERENCES heritage_items(id) ON DELETE CASCADE,
  person_id        UUID NOT NULL REFERENCES people(id)         ON DELETE CASCADE,
  PRIMARY KEY (heritage_item_id, person_id)
);

-- ── Pivots optionnels vers événements / récits / modules ─────

CREATE TABLE event_heritage_items (
  event_id         UUID NOT NULL REFERENCES events(id)          ON DELETE CASCADE,
  heritage_item_id UUID NOT NULL REFERENCES heritage_items(id)  ON DELETE CASCADE,
  PRIMARY KEY (event_id, heritage_item_id)
);

CREATE TABLE story_heritage_items (
  story_id         UUID NOT NULL REFERENCES stories(id)         ON DELETE CASCADE,
  heritage_item_id UUID NOT NULL REFERENCES heritage_items(id)  ON DELETE CASCADE,
  PRIMARY KEY (story_id, heritage_item_id)
);

CREATE TABLE module_heritage_items (
  module_id        UUID NOT NULL REFERENCES modules(id)         ON DELETE CASCADE,
  heritage_item_id UUID NOT NULL REFERENCES heritage_items(id)  ON DELETE CASCADE,
  PRIMARY KEY (module_id, heritage_item_id)
);

-- ── Trigger updated_at ───────────────────────────────────────

CREATE TRIGGER trg_heritage_items_updated_at
  BEFORE UPDATE ON heritage_items
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── Trigger published_at ─────────────────────────────────────

CREATE TRIGGER trg_heritage_items_published_at
  BEFORE UPDATE ON heritage_items
  FOR EACH ROW EXECUTE FUNCTION fn_set_published_at();

-- ── Trigger search_vector ────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_update_heritage_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', unaccent(coalesce(NEW.title,   ''))), 'A') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.summary, ''))), 'B') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.period,  ''))), 'C');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_heritage_items_search_vector
  BEFORE INSERT OR UPDATE ON heritage_items
  FOR EACH ROW EXECUTE FUNCTION fn_update_heritage_search_vector();

COMMENT ON TABLE heritage_items     IS 'Objets du patrimoine culturel africain : masques, proverbes, symboles, recettes, artisanat, musique...';
COMMENT ON TABLE heritage_resources IS 'Ressources complémentaires d''un item (audio, image, vidéo, pdf, lien).';
