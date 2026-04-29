-- ============================================================
--  Migration 014 — Historique des révisions (audit trail)
--  Trace toutes les modifications apportées aux événements.
-- ============================================================

CREATE TABLE event_revisions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  changed_by    UUID        REFERENCES users(id) ON DELETE SET NULL,
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  change_type   VARCHAR(20) NOT NULL,
  -- create   = création initiale
  -- update   = modification du contenu
  -- publish  = passage en statut published
  -- archive  = passage en statut archived
  -- restore  = restauration depuis archived ou deleted
  -- delete   = soft delete (deleted_at renseigné)

  previous_data JSONB,
  -- Snapshot complet de la ligne events AVANT la modification
  -- Permet de reconstituer n'importe quelle version antérieure

  change_note   TEXT
  -- Note facultative du contributeur décrivant la modification
);

COMMENT ON TABLE  event_revisions              IS 'Historique complet et immuable des modifications sur les événements.';
COMMENT ON COLUMN event_revisions.previous_data IS 'Snapshot JSON de la ligne events avant modification. Permet rollback.';
COMMENT ON COLUMN event_revisions.change_type   IS 'create | update | publish | archive | restore | delete';
COMMENT ON COLUMN event_revisions.change_note   IS 'Note descriptive optionnelle du contributeur sur la modification.';

CREATE INDEX idx_revisions_event ON event_revisions(event_id, changed_at DESC);
CREATE INDEX idx_revisions_user  ON event_revisions(changed_by);
CREATE INDEX idx_revisions_type  ON event_revisions(change_type);
