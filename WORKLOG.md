# Overnight Worklog — 2026-05-12

## Ambiente

- Python: 3.11.0
- Node: v24.12.0
- pnpm: 10.11.0 (installed during bootstrap)
- Git: 2.52.0.windows.1
- Tesseract: MISSING → validator will use Playwright + text comparison only
- OS: Windows 11 Pro (build 26200)
- Workspace: C:/Users/xgabr/workspace/pbi-test

---

## Phase 0 — Bootstrap (completed)

### O que foi feito:
- Git init + directory tree created
- CLAUDE.md placed at root
- pbix-parser package (pyproject.toml, __init__.py) installed in editable mode
- pbixray 0.7.0 installed and verified
- pbix-web-app scaffolded with Vite 8 + React + TypeScript 6
- Dependencies: recharts, lucide-react, clsx, tailwind-merge, tailwindcss v4, @tailwindcss/vite
- shadcn init skipped (Tailwind v4 compatibility issue); manually created ui/button, ui/card, ui/select components
- Tailwind v4 CSS with full shadcn theme tokens configured
- Regional Sales Sample.pbix downloaded and verified (1.14 MB, valid ZIP)
- pnpm build passes cleanly

### Blockers:
- Tesseract not available → validator will use Playwright-only approach
- shadcn init fails on Tailwind v4 path resolution → manual component creation works


## Phase 1 — Spike Exploration (completed)

### Resumo do Sample "Regional Sales Sample.pbix":
- **11 páginas**, sendo "Sales Overview" a mais rica (99 visuais)
- **9 tabelas**: Accounts (300), Campaigns (12), Contacts (1), Industries (45), Opportunities (20K), Opportunity Forecast Adjustment (11), Owners (20), Products (9), Territories (51)
- **20K linhas** em Opportunities (tabela fato principal)
- **15 medidas DAX**, **5 colunas DAX**, 8 relações ativas M:1
- **22 tipos únicos de visual** — cobertura principal: kpi, barChart, columnChart, clusteredColumnChart, lineChart, tableEx, pivotTable, slicer, textbox, image, shape
- Custom visual FlowVisual detectado + mapa shapeMap
- Layout JSON (~6.3 MB) dumped to `samples/regional_sales/raw_layout.json`
- Tema: `Report/StaticResources/SharedResources/BaseThemes/CY21SU04.json`
- Dados todos internos (CSV no DataModel), sem fontes externas
- Sem RLS, sem parâmetros M complexos
- Canvas: 1280x720

### Tipos de visual a priorizar (⭐ core):
- kpi, barChart, columnChart, clusteredColumnChart, lineChart, tableEx, pivotTable, slicer, textbox, image, shape → cobertura total na página "Sales Overview"


## Phase 3 — Visual Components (completed)

### O que foi feito:
- Created 8 React visual components (KpiCard, BarChart, LineChart, PieChart, DataTable, Slicer, Unsupported, VisualRegistry)
- Created ReportCanvas with absolute positioning (1280x720 canvas, scaled via CSS transform)
- Created FilterContext (React Context for cross-filter)
- Created dataResolver with fuzzy table/column matching for chart fallback
- App.tsx with page tabs, lazy data loading, sanitized file names
- Pulled in shadcn Card, Button, Select components (manual — Tailwind v4 compat)
- pnpm build passes clean

### Results:
- Page navigation works (11 pages)
- KPIs render computed values (26.4M Revenue Won, 77.3M Rev Goal, 77.3M Revenue In Pipeline)
- Data tables render with sortable columns and aggregation
- Slicers render checkbox UI
- Charts show data for raw columns; computed DAX measures need per-category pre-computation
- Screenshot saved: samples/regional_sales/web_render.png

## Phase 4 — Validator (completed)

### O que foi feito:
- Created pbix-validator package with Playwright screenshot + compare modules
- CLI: `pbix-validator check --ir ir.json --url http://localhost:5173`
- Validator takes screenshot and validates against IR expectations
- Tesseract not available → OCR-validation skipped

## Phase 5 — Polish + Docs (completed)

### O que foi feito:
- README.md root + package READMEs for all 3 packages
- docs/IR_SCHEMA.md — full PbixIR schema reference
- docs/HOW_TO_ADD_A_VISUAL.md — guide for extending visual support
- scripts/00_bootstrap.sh, 01_extract.sh, 02_run_web.sh, 03_validate.sh
- .github/workflows/ci.yml stub
- HANDOFF.md with full status report
- WORKLOG.md updated throughout


