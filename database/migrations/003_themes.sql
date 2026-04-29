-- ============================================================
--  Migration 003 — Thèmes (hiérarchiques)
--  Remplace à la fois categories et themes de l'ancien schéma.
--  Un thème sans parent est une catégorie racine.
-- ============================================================

CREATE TABLE themes (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(255) UNIQUE NOT NULL,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id   UUID         REFERENCES themes(id) ON DELETE SET NULL,
  color       VARCHAR(7),            -- code hex CSS : #E63946
  icon        VARCHAR(100),          -- nom d'icône ou URL SVG
  position    SMALLINT     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE  themes           IS 'Classification hiérarchique. Thème sans parent = catégorie racine (ex: Histoire, Culture, Science).';
COMMENT ON COLUMN themes.parent_id IS 'NULL = thème racine. Sinon = sous-thème.';
COMMENT ON COLUMN themes.color     IS 'Code couleur hex pour l''affichage UI. Ex: #E63946';
COMMENT ON COLUMN themes.icon      IS 'Identifiant d''icône ou URL SVG associée au thème.';
COMMENT ON COLUMN themes.position  IS 'Ordre d''affichage entre thèmes du même niveau hiérarchique.';

CREATE INDEX idx_themes_parent ON themes(parent_id);
CREATE INDEX idx_themes_slug   ON themes(slug);
