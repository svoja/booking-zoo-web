#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-3101}"

if ! [[ "$PORT" =~ ^[0-9]+$ ]] || [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
  echo "Invalid port: $PORT"
  echo "Usage: ./deploy.sh [PORT]"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$ROOT_DIR/.app.pid"
LOG_DIR="$ROOT_DIR/logs"
LOG_FILE="$LOG_DIR/app-$PORT.log"

mkdir -p "$LOG_DIR"
cd "$ROOT_DIR"

if [ -f "$PID_FILE" ]; then
  OLD_PID="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [ -n "${OLD_PID}" ] && kill -0 "$OLD_PID" 2>/dev/null; then
    echo "Stopping old process (PID: $OLD_PID)..."
    kill "$OLD_PID" || true
    sleep 1
  fi
fi

echo "Installing dependencies..."
npm install
(cd backend && npm install)
(cd frontend && npm install && npm run build)

echo "Starting app on port $PORT..."
export NODE_ENV=production
export PORT
nohup npm start > "$LOG_FILE" 2>&1 &
NEW_PID=$!

echo "$NEW_PID" > "$PID_FILE"

echo "Deployed successfully"
echo "URL: http://<your-server-ip>:$PORT"
echo "PID: $NEW_PID"
echo "Log: $LOG_FILE"
echo "Stop: kill $(cat "$PID_FILE")"
