#!/usr/bin/env bash
# ============================================================
# Third Time Traders — Dev Server (kill + restart)
#
# Usage:
#   ./dev.sh          # kill any existing dev server, then start fresh
#   ./dev.sh --kill   # just kill the server, don't restart
#   ./dev.sh --port 3001  # use a custom port (default: 3000)
#
# First time on a new machine:
#   npm install && ./dev.sh
# ============================================================

set -euo pipefail

PORT="${PORT:-3000}"
KILL_ONLY=false

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --kill)  KILL_ONLY=true; shift ;;
    --port)  PORT="$2"; shift 2 ;;
    *)       echo "Unknown arg: $1"; exit 1 ;;
  esac
done

# ── Kill any process on the target port ──────────────────────
kill_port() {
  local pids
  pids=$(lsof -ti :"$PORT" 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    echo "⏹  Killing process(es) on port $PORT: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 0.5
    echo "   Done."
  else
    echo "✅ Port $PORT is free."
  fi
}

kill_port

if $KILL_ONLY; then
  echo "👋 Server killed. Exiting."
  exit 0
fi

# ── Install deps if node_modules is missing ──────────────────
if [[ ! -d node_modules ]]; then
  echo "📦 node_modules not found — running npm install..."
  npm install
fi

# ── Start the dev server ─────────────────────────────────────
echo ""
echo "🚀 Starting Next.js dev server on port $PORT..."
echo "   http://localhost:$PORT"
echo "   Press Ctrl+C to stop."
echo ""

exec npx next dev --port "$PORT"
