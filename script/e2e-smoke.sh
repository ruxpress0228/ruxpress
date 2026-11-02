#!/usr/bin/env bash
# Runs the end-to-end smoke scenario (front/e2e/smoke.cjs) against a real backend on an
# in-memory H2 database and the Vite dev server. Nothing touches a real database.
# Requires: Java 21, Maven, Node, and Playwright with Chromium (npx playwright install chromium).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK="${E2E_WORK:-/tmp/ruxpress-e2e}"
PORT_FRONT="${E2E_FRONT_PORT:-3000}"
mkdir -p "$WORK/uploads"

JAR=$(ls "$ROOT"/back/target/ruxpress-back-*.jar 2>/dev/null | head -1 || true)
if [ -z "$JAR" ]; then
  (cd "$ROOT/back" && mvn -B -q -DskipTests package)
  JAR=$(ls "$ROOT"/back/target/ruxpress-back-*.jar | head -1)
fi

UPLOAD_DIR="$WORK/uploads" LOG_FILE="$WORK/backend.log" CORS_ALLOWED_ORIGINS="http://127.0.0.1:$PORT_FRONT,http://localhost:$PORT_FRONT" \
  java -jar "$JAR" --spring.profiles.active=h2 > "$WORK/backend.out" 2>&1 &
BACK_PID=$!
(cd "$ROOT/front" && exec npx vite --port "$PORT_FRONT" --host 127.0.0.1 --strictPort > "$WORK/front.out" 2>&1) &
FRONT_PID=$!
# Vite runs as a grandchild of npx, so stop the whole process tree of both servers on exit.
stop_tree() { local pid=$1; for child in $(pgrep -P "$pid" 2>/dev/null); do stop_tree "$child"; done; kill "$pid" 2>/dev/null || true; }
trap 'stop_tree $BACK_PID; stop_tree $FRONT_PID' EXIT

for _ in $(seq 1 90); do
  curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT_FRONT/api/v1/notices?page=0&size=1" 2>/dev/null | grep -q 200 && break
  sleep 2
done

cd "$ROOT/front/e2e"
FRONT="http://127.0.0.1:$PORT_FRONT" API=http://127.0.0.1:8080 node smoke.cjs
