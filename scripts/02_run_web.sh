#!/usr/bin/env bash
set -euo pipefail

cd packages/pbix-web-app
echo "=== Starting pbix-web-app on http://localhost:5173 ==="
npx vite --port 5173 --open
