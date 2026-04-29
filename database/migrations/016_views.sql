-- ============================================================
--  Migration 016 — Vues utilitaires
-- ============================================================


-- ── Vue 1 : Événements publiés (lecture publique principale) ─

CREATE VIEW v_events_published AS
SELECT
  e.id,
  e.slug,
  e.lang,
  e.title,
  e.summary,
  e.temporal_type,
  e.start_date,
  e.end_date,
  e.display_date,
  e.approx_century,
  e.approx_decade,
  e.annual_recurrence,
  e.primary_country_code,
  p.name        AS primary_place_name,
  p.place_type  AS primary_place_type,
  e.featured,
  e.featured_position,
  e.reliability,
  e.contributors,
  e.published_at,
  e.created_at,
  e.updated_at
FROM events e
LEFT JOIN places p ON p.id = e.primary_place_id
WHERE e.status    = 'published'
  AND e.deleted_at IS NULL;

COMMENT ON VIEW v_events_published IS 'Événements publiés et non supprimés. Vue principale pour l''API publique.';


-- ── Vue 2 : Calendrier annuel ("aujourd'hui dans l'histoire") ─

CREATE VIEW v_annual_calendar AS
SELECT
  e.id,
  e.slug,
  e.lang,
  e.title,
  e.summary,
  e.start_date,
  e.primary_country_code,
  e.reliability,
  EXTRACT(YEAR  FROM e.start_date)::INT AS original_year,
  EXTRACT(MONTH FROM e.start_date)::INT AS month,
  EXTRACT(DAY   FROM e.start_date)::INT AS day
FROM events e
WHERE e.annual_recurrence = TRUE
  AND e.start_date         IS NOT NULL
  AND e.status             = 'published'
  AND e.deleted_at         IS NULL;

COMMENT ON VIEW v_annual_calendar IS 'Événements récurrents annuels. Filtrer : WHERE month = X AND day = Y.';


-- ── Vue 3 : Récits publiés avec bornes temporelles et compte d'événements ──

CREATE VIEW v_stories_published AS
SELECT
  s.id,
  s.slug,
  s.lang,
  s.title,
  s.summary,
  s.cover_url,
  s.computed_start_date,
  s.computed_end_date,
  s.contributors,
  s.published_at,
  s.created_at,
  COUNT(se.event_id) AS event_count
FROM stories s
LEFT JOIN story_events se ON se.story_id = s.id
WHERE s.status    = 'published'
  AND s.deleted_at IS NULL
GROUP BY s.id;

COMMENT ON VIEW v_stories_published IS 'Récits publiés avec nombre d''événements et bornes temporelles calculées.';


-- ── Vue 4 : Modules publiés ──────────────────────────────────

CREATE VIEW v_modules_published AS
SELECT
  m.id,
  m.slug,
  m.lang,
  m.title,
  m.summary,
  m.thumbnail_url,
  m.duration_minutes,
  m.level,
  m.contributors,
  m.published_at,
  m.created_at
FROM modules m
WHERE m.status    = 'published'
  AND m.deleted_at IS NULL;

COMMENT ON VIEW v_modules_published IS 'Modules publiés. Vue principale pour l''API publique des cours.';


-- ── Vue 5 : Tableau de bord traductions manquantes ───────────
-- Croise les événements publiés avec les langues cibles pour
-- identifier les champs non encore traduits.

CREATE VIEW v_translation_gaps AS
SELECT
  'event'       AS entity_type,
  e.id          AS entity_id,
  e.title       AS entity_title,
  l.lang,
  f.field,
  EXISTS (
    SELECT 1 FROM translations t
    WHERE t.entity_type = 'event'
      AND t.entity_id   = e.id
      AND t.lang        = l.lang
      AND t.field       = f.field
  ) AS is_translated
FROM events e
CROSS JOIN (VALUES ('en'),('sw'),('ar'),('pt')) AS l(lang)
CROSS JOIN (VALUES ('title'),('summary'))       AS f(field)
WHERE e.status    = 'published'
  AND e.deleted_at IS NULL;

COMMENT ON VIEW v_translation_gaps IS 'Champs manquants par langue cible sur les événements publiés. Tableau de bord éditorial.';


-- ── Vue 6 : Ressources dont les droits expirent bientôt ──────

CREATE VIEW v_media_rights_expiring AS
SELECT
  id,
  type,
  title,
  license,
  credit,
  rights_expiry,
  (rights_expiry - CURRENT_DATE) AS days_remaining
FROM media
WHERE rights_expiry IS NOT NULL
  AND rights_expiry >= CURRENT_DATE
ORDER BY rights_expiry ASC;

COMMENT ON VIEW v_media_rights_expiring IS 'Ressources avec droits expirant prochainement. Filtrer : WHERE days_remaining <= 90.';


-- ── Vue 7 : Graphe de relations entre événements ─────────────
-- Utile pour la page Explorer.

CREATE VIEW v_event_graph AS
SELECT
  er.relation_type,
  er.description,
  e1.id       AS from_id,
  e1.slug     AS from_slug,
  e1.title    AS from_title,
  e1.start_date AS from_date,
  e2.id       AS to_id,
  e2.slug     AS to_slug,
  e2.title    AS to_title,
  e2.start_date AS to_date
FROM event_relations er
JOIN events e1 ON e1.id = er.event_id
JOIN events e2 ON e2.id = er.related_event_id
WHERE e1.status    = 'published' AND e1.deleted_at IS NULL
  AND e2.status    = 'published' AND e2.deleted_at IS NULL;

COMMENT ON VIEW v_event_graph IS 'Graphe de relations causales entre événements publiés. Alimente la vue Explorer.';
