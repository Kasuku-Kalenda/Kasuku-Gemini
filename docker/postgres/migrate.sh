#!/bin/sh
# Kasuku — Application des migrations PostgreSQL
# Exécuté par le service postgres-migrate au démarrage de la stack.

set -e

PGHOST="${PGHOST:-postgres}"
PGUSER="${PGUSER:-kasuku}"
PGDATABASE="${PGDATABASE:-kasuku_db}"

echo "⏳  Attente de PostgreSQL sur $PGHOST..."
until pg_isready -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -q; do
  sleep 2
done

echo "✅  PostgreSQL prêt. Application des migrations..."

for f in /migrations/*.sql; do
  echo "▶️   $(basename "$f")"
  psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" \
       -f "$f" --single-transaction -q
  echo "   ✓"
done

echo "🎉  Toutes les migrations sont appliquées."
