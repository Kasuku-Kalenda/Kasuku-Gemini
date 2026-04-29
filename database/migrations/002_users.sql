-- ============================================================
--  Migration 002 — Utilisateurs (workflow éditorial)
-- ============================================================

CREATE TABLE users (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(255) NOT NULL,
  role          user_role    NOT NULL DEFAULT 'contributor',
  avatar_url    TEXT,
  password_hash TEXT,                  -- NULL pour comptes OAuth
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ
);

COMMENT ON TABLE  users           IS 'Comptes éditoriaux internes. Ne pas confondre avec les contributeurs de contenu (JSONB libre).';
COMMENT ON COLUMN users.role      IS 'admin > editor > contributor > viewer';
COMMENT ON COLUMN users.is_active IS 'FALSE = compte désactivé sans suppression physique.';
