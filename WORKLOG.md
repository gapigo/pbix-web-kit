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


