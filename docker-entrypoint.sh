#!/bin/sh
# Container entrypoint:
#   - ensures the persistent /data volume has the SQLite DB file and uploads dir
#   - on the very first run (no DB yet), seeds the schema + admin user
#   - hands off to the Node server (CMD)

set -eu

DATA_DIR="/data"
DB_FILE="${DATABASE_URL:-/data/database.sqlite}"
UPLOADS_DIR="${UPLOADS_DIR:-/data/uploads}"

mkdir -p "${DATA_DIR}" "$(dirname "${DB_FILE}")" "${UPLOADS_DIR}"

# First-boot: seed schema and admin user (admin / admin123 — change in production!)
if [ ! -f "${DB_FILE}" ]; then
  echo "[entrypoint] No database at ${DB_FILE} — running db:init"
  cd /app/server
  DATABASE_URL="${DB_FILE}" UPLOADS_DIR="${UPLOADS_DIR}" \
    node scripts/init-database.js
  cd /app
fi

exec "$@"