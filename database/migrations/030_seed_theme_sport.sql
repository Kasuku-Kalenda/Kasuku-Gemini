-- ============================================================================
-- 030_seed_theme_sport.sql — Thème « Sport »
-- Requis pour l'édition JOJ Dakar 2026 (patrimoine sportif sénégalais) et la
-- curation sport en général. Idempotent.
-- ============================================================================

INSERT INTO themes (slug, name, color, position)
VALUES ('sport', 'Sport', '#27AE60', 8)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  color = EXCLUDED.color;
