-- Migration 021 — Ajout de period_label à la table stories
-- Ce champ stocke le label de période affiché sur les cartes et pages de parcours
-- (ex: "1895 – 1958"). Il est calculé automatiquement côté client depuis les dates
-- des moments, mais peut être surchargé manuellement par l'admin.

ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS period_label TEXT;
