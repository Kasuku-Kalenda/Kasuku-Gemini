-- ============================================================
--  Migration 012 — Tables pivot (relations N-N)
-- ============================================================


-- ── Story ↔ Événement — avec enrichissement narratif ────────
-- Cœur de la proposition Kasuku : le même événement peut être
-- raconté différemment selon l'angle du récit.

CREATE TABLE story_events (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id            UUID        NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  event_id            UUID        NOT NULL REFERENCES events(id)  ON DELETE RESTRICT,
  -- RESTRICT : impossible de supprimer un événement présent dans un récit
  position            SMALLINT    NOT NULL DEFAULT 0,
  lang                VARCHAR(5),

  -- Enrichissement contextuel propre à cet angle narratif
  narrative_text      TEXT,            -- texte narratif pour cet angle du récit
  narrative_audio_url TEXT,            -- URL audio narratif
  narrative_video_url TEXT,            -- URL vidéo narrative
  quote               TEXT,            -- citation liée à cet événement dans ce récit
  quote_author        TEXT,            -- auteur de la citation
  cta                 JSONB,
  -- Structure CTA : {"label":"En savoir plus","url":"...","type":"link|module|event"}

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(story_id, event_id)
  -- Un même événement n'apparaît qu'une seule fois par récit
);

COMMENT ON TABLE  story_events               IS 'Junction Story ↔ Event avec enrichissement narratif contextuel. Cœur de la proposition Kasuku.';
COMMENT ON COLUMN story_events.position      IS 'Ordre de l''événement dans le récit (0-based).';
COMMENT ON COLUMN story_events.narrative_text IS 'Texte narratif propre à cet angle du récit (peut différer selon le Story).';
COMMENT ON COLUMN story_events.cta           IS 'Call-to-action : {"label":"...","url":"...","type":"link|module|event"}';

CREATE INDEX idx_story_events_story ON story_events(story_id, position);
CREATE INDEX idx_story_events_event ON story_events(event_id);


-- ── Événement ↔ Module ───────────────────────────────────────
-- Un module est accessible partout où l'événement apparaît.

CREATE TABLE event_modules (
  event_id  UUID NOT NULL REFERENCES events(id)  ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, module_id)
);

COMMENT ON TABLE event_modules IS 'Un module devient accessible partout où l''événement auquel il est rattaché apparaît.';

CREATE INDEX idx_event_modules_module ON event_modules(module_id);


-- ── Événement ↔ Thème ────────────────────────────────────────

CREATE TABLE event_themes (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, theme_id)
);

CREATE INDEX idx_event_themes_theme ON event_themes(theme_id);


-- ── Récit ↔ Thème ────────────────────────────────────────────

CREATE TABLE story_themes (
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  theme_id UUID NOT NULL REFERENCES themes(id)  ON DELETE CASCADE,
  PRIMARY KEY (story_id, theme_id)
);

CREATE INDEX idx_story_themes_theme ON story_themes(theme_id);


-- ── Module ↔ Thème ───────────────────────────────────────────

CREATE TABLE module_themes (
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  theme_id  UUID NOT NULL REFERENCES themes(id)  ON DELETE CASCADE,
  PRIMARY KEY (module_id, theme_id)
);

CREATE INDEX idx_module_themes_theme ON module_themes(theme_id);


-- ── Événement ↔ Personne (avec rôle) ────────────────────────

CREATE TABLE event_people (
  event_id  UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  person_id UUID        NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  role      person_role NOT NULL DEFAULT 'other',
  note      TEXT,       -- précision libre : "Discours inaugural", "Signataire du traité"
  PRIMARY KEY (event_id, person_id, role)
);

COMMENT ON COLUMN event_people.note IS 'Précision libre sur le rôle dans cet événement spécifique.';

CREATE INDEX idx_event_people_person ON event_people(person_id);


-- ── Événement ↔ Lieu (avec rôle) ────────────────────────────

