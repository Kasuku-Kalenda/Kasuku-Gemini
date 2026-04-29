-- ============================================================
--  Migration 015 — Fonctions & Triggers
-- ============================================================


-- ── 1. updated_at automatique ────────────────────────────────
-- Mise à jour de updated_at à chaque modification de ligne.

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_stories_updated_at
  BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_modules_updated_at
  BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_media_updated_at
  BEFORE UPDATE ON media
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_people_updated_at
  BEFORE UPDATE ON people
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_story_events_updated_at
  BEFORE UPDATE ON story_events
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_kalendas_updated_at
  BEFORE UPDATE ON kalendas
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ── 2. published_at automatique ──────────────────────────────
-- Enregistre la date de première publication au moment
-- où le statut passe à 'published'.

CREATE OR REPLACE FUNCTION fn_set_published_at()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_events_published_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION fn_set_published_at();

CREATE TRIGGER trg_stories_published_at
  BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION fn_set_published_at();

CREATE TRIGGER trg_modules_published_at
  BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION fn_set_published_at();

CREATE TRIGGER trg_kalendas_published_at
  BEFORE UPDATE ON kalendas
  FOR EACH ROW EXECUTE FUNCTION fn_set_published_at();


-- ── 3. search_vector — events ────────────────────────────────
-- Pondération : A = title (poids max), B = summary, C = content
-- unaccent() : "Sénégal" et "Senegal" trouvent le même résultat

CREATE OR REPLACE FUNCTION fn_update_event_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', unaccent(coalesce(NEW.title,   ''))), 'A') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.summary, ''))), 'B') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.content, ''))), 'C');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_events_search_vector
  BEFORE INSERT OR UPDATE OF title, summary, content
  ON events
  FOR EACH ROW EXECUTE FUNCTION fn_update_event_search_vector();


-- ── 4. search_vector — stories ───────────────────────────────

CREATE OR REPLACE FUNCTION fn_update_story_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', unaccent(coalesce(NEW.title,   ''))), 'A') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.summary, ''))), 'B');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_stories_search_vector
  BEFORE INSERT OR UPDATE OF title, summary
  ON stories
  FOR EACH ROW EXECUTE FUNCTION fn_update_story_search_vector();


-- ── 5. search_vector — modules ───────────────────────────────

CREATE OR REPLACE FUNCTION fn_update_module_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', unaccent(coalesce(NEW.title,   ''))), 'A') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.summary, ''))), 'B');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_modules_search_vector
  BEFORE INSERT OR UPDATE OF title, summary
  ON modules
  FOR EACH ROW EXECUTE FUNCTION fn_update_module_search_vector();


-- ── 6. search_vector — people ────────────────────────────────

CREATE OR REPLACE FUNCTION fn_update_people_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', unaccent(coalesce(NEW.name, ''))), 'A') ||
    setweight(to_tsvector('french', unaccent(coalesce(NEW.bio,  ''))), 'B');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_people_search_vector
  BEFORE INSERT OR UPDATE OF name, bio
  ON people
  FOR EACH ROW EXECUTE FUNCTION fn_update_people_search_vector();


-- ── 7. computed_start/end_date sur stories ───────────────────
-- Recalcule automatiquement les bornes temporelles d'un récit
-- à chaque ajout, modification ou suppression dans story_events.

CREATE OR REPLACE FUNCTION fn_refresh_story_dates()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
  v_story_id UUID;
BEGIN
  v_story_id := COALESCE(NEW.story_id, OLD.story_id);

  UPDATE stories SET
    computed_start_date = (
      SELECT MIN(e.start_date)
      FROM story_events se
      JOIN events e ON e.id = se.event_id
      WHERE se.story_id  = v_story_id
        AND e.start_date IS NOT NULL
        AND e.deleted_at IS NULL
    ),
    computed_end_date = (
      SELECT MAX(COALESCE(e.end_date, e.start_date))
      FROM story_events se
      JOIN events e ON e.id = se.event_id
      WHERE se.story_id  = v_story_id
        AND e.start_date IS NOT NULL
        AND e.deleted_at IS NULL
    )
  WHERE id = v_story_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_story_events_refresh_dates
  AFTER INSERT OR UPDATE OR DELETE ON story_events
  FOR EACH ROW EXECUTE FUNCTION fn_refresh_story_dates();


-- ── 8. Audit trail automatique sur events ────────────────────
-- Enregistre un snapshot de la ligne AVANT chaque modification.

CREATE OR REPLACE FUNCTION fn_record_event_revision()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO event_revisions (event_id, changed_by, change_type, previous_data)
    VALUES (
      OLD.id,
      NEW.updated_by,
      CASE
        WHEN NEW.status = 'published' AND OLD.status != 'published'    THEN 'publish'
        WHEN NEW.status = 'archived'  AND OLD.status != 'archived'     THEN 'archive'
        WHEN NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL      THEN 'delete'
        WHEN NEW.deleted_at IS NULL     AND OLD.deleted_at IS NOT NULL  THEN 'restore'
        ELSE 'update'
      END,
      to_jsonb(OLD)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_events_audit
  AFTER UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION fn_record_event_revision();
