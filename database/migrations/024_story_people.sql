-- ============================================================
--  Migration 024 — Liaison récit ↔ personnage
-- ============================================================

-- Un récit peut être centré sur un ou plusieurs personnages.
-- La liaison est simple (pas de rôle) : le personnage est le "sujet" du récit.

CREATE TABLE story_people (
  story_id  UUID NOT NULL REFERENCES stories(id)  ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id)   ON DELETE CASCADE,
  PRIMARY KEY (story_id, person_id)
);

CREATE INDEX idx_story_people_person ON story_people(person_id);

COMMENT ON TABLE story_people IS 'Personnages liés à un récit (sujet principal ou secondaire).';
