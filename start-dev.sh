#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Cleaning up stale containers and port conflicts ==="
docker compose -f "$ROOT_DIR/docker-compose.yml" down 2>/dev/null || true
for port in 3000 3001 6379; do
  lsof -ti:$port 2>/dev/null | xargs kill -9 2>/dev/null || true
done

echo "=== Starting Docker services (PostgreSQL + Redis) ==="
docker compose -f "$ROOT_DIR/docker-compose.yml" up -d

echo "=== Waiting for PostgreSQL to be ready ==="
until docker compose -f "$ROOT_DIR/docker-compose.yml" exec -T postgres pg_isready -U cbt_user -d cbt_db 2>/dev/null; do
  sleep 1
done
echo "PostgreSQL is ready."

echo "=== Installing API dependencies ==="
npm --prefix "$ROOT_DIR/apps/api" install

echo "=== Running database migrations ==="
npm --prefix "$ROOT_DIR/apps/api" run migration:run

echo "=== Installing Web dependencies ==="
npm --prefix "$ROOT_DIR/apps/web" install

echo "=== Starting API (port 3001) ==="
npm --prefix "$ROOT_DIR/apps/api" run start:dev &
API_PID=$!

echo "=== Starting Web (port 3000) ==="
npm --prefix "$ROOT_DIR/apps/web" run dev &
WEB_PID=$!

cleanup() {
  echo ""
  echo "=== Shutting down ==="
  kill "$API_PID" "$WEB_PID" 2>/dev/null
  wait "$API_PID" "$WEB_PID" 2>/dev/null
  echo "Done."
}
trap cleanup EXIT INT TERM

echo ""
echo "========================================="
echo "  API  -> http://localhost:3001"
echo "  Web  -> http://localhost:3000"
echo "========================================="
echo ""

wait
