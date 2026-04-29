-- ============================================================
--  Migration 011 — Kalenda (paquets de contenu offline)
-- ============================================================

CREATE TABLE kalendas (
  id                  UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                VARCHAR(255)   UNIQUE NOT NULL,
  name                VARCHAR(255)   NOT NULL,
  description         TEXT,
  version             VARCHAR(20)    NOT NULL DEFAULT '1.0.0',
  region              VARCHAR(255),            -- "Afrique centrale", "Mali — Bamako"
  cover_url           TEXT,

  -- Déploiement offline
  target_lang         VARCHAR(5),              -- langue principale cible du déploiement
  offline_size_bytes  BIGINT,                  -- taille estimée du paquet généré
  last_exported_at    TIMESTAMPTZ,             -- dernier export physique du paquet

  -- Workflow éditorial
  status              content_status NOT NULL DEFAULT 'draft',
  published_at        TIMESTAMPTZ,
  created_by          UUID           REFERENCES users(id) ON DELETE SET NULL,
  updated_by          UUID           REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ    NOT NULL DEFAULT now()
);

COMMENT ON TABLE  kalendas                IS 'Paquet de contenus sélectionnés pour déploiement local hors-ligne.';
COMMENT ON COLUMN kalendas.version        IS 'Versioning sémantique du paquet (ex: 1.2.0).';
COMMENT ON COLUMN kalendas.region         IS 'Zone géographique cible du déploiement (champ libre).';
COMMENT ON COLUMN kalendas.target_lang    IS 'Langue principale pour ce déploiement.';
COMMENT ON COLUMN kalendas.last_exported_at IS 'Dernière génération physique du fichier de paquet.';

CREATE INDEX idx_kalendas_status ON kalendas(status);
CREATE INDEX idx_kalendas_slug   ON kalendas(slug);
