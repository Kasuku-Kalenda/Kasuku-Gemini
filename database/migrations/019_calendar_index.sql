-- ============================================================
--  Migration 019 — Index d'expression pour "On This Day"
-- ============================================================
-- Optimise les requêtes EXTRACT(MONTH/DAY FROM start_date)
-- utilisées par l'endpoint /events/calendar-days et le filtre
-- month+day de GET /events. Critique pour la scalabilité.

CREATE INDEX IF NOT EXISTS idx_events_month_day
  ON events (
    (EXTRACT(MONTH FROM start_date)::int),
    (EXTRACT(DAY   FROM start_date)::int)
  )
  WHERE start_date IS NOT NULL
    AND deleted_at IS NULL;
