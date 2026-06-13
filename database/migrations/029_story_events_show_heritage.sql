-- ============================================================================
-- 029_story_events_show_heritage.sql
-- Opt-in par moment : afficher (ou non) le patrimoine de l'événement sur la diapo
-- du moment dans le carousel récit. Décoché par défaut → patrimoine masqué tant que
-- l'éditeur ne l'active pas (cf. issue #78). Gating appliqué côté API (GET /timelines/slug).
-- Idempotent.
-- ============================================================================

ALTER TABLE story_events
  ADD COLUMN IF NOT EXISTS show_heritage BOOLEAN NOT NULL DEFAULT false;
