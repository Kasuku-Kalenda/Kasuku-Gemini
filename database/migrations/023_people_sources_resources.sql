-- ============================================================
--  Migration 023 — Personnages : sources & ressources annexes
-- ============================================================

-- sources : liens vers des références externes (ex: Wikipedia, Larousse, BBC…)
-- Format : [{ "label": "Wikipedia", "url": "https://…" }]
ALTER TABLE people
  ADD COLUMN IF NOT EXISTS sources JSONB NOT NULL DEFAULT '[]'::jsonb;

-- resources : fichiers annexes (audio, vidéo, PDF…)
-- Format : [{ "type": "audio|video|pdf|other", "title": "…", "url": "https://…" }]
ALTER TABLE people
  ADD COLUMN IF NOT EXISTS resources JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN people.sources   IS 'Sources & références : [{label, url}]';
COMMENT ON COLUMN people.resources IS 'Ressources complémentaires : [{type, title, url}]';
