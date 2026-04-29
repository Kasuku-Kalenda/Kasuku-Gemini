-- ============================================================
--  Migration 004 — Lieux (hiérarchiques)
--  Hiérarchie : continent → pays → région → ville → site
-- ============================================================

CREATE TABLE places (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(255) NOT NULL,
  place_type    place_type   NOT NULL DEFAULT 'city',
  country_code  VARCHAR(2),            -- ISO 3166-1 alpha-2 (SN, CD, ML, KE...)
  parent_id     UUID         REFERENCES places(id) ON DELETE SET NULL,
  lat           NUMERIC(9,6),          -- latitude WGS84
  lng           NUMERIC(9,6),          -- longitude WGS84
  wikipedia_url TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE  places              IS 'Géographie hiérarchique. Ex : Afrique → Congo → Kinshasa → Cité de l''OUA.';
COMMENT ON COLUMN places.country_code IS 'ISO 3166-1 alpha-2. NULL pour continents et lieux virtuels.';
COMMENT ON COLUMN places.parent_id    IS 'Hiérarchie : ville → région → pays → continent.';
COMMENT ON COLUMN places.lat          IS 'Latitude WGS84. NULL si localisation inconnue ou virtuelle.';
COMMENT ON COLUMN places.lng          IS 'Longitude WGS84. NULL si localisation inconnue ou virtuelle.';

CREATE INDEX idx_places_parent  ON places(parent_id);
CREATE INDEX idx_places_country ON places(country_code);
CREATE INDEX idx_places_type    ON places(place_type);
CREATE INDEX idx_places_geo     ON places(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;
CREATE INDEX idx_places_slug    ON places(slug);
