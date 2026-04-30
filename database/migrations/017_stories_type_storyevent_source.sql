-- ============================================================
--  Migration 017 — Stories type + StoryEvent source tracking
-- ============================================================

-- 1. Colonne type sur stories
--    Permet de distinguer les récits "chronologiques / événementiels"
--    des biographies / récits "personnage".

ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'evenement'
  CONSTRAINT chk_stories_type CHECK (type IN ('evenement', 'personnage', 'thematique'));

COMMENT ON COLUMN stories.type IS
  'Catégorie du récit : evenement (chronologie), personnage (biographie), thematique (essai).';

-- 2. Colonne source_story_event_id sur story_events
--    Traçabilité du clonage : un StoryEvent peut être créé par copie
--    d'un StoryEvent existant, sans en être dépendant.

ALTER TABLE story_events
  ADD COLUMN IF NOT EXISTS source_story_event_id UUID
  REFERENCES story_events(id) ON DELETE SET NULL;

COMMENT ON COLUMN story_events.source_story_event_id IS
  'ID du StoryEvent original dont ce StoryEvent a été cloné (traçabilité, non contraignant).';

-- Index pour retrouver facilement tous les clones d'un StoryEvent source
CREATE INDEX IF NOT EXISTS idx_story_events_source
  ON story_events(source_story_event_id)
  WHERE source_story_event_id IS NOT NULL;
