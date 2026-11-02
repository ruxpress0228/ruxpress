#!/usr/bin/env bash
# First-time database setup for a docker compose installation:
#   1) applies sql/DDL.sql when the schema does not exist yet
#   2) creates the first SUPER_ADMIN when the admins table is empty
# Re-running is safe: both steps are skipped once done.
# Usage: ./script/init-db.sh            (after `docker compose up -d`)
#        ADMIN_EMAIL=you@company.com ./script/init-db.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -f "$ROOT/back/.env" ]; then set -a; . "$ROOT/back/.env"; set +a; fi
DB_HOST="${DB_HOST:-mariadb}"; DB_PORT="${DB_PORT:-3306}"; DB_NAME="${DB_NAME:-ruxpress}"
DB_USERNAME="${DB_USERNAME:-ruxpress}"; DB_PASSWORD="${DB_PASSWORD:-ruxpress}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
# BCrypt of the starting password "admin1234" — change it right after the first login.
ADMIN_HASH='$2a$10$dp/6oQUJtcR00VL.jE9WkO8jpi0MLuY4mHVf3JRVASXaf7dyeZLO.'

sql() {
  if [ "$DB_HOST" = "mariadb" ]; then
    (cd "$ROOT" && docker compose exec -T mariadb mariadb -u"$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" "$@")
  else
    local client; client=$(command -v mariadb || command -v mysql)
    "$client" -h "$DB_HOST" -P "$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" "$@"
  fi
}

if sql -N -e "SHOW TABLES LIKE 'users'" | grep -q users; then
  echo "schema: already present, skipped"
else
  sql < "$ROOT/sql/DDL.sql"
  echo "schema: created from sql/DDL.sql"
fi

if [ "$(sql -N -e 'SELECT COUNT(*) FROM admins')" = "0" ]; then
  sql -e "INSERT INTO admins (email, password_hash, name, role, status, created_at, updated_at)
          VALUES ('$ADMIN_EMAIL', '$ADMIN_HASH', 'Super Admin', 'SUPER_ADMIN', 'ACTIVE', NOW(), NOW());"
  echo "admin: $ADMIN_EMAIL / admin1234  -> sign in at /admin/login and change the password"
else
  echo "admin: exists, skipped"
fi
