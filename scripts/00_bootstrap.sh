#!/usr/bin/env bash
set -euo pipefail

echo "=== pbix-web-kit Bootstrap ==="

# Python packages
echo "[1/3] Installing pbix-parser..."
pip install -e packages/pbix-parser 2>&1 | tail -1

echo "[2/3] Installing pbix-validator..."
pip install -e packages/pbix-validator 2>&1 | tail -1
python -m playwright install chromium 2>/dev/null || echo "  Playwright chromium skipped"

# Frontend
echo "[3/3] Installing pbix-web-app..."
cd packages/pbix-web-app
pnpm install 2>&1 | tail -1
cd ../..

echo ""
echo "=== Bootstrap complete ==="
echo "Run: bash scripts/01_extract.sh <path/to/sample.pbix>"
echo "Run: bash scripts/02_run_web.sh"
