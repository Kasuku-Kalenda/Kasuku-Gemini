-- ============================================================
--  Migration 005 — Personnes
-- ============================================================

CREATE TABLE people (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           VARCHAR(255) UNIQUE NOT NULL,
  name           VARCHAR(255) NOT NULL,
  birth_date     DATE,
  death_date     DATE,
  birth_place_id UUID         REFERENCES places(id) ON DELETE SET NULL,
  nationality    VARCHAR(2),            -- ISO 3166-1 alpha-2 (pays principal)
  bio            TEXT,
  photo_url      TEXT,
  wikipedia_url  TEXT,
  search_vector  TSVECTOR,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT chk_people_dates CHECK (
    death_date IS NULL OR birth_date IS NULL OR death_date >= birth_date
  )
);

COMMENT ON TABLE  people               IS 'Personnalités historiques, politiques, culturelles, scientifiques.';
COMMENT ON COLUMN people.nationality   IS 'Nationalité principale ISO 3166-1. Non restrictif : une personne peut être liée à plusieurs pays via event_people.';
COMMENT ON COLUMN people.birth_place_id IS 'Lieu de naissance lié à la table places.';
COMMENT ON COLUMN people.search_vector IS 'Vecteur full-text mis à jour par trigger.';

CREATE INDEX idx_people_nationality ON people(nationality);
CREATE INDEX idx_people_search      ON people USING GIN(search_vector);
CREATE INDEX idx_people_slug        ON people(slug);
