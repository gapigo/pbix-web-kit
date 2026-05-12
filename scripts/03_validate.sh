#!/usr/bin/env bash
set -euo pipefail

IR="${1:-samples/regional_sales/ir/ir.json}"
URL="${2:-http://localhost:5173}"

echo "=== Validating $IR ==="
python -c "
from pbix_validator.screenshot import take_screenshot
from pbix_validator.compare import validate
import json

# Take screenshot
screenshot_path = 'samples/regional_sales/screenshot_validation.png'
print(f'Taking screenshot of $URL...')
take_screenshot('$URL', screenshot_path)
print(f'Screenshot saved to {screenshot_path}')

# Validate
report = validate('$IR', f'Screenshot taken at $URL')

print(f'Validation: {report[\"passed\"]}/{report[\"total_checks\"]} passed')
if report.get('warnings'):
    for w in report['warnings'][:10]:
        print(f'  WARN: {w}')

# Save report
with open('samples/regional_sales/validation.json', 'w') as f:
    json.dump(report, f, indent=2)
print(f'Report saved to samples/regional_sales/validation.json')
"
