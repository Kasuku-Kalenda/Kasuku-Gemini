-- ──────────────────────────────────────────────────────────────────────────────
-- 018 — Table featured_items (remplace le système events.featured)
--
-- "À la une" peut désormais référencer un événement, un récit ou un module.
-- Les champs *_override permettent de personnaliser titre/sous-titre/image
-- sans modifier le contenu source.
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS featured_items (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source (exactement une FK doit être renseignée — contrainte ci-dessous)
  source_type         VARCHAR(10)  NOT NULL CHECK (source_type IN ('event', 'story', 'module')),
  event_id            UUID         REFERENCES events(id)   ON DELETE CASCADE,
  story_id            UUID         REFERENCES stories(id)  ON DELETE CASCADE,
  module_id           UUID         REFERENCES modules(id)  ON DELETE CASCADE,

  -- Surcharge éditoriale (NULL = valeur héritée de la source)
  title_override      TEXT,
  subtitle_override   TEXT,
  image_url_override  TEXT,

  -- Bouton CTA
  cta_label           TEXT         NOT NULL DEFAULT 'Découvrir',
  cta_to              TEXT         NOT NULL,   -- ex: /timelines/slug, /modules/slug

  -- Planification
  start_date          DATE         NOT NULL DEFAULT CURRENT_DATE,
  end_date            DATE         NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  display_order       SMALLINT     NOT NULL DEFAULT 0,
  active              BOOLEAN      NOT NULL DEFAULT true,

  -- Audit
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  created_by          UUID         REFERENCES users(id) ON DELETE SET NULL,
  updated_by          UUID         REFERENCES users(id) ON DELETE SET NULL,

  -- Exactement une source
  CONSTRAINT chk_featured_single_source CHECK (
    (CASE WHEN event_id  IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN story_id  IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN module_id IS NOT NULL THEN 1 ELSE 0 END) = 1
  ),
  -- Cohérence source_type / FK
  CONSTRAINT chk_featured_type_fk CHECK (
    (source_type = 'event'  AND event_id  IS NOT NULL) OR
    (source_type = 'story'  AND story_id  IS NOT NULL) OR
    (source_type = 'module' AND module_id IS NOT NULL)
  )
);

-- Index
CREATE INDEX IF NOT EXISTS idx_featured_active      ON featured_items(active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_featured_order       ON featured_items(display_order);
CREATE INDEX IF NOT EXISTS idx_featured_event_id    ON featured_items(event_id)  WHERE event_id  IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_featured_story_id    ON featured_items(story_id)  WHERE story_id  IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_featured_module_id   ON featured_items(module_id) WHERE module_id IS NOT NULL;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_featured_items_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_featured_items_updated_at ON featured_items;
CREATE TRIGGER trg_featured_items_updated_at
  BEFORE UPDATE ON featured_items
  FOR EACH ROW EXECUTE FUNCTION update_featured_items_updated_at();

-- Migration des anciennes mises en avant (events.featured = true)
INSERT INTO featured_items (source_type, event_id, cta_label, cta_to, display_order, active, start_date, end_date)
SELECT
  'event',
  e.id,
  'Découvrir',
  '/events/' || e.slug,
  COALESCE(e.featured_position, 0),
  true,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '365 days'
FROM events e
WHERE e.featured = true AND e.deleted_at IS NULL
ON CONFLICT DO NOTHING;
