# 🔍 STATE DUMP — Rode antes de soltar a Rodada B

Cole este script inteiro num arquivo `dump_state.ps1` na raiz do repo (`C:\Users\xgabr\workspace\pbi-test\`) e execute:

```powershell
cd C:\Users\xgabr\workspace\pbi-test
pwsh dump_state.ps1
```

Vai gerar `STATE_DUMP.md` — esse arquivo VAI SER ANEXADO ao prompt da Rodada B como contexto. O agente lê e sabe exatamente o estado de partida.

---

## dump_state.ps1

```powershell
$ErrorActionPreference = "Continue"
$out = "STATE_DUMP.md"

# Header
"# STATE DUMP — $(Get-Date -Format 'yyyy-MM-dd HH:mm')" | Set-Content $out
"" | Add-Content $out
"Snapshot do repo antes da Rodada B. Esta é a verdade de partida." | Add-Content $out
"" | Add-Content $out

# 1. Git log
"## 1. Git log" | Add-Content $out
'```' | Add-Content $out
git log --oneline --stat 2>&1 | Add-Content $out
'```' | Add-Content $out
"" | Add-Content $out

# 2. Estrutura de arquivos (depth 4)
"## 2. Estrutura do repo (top 200 paths)" | Add-Content $out
'```' | Add-Content $out
Get-ChildItem -Recurse -File `
  | Where-Object { $_.FullName -notlike "*node_modules*" `
                   -and $_.FullName -notlike "*\.git\*" `
                   -and $_.FullName -notlike "*__pycache__*" `
                   -and $_.FullName -notlike "*\.venv*" `
                   -and $_.FullName -notlike "*dist*" } `
  | Select-Object -First 200 -ExpandProperty FullName `
  | ForEach-Object { $_.Replace((Get-Location).Path + "\", "") } `
  | Add-Content $out
'```' | Add-Content $out
"" | Add-Content $out

# 3. HANDOFF + WORKLOG (se existem)
foreach ($f in @("HANDOFF.md", "WORKLOG.md", "README.md", "CLAUDE.md")) {
  if (Test-Path $f) {
    "## 3. $f" | Add-Content $out
    '```markdown' | Add-Content $out
    Get-Content $f | Add-Content $out
    '```' | Add-Content $out
    "" | Add-Content $out
  }
}

# 4. IR analysis (Python inline)
"## 4. Análise do IR.json" | Add-Content $out
'```' | Add-Content $out
$irPath = "samples\regional_sales\ir\ir.json"
if (Test-Path $irPath) {
  python -c @"
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
"@ 2>&1 | Add-Content $out
} else {
  "IR.json NOT FOUND at $irPath" | Add-Content $out
}
'```' | Add-Content $out
"" | Add-Content $out

# 5. Data files (tamanhos)
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

# 6. Visuals.py (mapper canônico) — o arquivo mais crítico
"## 6. visuals.py (mapper raw→canonical)" | Add-Content $out
$vpath = "packages\pbix-parser\src\pbix_parser\visuals.py"
if (Test-Path $vpath) {
  '```python' | Add-Content $out
  Get-Content $vpath | Add-Content $out
  '```' | Add-Content $out
} else {
  "NOT FOUND: $vpath" | Add-Content $out
}
"" | Add-Content $out

# 7. Schema.py
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

# 8. ReportCanvas (layout que está cramped)
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

# 9. KpiCard (pra ver se números vêm hardcoded ou agregados)
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

# 10. DataTable (tabelas estão com zeros)
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

# 11. SlicerVisual (slicer não filtra)
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
Push-Location packages\pbix-web-app
pnpm build 2>&1 | Select-Object -Last 30 | Add-Content $out
Pop-Location
'```' | Add-Content $out
"" | Add-Content $out

# 13. Test status
"## 13. pytest status" | Add-Content $out
'```' | Add-Content $out
Push-Location packages\pbix-parser
pytest -v --tb=short 2>&1 | Select-Object -Last 40 | Add-Content $out
Pop-Location
'```' | Add-Content $out
"" | Add-Content $out

Write-Host "✅ Generated $out — $(((Get-Item $out).Length)/1KB) KB"
Write-Host "Anexe esse arquivo ao prompt da Rodada B."
```

## O que esse dump te dá

Quando você abrir `STATE_DUMP.md` (uns 30-80 KB), vai ter:
- Git log completo
- Estrutura de arquivos
- HANDOFF, WORKLOG, README, CLAUDE.md atuais
- **Contagem de visuais por tipo canônico vs raw_type** (vai mostrar quanto `unsupported` tem)
- Sample de medidas DAX
- Os 4-6 arquivos críticos que estão com bug (visuals.py, schema.py, ReportCanvas, KpiCard, DataTable, SlicerVisual+FilterContext)
- Status de build e tests

Anexa ele junto com o prompt da Rodada B. O agente lê primeiro, depois ataca.

Se o dump ficar >100 KB, recorte manualmente as seções 1, 4, 6, 7, 8, 9, 10, 11 — essas são as essenciais.
