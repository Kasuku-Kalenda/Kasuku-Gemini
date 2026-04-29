-- ============================================================
--  Migration 001 — Extensions & Types énumérés
-- ============================================================

-- Extensions PostgreSQL nécessaires
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "unaccent";   -- recherche sans accents
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- recherche approximative LIKE rapide

-- Type de temporalité d'un événement
CREATE TYPE temporal_type AS ENUM (
  'exact_date',   -- date précise connue
  'date_range',   -- période (start_date → end_date)
  'approximate',  -- siècle ou décennie approximatif
  'unknown'       -- date inconnue
);

-- Statut éditorial partagé par tous les objets publiables
CREATE TYPE content_status AS ENUM (
  'draft',        -- brouillon, non visible publiquement
  'published',    -- publié, visible
  'archived'      -- archivé, conservé mais non visible
);

-- Fiabilité historique d'un événement
CREATE TYPE reliability_type AS ENUM (
  'confirmed',    -- confirmé par des sources fiables
  'probable',     -- probable mais non certifié
  'contested',    -- sujet à débat historiographique
  'unknown'       -- origine ou date incertaine
);

-- Nature de la relation entre deux événements
CREATE TYPE relation_type AS ENUM (
  'cause',        -- A a causé B
  'consequence',  -- B est une conséquence de A
  'concurrent',   -- A et B sont contemporains et liés
  'response',     -- B est une réponse directe à A
  'context',      -- A fournit le contexte de B
  'related'       -- relation générique
);

-- Type de fichier média/ressource
CREATE TYPE media_type AS ENUM (
  'image',
  'video',
  'audio',
  'pdf',
  'document'
);

-- Rôle d'une personne dans un événement
CREATE TYPE person_role AS ENUM (
  'protagonist',  -- acteur principal
  'witness',      -- témoin
  'author',       -- auteur d'un texte lié
  'organizer',    -- organisateur
  'opponent',     -- opposant
  'victim',       -- victime
  'other'
);

-- Rôle d'un lieu dans un événement
CREATE TYPE place_role AS ENUM (
  'primary',      -- lieu principal
  'related',      -- lieu secondaire
  'origin',       -- lieu de départ
  'destination'   -- lieu d'arrivée
);

-- Type de lieu géographique
CREATE TYPE place_type AS ENUM (
  'continent',
  'country',
  'region',
  'city',
  'site',         -- lieu historique, monument, quartier
  'virtual'       -- espace non géographique
);

-- Rôle d'un utilisateur dans l'administration
CREATE TYPE user_role AS ENUM (
  'admin',        -- accès total
  'editor',       -- peut publier
  'contributor',  -- peut créer, ne peut pas publier
  'viewer'        -- lecture seule admin
);
