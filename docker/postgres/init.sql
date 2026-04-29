-- ============================================================
--  Kasuku — Initialisation PostgreSQL
--  Exécuté une seule fois à la création du container.
--  Les migrations (001→016) sont appliquées ensuite
--  par le service postgres-migrate.
-- ============================================================

-- Assure que l'extension pgcrypto est disponible globalement
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Le rôle et la base sont créés via les variables d'environnement
-- POSTGRES_USER / POSTGRES_DB / POSTGRES_PASSWORD dans docker-compose.
-- Ce fichier sert à configurer des options supplémentaires.

-- Paramètres de performance de base (ajustables selon les ressources)
ALTER SYSTEM SET shared_buffers            = '256MB';
ALTER SYSTEM SET work_mem                  = '16MB';
ALTER SYSTEM SET maintenance_work_mem      = '64MB';
ALTER SYSTEM SET effective_cache_size      = '1GB';
ALTER SYSTEM SET random_page_cost          = '1.1';  -- SSD
ALTER SYSTEM SET log_min_duration_statement = '1000'; -- log requêtes > 1s

SELECT pg_reload_conf();
