-- ============================================================
--  Migration 006 — Médias & Ressources
--  Inclut les métadonnées bibliographiques complètes.
-- ============================================================

CREATE TABLE media (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type             media_type  NOT NULL,
  url              TEXT        NOT NULL,

  -- Identification
  title            TEXT        NOT NULL,
  description      TEXT,
  lang             VARCHAR(5),

  -- Métadonnées bibliographiques
  -- Tableau de créateurs avec rôle libre
  -- Ex: [{"name":"Malick Sidibé","role":"photographer"},{"name":"INA","role":"editor"}]
  -- Rôles courants : photographer, director, author, illustrator,
  --                  composer, editor, translator, archivist, producer
  creators         JSONB       NOT NULL DEFAULT '[]',

  creation_year    SMALLINT,            -- année de création de l'œuvre originale
  publication_date DATE,                -- date de publication (peut différer de creation_year)
  source           TEXT,                -- origine du fichier : "Archives nationales du Mali", "AFP"
  publisher        TEXT,                -- éditeur : "Présence Africaine", "L'Harmattan", "UNESCO"
  edition          TEXT,                -- "3e éd. revue et augmentée"
  isbn             VARCHAR(20),         -- pour PDF/documents

  -- Droits
  credit           TEXT,                -- mention légale : "© AFP 1960"
  license          VARCHAR(100),        -- "CC-BY-4.0", "public_domain", "all_rights_reserved"
  rights_expiry    DATE,                -- date d'expiration des droits si applicable

  -- Technique
  duration_s       INT,                 -- durée en secondes (audio/vidéo)
  width            INT,                 -- largeur en pixels (image/vidéo)
  height           INT,
  size_bytes       BIGINT,
  mime_type        VARCHAR(100),        -- "application/pdf", "audio/mpeg", "video/mp4"

  -- Accessibilité
  alt_text         TEXT,                -- description image pour lecteurs d'écran
  transcript_url   TEXT,                -- URL transcription (audio/vidéo → searchable)

  -- Upload
  created_by       UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_media_year CHECK (creation_year IS NULL OR creation_year BETWEEN 1 AND 2100)
);

COMMENT ON TABLE  media                IS 'Ressources documentaires : images, vidéos, audios, PDFs.';
COMMENT ON COLUMN media.creators       IS 'Tableau JSON de créateurs avec rôle libre. Non lié à la table users.';
COMMENT ON COLUMN media.creation_year  IS 'Année de création de l''œuvre originale (≠ date d''upload).';
COMMENT ON COLUMN media.source         IS 'Institution ou fonds d''origine : "Archives nationales du Mali", "INA".';
COMMENT ON COLUMN media.publisher      IS 'Éditeur au sens bibliographique : "Présence Africaine", "L''Harmattan".';
COMMENT ON COLUMN media.rights_expiry  IS 'Permet d''alerter sur les droits expirant prochainement.';
COMMENT ON COLUMN media.transcript_url IS 'Transcription textuelle pour accessibilité et indexation full-text.';

CREATE INDEX idx_media_type          ON media(type);
CREATE INDEX idx_media_creation_year ON media(creation_year);
CREATE INDEX idx_media_lang          ON media(lang);
CREATE INDEX idx_media_license       ON media(license);
CREATE INDEX idx_media_creators      ON media USING GIN(creators);
CREATE INDEX idx_media_rights        ON media(rights_expiry) WHERE rights_expiry IS NOT NULL;
