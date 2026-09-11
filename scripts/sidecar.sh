#!/usr/bin/env bash
# Start the Lava Studio local media sidecar (FFmpeg probe/render API).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-7860}"

cd "$ROOT/backend"
export PATH="$HOME/.local/bin:$PATH"

if [ ! -d ".venv" ]; then
  uv sync --extra dev
fi

exec uv run uvicorn lava_backend.main:app --host 127.0.0.1 --port "$PORT" "$@"