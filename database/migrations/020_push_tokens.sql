-- Migration 020 : tokens de notifications push (FCM)
-- Un device peut enregistrer son token sans être connecté.
-- Si l'utilisateur est connecté, on lie le token à son compte.

CREATE TABLE IF NOT EXISTS push_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT        NOT NULL UNIQUE,
  platform    TEXT        NOT NULL DEFAULT 'android',   -- 'android' | 'ios'
  user_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
  device_id   TEXT,                                     -- identifiant optionnel du device
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token   ON push_tokens(token);