CREATE TABLE event_places (
  event_id UUID       NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  place_id UUID       NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  role     place_role NOT NULL DEFAULT 'primary',
  PRIMARY KEY (event_id, place_id, role)
);

CREATE INDEX idx_event_places_place ON event_places(place_id);


-- ── Événement ↔ Média ────────────────────────────────────────

CREATE TABLE event_media (
  event_id UUID     NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  media_id UUID     NOT NULL REFERENCES media(id)  ON DELETE CASCADE,
  position SMALLINT NOT NULL DEFAULT 0,
  is_cover BOOLEAN  NOT NULL DEFAULT FALSE,
  -- is_cover = TRUE pour l'image principale. Un seul par événement (enforcer en applicatif).
  PRIMARY KEY (event_id, media_id)
);

CREATE INDEX idx_event_media_media   ON event_media(media_id);
CREATE INDEX idx_event_media_cover   ON event_media(event_id) WHERE is_cover = TRUE;


-- ── Récit ↔ Média ────────────────────────────────────────────

CREATE TABLE story_media (
  story_id UUID    NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  media_id UUID    NOT NULL REFERENCES media(id)   ON DELETE CASCADE,
  is_cover BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (story_id, media_id)
);

CREATE INDEX idx_story_media_media ON story_media(media_id);


-- ── Relations entre événements (graphe causal) ───────────────

CREATE TABLE event_relations (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         UUID          NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  related_event_id UUID          NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  relation_type    relation_type NOT NULL,
  description      TEXT,
  -- Ex: "La défaite de Sedan entraîne directement la chute du Second Empire."
  created_by       UUID          REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT chk_no_self_relation CHECK (event_id != related_event_id),
  UNIQUE(event_id, related_event_id, relation_type)
);

COMMENT ON TABLE  event_relations              IS 'Graphe causal et contextuel entre événements. Alimente la vue Explorer.';
COMMENT ON COLUMN event_relations.relation_type IS 'cause | consequence | concurrent | response | context | related';
COMMENT ON COLUMN event_relations.description   IS 'Explication narrative de la relation entre les deux événements.';

CREATE INDEX idx_event_relations_event   ON event_relations(event_id);
CREATE INDEX idx_event_relations_related ON event_relations(related_event_id);
CREATE INDEX idx_event_relations_type    ON event_relations(relation_type);


-- ── Kalenda ↔ Événements / Récits / Modules / Thèmes ────────
-- La résolution des dépendances se fait à l'export, pas à la sélection.
-- Sélectionner un récit n'inclut pas automatiquement ses événements.

CREATE TABLE kalenda_events (
  kalenda_id UUID NOT NULL REFERENCES kalendas(id) ON DELETE CASCADE,
  event_id   UUID NOT NULL REFERENCES events(id)   ON DELETE CASCADE,
  PRIMARY KEY (kalenda_id, event_id)
);

CREATE TABLE kalenda_stories (
  kalenda_id UUID NOT NULL REFERENCES kalendas(id)  ON DELETE CASCADE,
  story_id   UUID NOT NULL REFERENCES stories(id)   ON DELETE CASCADE,
  PRIMARY KEY (kalenda_id, story_id)
);

CREATE TABLE kalenda_modules (
  kalenda_id UUID NOT NULL REFERENCES kalendas(id)  ON DELETE CASCADE,
  module_id  UUID NOT NULL REFERENCES modules(id)   ON DELETE CASCADE,
  PRIMARY KEY (kalenda_id, module_id)
);

CREATE TABLE kalenda_themes (
  kalenda_id UUID NOT NULL REFERENCES kalendas(id)  ON DELETE CASCADE,
  theme_id   UUID NOT NULL REFERENCES themes(id)    ON DELETE CASCADE,
  PRIMARY KEY (kalenda_id, theme_id)
);

COMMENT ON TABLE kalenda_events  IS 'Contenu sélectionné dans un Kalenda. Dépendances résolues à l''export.';
COMMENT ON TABLE kalenda_stories IS 'Sélectionner un récit n''inclut pas automatiquement ses événements dans le Kalenda.';
