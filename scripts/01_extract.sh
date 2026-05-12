#!/usr/bin/env bash
set -euo pipefail

PBIX="${1:-samples/regional_sales/Regional Sales Sample.pbix}"
OUTDIR="samples/$(basename "$PBIX" .pbix)/ir"

echo "=== Extracting $PBIX ==="
mkdir -p "$OUTDIR/data"

python -c "
import sys, json, os
sys.path.insert(0, 'packages/pbix-parser/src')
from pbix_parser.extract import extract_pbix
from pbix_parser.data_export import export_data

ir, data = extract_pbix('${PBIX//\\/\\\\}')
out = '$OUTDIR'
os.makedirs(out, exist_ok=True)
os.makedirs(out + '/data', exist_ok=True)

with open(out + '/ir.json', 'w', encoding='utf-8') as f:
    json.dump(ir.model_dump(mode='json'), f, indent=2, ensure_ascii=False)

export_data(data, out)

# Copy to web app
import shutil
shutil.copy(out + '/ir.json', 'packages/pbix-web-app/src/data/ir.json')
for fn in os.listdir(out + '/data'):
    shutil.copy(os.path.join(out + '/data', fn), os.path.join('packages/pbix-web-app/public/data', fn))

print(f'Done: {len(ir.pages)} pages, {len(data)} tables')
"
