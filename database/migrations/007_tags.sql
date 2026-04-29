-- ============================================================
--  Migration 007 — Tags (mots-clés légers)
-- ============================================================

CREATE TABLE tags (
  id   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL
);

COMMENT ON TABLE tags IS 'Mots-clés libres et légers. Pas hiérarchiques. Complémentaires aux thèmes.';

-- Pivot polymorphique : un tag peut s'attacher à n'importe quelle entité
-- entity_type : 'event', 'story', 'module', 'media'
CREATE TABLE taggables (
  tag_id      UUID        NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  entity_type VARCHAR(20) NOT NULL,
  entity_id   UUID        NOT NULL,
  PRIMARY KEY (tag_id, entity_type, entity_id)
);

COMMENT ON TABLE  taggables             IS 'Association polymorphique tags ↔ entités.';
COMMENT ON COLUMN taggables.entity_type IS 'Nom logique de l''entité : event, story, module, media.';
COMMENT ON COLUMN taggables.entity_id   IS 'UUID de l''entité cible (pas de FK formelle car polymorphique).';

CREATE INDEX idx_taggables_entity ON taggables(entity_type, entity_id);
CREATE INDEX idx_taggables_tag    ON taggables(tag_id);
