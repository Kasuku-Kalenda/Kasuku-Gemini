#!/usr/bin/env bash
# ============================================================
#  Kasuku — Exécution des migrations PostgreSQL dans l'ordre
#  Usage : ./database/migrate.sh [DATABASE_URL]
#
#  Exemple :
#    ./database/migrate.sh postgresql://kasuku:pass@localhost:5432/kasuku
#
#  Sans argument, utilise la variable d'environnement DATABASE_URL
# ============================================================

set -euo pipefail

DATABASE_URL="${1:-${DATABASE_URL:-}}"

if [[ -z "$DATABASE_URL" ]]; then
  echo "❌  DATABASE_URL manquant."
  echo "    Usage : ./database/migrate.sh postgresql://user:pass@host:5432/db"
  exit 1
fi

MIGRATIONS_DIR="$(dirname "$0")/migrations"

echo "🗄️  Connexion à la base de données..."
echo "📁  Dossier migrations : $MIGRATIONS_DIR"
echo ""

for file in "$MIGRATIONS_DIR"/*.sql; do
  filename=$(basename "$file")
  echo "▶️   Exécution : $filename"
  psql "$DATABASE_URL" -f "$file" --single-transaction -q
  echo "✅  $filename"
done

echo ""
echo "🎉  Toutes les migrations ont été appliquées avec succès."
