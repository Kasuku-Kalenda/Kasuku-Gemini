-- ============================================================
--  Migration 013 — Traductions (multilingue — Option B)
--  Une ligne par champ traduit, par entité, par langue.
--  Fallback vers la langue source si traduction absente.
-- ============================================================

CREATE TABLE translations (
  entity_type   VARCHAR(20)  NOT NULL,
  -- Entités traduisibles :
  --   'event'   → champs : title, summary, content, display_date, source_label
  --   'story'   → champs : title, summary
  --   'module'  → champs : title, summary
  --   'theme'   → champs : name, description
  --   'place'   → champs : name
  --   'person'  → champs : bio
  --   'media'   → champs : title, description, alt_text
  --   'kalenda' → champs : name, description

  entity_id     UUID         NOT NULL,

  lang          VARCHAR(5)   NOT NULL,
  -- Codes BCP 47 : fr, en, sw, ar, pt, ha, yo, am, ln, so, rw, mg, ig...

  field         VARCHAR(50)  NOT NULL,
  -- Nom exact du champ dans la table source

  value         TEXT         NOT NULL,

  status        VARCHAR(20)  NOT NULL DEFAULT 'draft',
  -- draft     = brouillon de traduction
  -- reviewed  = relu et validé par un relecteur
  -- published = mis en ligne

  translated_by UUID         REFERENCES users(id) ON DELETE SET NULL,
  translated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),

  PRIMARY KEY (entity_type, entity_id, lang, field)
);

COMMENT ON TABLE  translations             IS 'Traductions multilingues Option B. Fallback automatique vers langue source si traduction absente.';
COMMENT ON COLUMN translations.entity_type IS 'Nom logique de l''entité : event, story, module, theme, place, person, media, kalenda.';
COMMENT ON COLUMN translations.lang        IS 'Code langue BCP 47 : en, sw, ar, pt, ha, yo, am, ln, so, rw, mg...';
COMMENT ON COLUMN translations.field       IS 'Nom du champ traduit (title, summary, content, bio, alt_text...).';
COMMENT ON COLUMN translations.status      IS 'draft | reviewed | published.';
COMMENT ON COLUMN translations.value       IS 'Valeur traduite du champ. Pour content (JSON), valeur stringifiée.';

CREATE INDEX idx_translations_entity ON translations(entity_type, entity_id);
CREATE INDEX idx_translations_lang   ON translations(lang);
CREATE INDEX idx_translations_status ON translations(entity_type, lang, status);
