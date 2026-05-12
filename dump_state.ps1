$ErrorActionPreference = "Continue"
$out = "STATE_DUMP.md"

# Header
"# STATE DUMP - $(Get-Date -Format 'yyyy-MM-dd HH:mm')" | Set-Content $out -Encoding UTF8
"" | Add-Content $out
"Snapshot do repo antes da Rodada B. Esta e a verdade de partida." | Add-Content $out
"" | Add-Content $out

# 1. Git log
"## 1. Git log" | Add-Content $out
'```' | Add-Content $out
git log --oneline --stat 2>&1 | Add-Content $out
'```' | Add-Content $out
"" | Add-Content $out

# 2. Estrutura de arquivos
"## 2. Estrutura do repo (top 200 paths)" | Add-Content $out
'```' | Add-Content $out
Get-ChildItem -Recurse -File `
  | Where-Object { $_.FullName -notlike "*node_modules*" `
                   -and $_.FullName -notlike "*\.git\*" `
                   -and $_.FullName -notlike "*__pycache__*" `
                   -and $_.FullName -notlike "*\.venv*" `
                   -and $_.FullName -notlike "*dist*" `
                   -and $_.FullName -notlike "*build*" } `
  | Select-Object -First 200 -ExpandProperty FullName `
  | ForEach-Object { $_.Replace((Get-Location).Path + "\", "") } `
  | Add-Content $out
'```' | Add-Content $out
"" | Add-Content $out

# 3. Documentos chave
foreach ($f in @("HANDOFF.md", "WORKLOG.md", "README.md", "CLAUDE.md")) {
  if (Test-Path $f) {
    "## 3. $f" | Add-Content $out
    '```markdown' | Add-Content $out
    Get-Content $f | Add-Content $out
    '```' | Add-Content $out
    "" | Add-Content $out
  }
}

# 4. IR analysis
"## 4. Analise do IR.json" | Add-Content $out
'```' | Add-Content $out
$irPath = "samples\regional_sales\ir\ir.json"
if (Test-Path $irPath) {
  $pyScript = @"
import json
from collections import Counter
d = json.load(open(r'$irPath', encoding='utf-8'))
print(f'Pages: {len(d[\"pages\"])}')
for p in d['pages']:
    types = Counter(v['type'] for v in p['visuals'])
    raw = Counter(v.get('raw_type','?') for v in p['visuals'])
    print(f'  Page {p[\"display_name\"]!r}: {len(p[\"visuals\"])} visuals')
    print(f'    canonical: {dict(types)}')
    print(f'    raw_type:  {dict(raw)}')
print()
print(f'Tables: {len(d.get(\"tables\", []))}')
for t in d.get('tables', [])[:10]:
    print(f'  {t[\"name\"]}: {t.get(\"row_count\",\"?\")} rows, {len(t.get(\"columns\",{}))} cols')
print()
print(f'Measures: {len(d.get(\"measures\", []))}')
for m in d.get('measures', [])[:10]:
    expr = m.get('expression','')[:80]
    print(f'  {m.get(\"name\",\"?\")} = {expr}')
print()
print(f'Relationships: {len(d.get(\"relationships\", []))}')
"@
  $pyScript | python 2>&1 | Add-Content $out
} else {
  "IR.json NOT FOUND at $irPath" | Add-Content $out
}
'```' | Add-Content $out
"" | Add-Content $out

# 5. Data files
"## 5. Data files exportados" | Add-Content $out
'```' | Add-Content $out
$dataDir = "samples\regional_sales\ir\data"
if (Test-Path $dataDir) {
  Get-ChildItem $dataDir -File | ForEach-Object {
    "{0,-50} {1,10} bytes" -f $_.Name, $_.Length
  } | Add-Content $out
} else {
  "data/ NOT FOUND at $dataDir" | Add-Content $out
}
'```' | Add-Content $out
"" | Add-Content $out

# 6. visuals.py
"## 6. visuals.py (mapper raw->canonical)" | Add-Content $out
$vpath = "packages\pbix-parser\src\pbix_parser\visuals.py"
if (Test-Path $vpath) {
  '```python' | Add-Content $out
  Get-Content $vpath | Add-Content $out
  '```' | Add-Content $out
} else {
  "NOT FOUND: $vpath" | Add-Content $out
}
"" | Add-Content $out

# 7. schema.py
"## 7. schema.py (PbixIR Pydantic)" | Add-Content $out
$spath = "packages\pbix-parser\src\pbix_parser\schema.py"
if (Test-Path $spath) {
  '```python' | Add-Content $out
  Get-Content $spath | Add-Content $out
  '```' | Add-Content $out
} else {
  "NOT FOUND: $spath" | Add-Content $out
}
"" | Add-Content $out

# 8. ReportCanvas
"## 8. ReportCanvas.tsx" | Add-Content $out
$rpath = "packages\pbix-web-app\src\components\layout\ReportCanvas.tsx"
if (Test-Path $rpath) {
  '```tsx' | Add-Content $out
  Get-Content $rpath | Add-Content $out
  '```' | Add-Content $out
} else {
  "NOT FOUND: $rpath" | Add-Content $out
}
"" | Add-Content $out

# 9. KpiCard
"## 9. KpiCard.tsx" | Add-Content $out
$kpath = "packages\pbix-web-app\src\components\visuals\KpiCard.tsx"
if (Test-Path $kpath) {
  '```tsx' | Add-Content $out
  Get-Content $kpath | Add-Content $out
  '```' | Add-Content $out
} else {
  "NOT FOUND: $kpath" | Add-Content $out
}
"" | Add-Content $out

# 10. DataTable
"## 10. DataTableVisual.tsx" | Add-Content $out
$tpath = "packages\pbix-web-app\src\components\visuals\DataTableVisual.tsx"
if (Test-Path $tpath) {
  '```tsx' | Add-Content $out
  Get-Content $tpath | Add-Content $out
  '```' | Add-Content $out
} else {
  "NOT FOUND: $tpath" | Add-Content $out
}
"" | Add-Content $out

# 11. Slicer + FilterContext
"## 11. SlicerVisual.tsx + FilterContext.tsx" | Add-Content $out
foreach ($f in @("packages\pbix-web-app\src\components\visuals\SlicerVisual.tsx",
                 "packages\pbix-web-app\src\components\layout\FilterContext.tsx")) {
  if (Test-Path $f) {
    "### $f" | Add-Content $out
    '```tsx' | Add-Content $out
    Get-Content $f | Add-Content $out
    '```' | Add-Content $out
  }
}
"" | Add-Content $out

# 12. Build status
"## 12. pnpm build status" | Add-Content $out
'```' | Add-Content $out
if (Test-Path "packages\pbix-web-app\package.json") {
  Push-Location packages\pbix-web-app
  pnpm build 2>&1 | Select-Object -Last 30 | Add-Content $out
  Pop-Location
} else {
  "pbix-web-app not found" | Add-Content $out
}
'```' | Add-Content $out
"" | Add-Content $out

# 13. Test status
"## 13. pytest status" | Add-Content $out
'```' | Add-Content $out
if (Test-Path "packages\pbix-parser") {
  Push-Location packages\pbix-parser
  pytest -v --tb=short 2>&1 | Select-Object -Last 40 | Add-Content $out
  Pop-Location
} else {
  "pbix-parser not found" | Add-Content $out
}
'```' | Add-Content $out
"" | Add-Content $out

$size = [math]::Round((Get-Item $out).Length / 1KB, 1)
Write-Host ""
Write-Host "Generated $out - $size KB" -ForegroundColor Green
Write-Host "Anexe esse arquivo ao prompt da Rodada B."
