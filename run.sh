#!/usr/bin/env bash
# Start Northstar locally: installs dependencies, creates .env.local from the
# example on first run, then starts the dev server on http://localhost:3000
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "node is not installed — install Node 20 or newer, then re-run ./run.sh" >&2
  exit 1
fi

if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "Created .env.local — add your VERCEL_AI_GATEWAY_API_KEY to it for the chat, then re-run ./run.sh"
fi

if grep -q '^VERCEL_AI_GATEWAY_API_KEY=$' .env.local; then
  echo "Warning: VERCEL_AI_GATEWAY_API_KEY is empty in .env.local — every screen works, but the chat will error."
fi

npm install
npm run dev
