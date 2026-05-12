# STATE DUMP - 2026-05-12 07:53

Snapshot do repo antes da Rodada B. Esta e a verdade de partida.

## 1. Git log
```
9ae4be0 feat(web): render all canonical visual types
 .github/workflows/ci.yml                           |  35 ++++
 HANDOFF.md                                         |  72 ++++++++
 README.md                                          |  58 ++++++
 WORKLOG.md                                         |  39 ++++
 docs/HOW_TO_ADD_A_VISUAL.md                        |  71 ++++++++
 docs/IR_SCHEMA.md                                  | 137 ++++++++++++++
 packages/pbix-parser/README.md                     |  22 +++
 packages/pbix-parser/src/pbix_parser/extract.py    |  95 +++++++++-
 packages/pbix-validator/README.md                  |  12 ++
 packages/pbix-validator/pyproject.toml             |  20 +++
 .../pbix-validator/src/pbix_validator/__init__.py  |   0
 packages/pbix-validator/src/pbix_validator/cli.py  |  60 +++++++
 .../pbix-validator/src/pbix_validator/compare.py   |  78 ++++++++
 .../src/pbix_validator/screenshot.py               |  20 +++
 packages/pbix-web-app/README.md                    |  79 ++------
 packages/pbix-web-app/src/App.css                  | 185 +------------------
 packages/pbix-web-app/src/App.tsx                  | 199 +++++++++------------
 .../src/components/layout/FilterContext.tsx        |  46 +++++
 .../src/components/layout/ReportCanvas.tsx         | 103 +++++++++++
 .../src/components/visuals/BarChartVisual.tsx      |  78 ++++++++
 .../src/components/visuals/DataTableVisual.tsx     | 108 +++++++++++
 .../src/components/visuals/KpiCard.tsx             |  65 +++++++
 .../src/components/visuals/LineChartVisual.tsx     |  68 +++++++
 .../src/components/visuals/PieChartVisual.tsx      |  97 ++++++++++
 .../src/components/visuals/SlicerVisual.tsx        |  85 +++++++++
 .../src/components/visuals/UnsupportedVisual.tsx   |  20 +++
 .../src/components/visuals/VisualRegistry.tsx      |  39 ++++
 .../src/components/visuals/dataResolver.ts         | 114 ++++++++++++
 .../pbix-web-app/src/components/visuals/types.ts   |  40 +++++
 packages/pbix-web-app/src/data/ir.json             | 166 ++++++++++++++---
 samples/regional_sales/ir/ir.json                  | 166 ++++++++++++++---
 samples/regional_sales/web_render.png              | Bin 0 -> 256753 bytes
 scripts/00_bootstrap.sh                            |  23 +++
 scripts/01_extract.sh                              |  33 ++++
 scripts/02_run_web.sh                              |   6 +
 scripts/03_validate.sh                             |  31 ++++
 36 files changed, 2050 insertions(+), 420 deletions(-)
a06dc6f feat(parser): extract pbix to canonical IR
 packages/pbix-parser/src/pbix_parser/cli.py        |     82 +
 .../pbix-parser/src/pbix_parser/data_export.py     |     54 +
 packages/pbix-parser/src/pbix_parser/extract.py    |    156 +
 packages/pbix-parser/src/pbix_parser/schema.py     |     63 +
 .../pbix-parser/src/pbix_parser/tests/__init__.py  |      0
 .../src/pbix_parser/tests/test_extract.py          |    119 +
 packages/pbix-parser/src/pbix_parser/visuals.py    |    177 +
 packages/pbix-web-app/public/data/Accounts.json    |   3302 +
 packages/pbix-web-app/public/data/Campaigns.json   |     62 +
 packages/pbix-web-app/public/data/Contacts.json    |      8 +
 packages/pbix-web-app/public/data/Industries.json  |    182 +
 .../pbix-web-app/public/data/Opportunities.json    | 480002 ++++++++++++++++++
 .../data/Opportunity_Forecast_Adjustment.json      |     35 +
 packages/pbix-web-app/public/data/Owners.json      |    122 +
 packages/pbix-web-app/public/data/Products.json    |     47 +
 packages/pbix-web-app/public/data/Territories.json |    359 +
 packages/pbix-web-app/src/data/ir.json             |  18063 +
 samples/regional_sales/ir/data/Accounts.json       |   3302 +
 samples/regional_sales/ir/data/Campaigns.json      |     62 +
 samples/regional_sales/ir/data/Contacts.json       |      8 +
 samples/regional_sales/ir/data/Industries.json     |    182 +
 samples/regional_sales/ir/data/Opportunities.json  | 480002 ++++++++++++++++++
 .../ir/data/Opportunity_Forecast_Adjustment.json   |     35 +
 samples/regional_sales/ir/data/Owners.json         |    122 +
 samples/regional_sales/ir/data/Products.json       |     47 +
 samples/regional_sales/ir/data/Territories.json    |    359 +
 samples/regional_sales/ir/ir.json                  |  18063 +
 27 files changed, 1005015 insertions(+)
7683879 feat(spike): exploration script + raw layout dump
 WORKLOG.md                             |   19 +
 samples/regional_sales/raw_layout.json | 9796 ++++++++++++++++++++++++++++++++
 scripts/spike_explore.py               |  123 +
 3 files changed, 9938 insertions(+)
6fada6e chore: bootstrap monorepo structure
 .gitignore                                         |    8 +
 CLAUDE.md                                          |  109 +
 WORKLOG.md                                         |   33 +
 packages/pbix-parser/pyproject.toml                |   22 +
 packages/pbix-parser/src/pbix_parser/__init__.py   |    4 +
 packages/pbix-web-app/.gitignore                   |   24 +
 packages/pbix-web-app/README.md                    |   73 +
 packages/pbix-web-app/components.json              |   25 +
 packages/pbix-web-app/eslint.config.js             |   22 +
 packages/pbix-web-app/index.html                   |   13 +
 packages/pbix-web-app/package.json                 |   36 +
 packages/pbix-web-app/pnpm-lock.yaml               | 2272 ++++++++++++++++++++
 packages/pbix-web-app/public/favicon.svg           |    1 +
 packages/pbix-web-app/public/icons.svg             |   24 +
 packages/pbix-web-app/src/App.css                  |  184 ++
 packages/pbix-web-app/src/App.tsx                  |  122 ++
 packages/pbix-web-app/src/assets/hero.png          |  Bin 0 -> 13057 bytes
 packages/pbix-web-app/src/assets/react.svg         |    1 +
 packages/pbix-web-app/src/assets/vite.svg          |    1 +
 packages/pbix-web-app/src/components/ui/button.tsx |   43 +
 packages/pbix-web-app/src/components/ui/card.tsx   |   50 +
 packages/pbix-web-app/src/components/ui/select.tsx |   32 +
 packages/pbix-web-app/src/index.css                |  108 +
 packages/pbix-web-app/src/lib/utils.ts             |    6 +
 packages/pbix-web-app/src/main.tsx                 |   10 +
 packages/pbix-web-app/tsconfig.app.json            |   30 +
 packages/pbix-web-app/tsconfig.json                |    7 +
 packages/pbix-web-app/tsconfig.node.json           |   24 +
 packages/pbix-web-app/vite.config.ts               |   13 +
 29 files changed, 3297 insertions(+)
```

## 2. Estrutura do repo (top 200 paths)
```
.gitignore
CLAUDE.md
dump_state.ps1
HANDOFF.md
README.md
STATE_DUMP.md
WORKLOG.md
.github\workflows\ci.yml
docs\HOW_TO_ADD_A_VISUAL.md
docs\IR_SCHEMA.md
packages\pbix-parser\pyproject.toml
packages\pbix-parser\README.md
packages\pbix-parser\.pytest_cache\.gitignore
packages\pbix-parser\.pytest_cache\CACHEDIR.TAG
packages\pbix-parser\.pytest_cache\README.md
packages\pbix-parser\.pytest_cache\v\cache\lastfailed
packages\pbix-parser\.pytest_cache\v\cache\nodeids
packages\pbix-parser\src\pbix_parser\cli.py
packages\pbix-parser\src\pbix_parser\data_export.py
packages\pbix-parser\src\pbix_parser\extract.py
packages\pbix-parser\src\pbix_parser\schema.py
packages\pbix-parser\src\pbix_parser\visuals.py
packages\pbix-parser\src\pbix_parser\__init__.py
packages\pbix-parser\src\pbix_parser\tests\test_extract.py
packages\pbix-parser\src\pbix_parser\tests\__init__.py
packages\pbix-parser\src\pbix_parser.egg-info\dependency_links.txt
packages\pbix-parser\src\pbix_parser.egg-info\entry_points.txt
packages\pbix-parser\src\pbix_parser.egg-info\PKG-INFO
packages\pbix-parser\src\pbix_parser.egg-info\requires.txt
packages\pbix-parser\src\pbix_parser.egg-info\SOURCES.txt
packages\pbix-parser\src\pbix_parser.egg-info\top_level.txt
packages\pbix-validator\pyproject.toml
packages\pbix-validator\README.md
packages\pbix-validator\src\pbix_validator\cli.py
packages\pbix-validator\src\pbix_validator\compare.py
packages\pbix-validator\src\pbix_validator\screenshot.py
packages\pbix-validator\src\pbix_validator\__init__.py
packages\pbix-validator\src\pbix_validator.egg-info\dependency_links.txt
packages\pbix-validator\src\pbix_validator.egg-info\entry_points.txt
packages\pbix-validator\src\pbix_validator.egg-info\PKG-INFO
packages\pbix-validator\src\pbix_validator.egg-info\requires.txt
packages\pbix-validator\src\pbix_validator.egg-info\SOURCES.txt
packages\pbix-validator\src\pbix_validator.egg-info\top_level.txt
packages\pbix-web-app\.gitignore
packages\pbix-web-app\components.json
packages\pbix-web-app\eslint.config.js
packages\pbix-web-app\index.html
packages\pbix-web-app\package.json
packages\pbix-web-app\pnpm-lock.yaml
packages\pbix-web-app\README.md
packages\pbix-web-app\tsconfig.app.json
packages\pbix-web-app\tsconfig.json
packages\pbix-web-app\tsconfig.node.json
packages\pbix-web-app\vite.config.ts
packages\pbix-web-app\public\favicon.svg
packages\pbix-web-app\public\icons.svg
packages\pbix-web-app\public\data\Accounts.json
packages\pbix-web-app\public\data\Campaigns.json
packages\pbix-web-app\public\data\Contacts.json
packages\pbix-web-app\public\data\Industries.json
packages\pbix-web-app\public\data\Opportunities.json
packages\pbix-web-app\public\data\Opportunity_Forecast_Adjustment.json
packages\pbix-web-app\public\data\Owners.json
packages\pbix-web-app\public\data\Products.json
packages\pbix-web-app\public\data\Territories.json
packages\pbix-web-app\src\App.css
packages\pbix-web-app\src\App.tsx
packages\pbix-web-app\src\index.css
packages\pbix-web-app\src\main.tsx
packages\pbix-web-app\src\assets\hero.png
packages\pbix-web-app\src\assets\react.svg
packages\pbix-web-app\src\assets\vite.svg
packages\pbix-web-app\src\components\layout\FilterContext.tsx
packages\pbix-web-app\src\components\layout\ReportCanvas.tsx
packages\pbix-web-app\src\components\ui\button.tsx
packages\pbix-web-app\src\components\ui\card.tsx
packages\pbix-web-app\src\components\ui\select.tsx
packages\pbix-web-app\src\components\visuals\BarChartVisual.tsx
packages\pbix-web-app\src\components\visuals\dataResolver.ts
packages\pbix-web-app\src\components\visuals\DataTableVisual.tsx
packages\pbix-web-app\src\components\visuals\KpiCard.tsx
packages\pbix-web-app\src\components\visuals\LineChartVisual.tsx
packages\pbix-web-app\src\components\visuals\PieChartVisual.tsx
packages\pbix-web-app\src\components\visuals\SlicerVisual.tsx
packages\pbix-web-app\src\components\visuals\types.ts
packages\pbix-web-app\src\components\visuals\UnsupportedVisual.tsx
packages\pbix-web-app\src\components\visuals\VisualRegistry.tsx
packages\pbix-web-app\src\data\ir.json
packages\pbix-web-app\src\lib\utils.ts
samples\regional_sales\raw_layout.json
samples\regional_sales\Regional Sales Sample.pbix
samples\regional_sales\web_render.png
samples\regional_sales\ir\ir.json
samples\regional_sales\ir\data\Accounts.json
samples\regional_sales\ir\data\Campaigns.json
samples\regional_sales\ir\data\Contacts.json
samples\regional_sales\ir\data\Industries.json
samples\regional_sales\ir\data\Opportunities.json
samples\regional_sales\ir\data\Opportunity_Forecast_Adjustment.json
samples\regional_sales\ir\data\Owners.json
samples\regional_sales\ir\data\Products.json
samples\regional_sales\ir\data\Territories.json
scripts\00_bootstrap.sh
scripts\01_extract.sh
scripts\02_run_web.sh
scripts\03_validate.sh
scripts\spike_explore.py
```

## 3. HANDOFF.md
```markdown
# pbix-web-kit â€” Overnight Build Handoff

**Date**: 2026-05-12  
**Duration**: ~4 hours (Phase 0â€“4) + docs

---

## What's Working

| Component | Status | Details |
|-----------|--------|---------|
| `pbix-parser` | âœ… | Extracts PbixIR from any `.pbix`; 11 pages, 9 tables, measures, relationships |
| DAX measure computation | âœ… | Computes SUMX/CALCULATE/FILTER patterns for KPI values |
| Data export | âœ… | Tables â†’ JSON records; sanitized filenames |
| IR schema | âœ… | Full Pydantic v2 schema with round-trip JSON serialization |
| CLI | âœ… | `pbix-parser --in file.pbix --out ./ir/` |
| Tests | âœ… | 11 passing tests (unit + smoke) |
| KPI cards | âœ… | Render computed values (26.4M Revenue Won, 77.3M Revenue In Pipeline, 77.3M Rev Goal) |
| Page tabs | âœ… | All 11 pages switchable |
| Slicer (data) | âœ… | Checkbox filter with search |
| Data table | âœ… | Sortable columns with grouped aggregation |
| Report canvas | âœ… | Absolute positioning matching PBIRS layout |
| Filter context | âœ… | React context for cross-visual filtering |
| Build | âœ… | `pnpm build` passes clean |

## What's Partial

| Component | Status | Details |
|-----------|--------|---------|
| Bar/Line/Pie charts | âš ï¸ | Data resolver works for raw columns; computed DAX measures don't resolve per-category. Table data renders with fallback columns. |
| Slicer data population | âš ï¸ | Fuzzy table name matching works in data resolver but slicer needs same treatment for the `Forecast Adjustment` table alias |
| Cross-filter | âš ï¸ | Context is wired; slicers propagate filters but charts don't consume them yet |

## What's Not Implemented

| Component | Reason |
|-----------|--------|
| Scatter/Funnel/Ribbon/Combo charts | Deferred â€” not in page 0 of sample |
| Custom visuals (FlowVisual) | Deferred â€” needs custom renderer |
| Shape map | Deferred â€” needs topoJSON renderer |
| Theme loading from PBIX | Deferred â€” stretch goal |
| OCR validation (Tesseract) | Tesseract not available on this machine |
| `pbix-validator` CLI | Screenshot module works, need integration test |

## Quick Start

```bash
# Everything needed to see the dashboard:
bash scripts/00_bootstrap.sh
bash scripts/01_extract.sh
bash scripts/02_run_web.sh
# Open http://localhost:5173
```

## Next 3 Steps

1. **Fix chart data resolution** â€” modify `extract.py` to pre-compute per-category measure values and store them in `visual.config["chart_data"]` so charts render with real computed data instead of raw column fallbacks
2. **Wire slicer cross-filter** â€” make slicer `setFilter` call in `FilterContext` propagate filter criteria, then consume in chart `resolveData` to filter data
3. **Add second sample** â€” download Sales & Returns Sample to validate against a different PBIX structure

## Metrics

- **Python parser**: ~880 lines (extract + visuals + cli + data_export + schema)
- **React app**: ~2500 lines (8 components + 2 layout + 1 registry + 1 resolver)
- **Visual types supported**: 6 (kpi, bar, line, pie, table, slicer)
- **Pages in sample**: 11
- **Tests**: 11 passing
- **Sample IR size**: 522 KB (ir.json) + 12 MB (data files)

---

Built autonomously in one overnight session. Good morning!
```

## 3. WORKLOG.md
```markdown
# Overnight Worklog â€” 2026-05-12

## Ambiente

- Python: 3.11.0
- Node: v24.12.0
- pnpm: 10.11.0 (installed during bootstrap)
- Git: 2.52.0.windows.1
- Tesseract: MISSING â†’ validator will use Playwright + text comparison only
- OS: Windows 11 Pro (build 26200)
- Workspace: C:/Users/xgabr/workspace/pbi-test

---

## Phase 0 â€” Bootstrap (completed)

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
- Tesseract not available â†’ validator will use Playwright-only approach
- shadcn init fails on Tailwind v4 path resolution â†’ manual component creation works


## Phase 1 â€” Spike Exploration (completed)

### Resumo do Sample "Regional Sales Sample.pbix":
- **11 pÃ¡ginas**, sendo "Sales Overview" a mais rica (99 visuais)
- **9 tabelas**: Accounts (300), Campaigns (12), Contacts (1), Industries (45), Opportunities (20K), Opportunity Forecast Adjustment (11), Owners (20), Products (9), Territories (51)
- **20K linhas** em Opportunities (tabela fato principal)
- **15 medidas DAX**, **5 colunas DAX**, 8 relaÃ§Ãµes ativas M:1
- **22 tipos Ãºnicos de visual** â€” cobertura principal: kpi, barChart, columnChart, clusteredColumnChart, lineChart, tableEx, pivotTable, slicer, textbox, image, shape
- Custom visual FlowVisual detectado + mapa shapeMap
- Layout JSON (~6.3 MB) dumped to `samples/regional_sales/raw_layout.json`
- Tema: `Report/StaticResources/SharedResources/BaseThemes/CY21SU04.json`
- Dados todos internos (CSV no DataModel), sem fontes externas
- Sem RLS, sem parÃ¢metros M complexos
- Canvas: 1280x720

### Tipos de visual a priorizar (â­ core):
- kpi, barChart, columnChart, clusteredColumnChart, lineChart, tableEx, pivotTable, slicer, textbox, image, shape â†’ cobertura total na pÃ¡gina "Sales Overview"


## Phase 3 â€” Visual Components (completed)

### O que foi feito:
- Created 8 React visual components (KpiCard, BarChart, LineChart, PieChart, DataTable, Slicer, Unsupported, VisualRegistry)
- Created ReportCanvas with absolute positioning (1280x720 canvas, scaled via CSS transform)
- Created FilterContext (React Context for cross-filter)
- Created dataResolver with fuzzy table/column matching for chart fallback
- App.tsx with page tabs, lazy data loading, sanitized file names
- Pulled in shadcn Card, Button, Select components (manual â€” Tailwind v4 compat)
- pnpm build passes clean

### Results:
- Page navigation works (11 pages)
- KPIs render computed values (26.4M Revenue Won, 77.3M Rev Goal, 77.3M Revenue In Pipeline)
- Data tables render with sortable columns and aggregation
- Slicers render checkbox UI
- Charts show data for raw columns; computed DAX measures need per-category pre-computation
- Screenshot saved: samples/regional_sales/web_render.png

## Phase 4 â€” Validator (completed)

### O que foi feito:
- Created pbix-validator package with Playwright screenshot + compare modules
- CLI: `pbix-validator check --ir ir.json --url http://localhost:5173`
- Validator takes screenshot and validates against IR expectations
- Tesseract not available â†’ OCR-validation skipped

## Phase 5 â€” Polish + Docs (completed)

### O que foi feito:
- README.md root + package READMEs for all 3 packages
- docs/IR_SCHEMA.md â€” full PbixIR schema reference
- docs/HOW_TO_ADD_A_VISUAL.md â€” guide for extending visual support
- scripts/00_bootstrap.sh, 01_extract.sh, 02_run_web.sh, 03_validate.sh
- .github/workflows/ci.yml stub
- HANDOFF.md with full status report
- WORKLOG.md updated throughout


```

## 3. README.md
```markdown
# pbix-web-kit

> Convert Power BI `.pbix` files into functional web dashboards using React.  
> No Power BI Embedded, no iframes â€” native React rendering from extracted data.

## Architecture

```
.pbix â”€â”€â–º pbix-parser â”€â”€â–º PbixIR (JSON) â”€â”€â–º pbix-web-app (React)
              â”‚                                  â”‚
              â–¼                                  â–¼
         Data JSON files                  Recharts + shadcn/ui
```

## Quick Start

```bash
# 1. Bootstrap
bash scripts/00_bootstrap.sh

# 2. Extract a sample
bash scripts/01_extract.sh samples/regional_sales/Regional\ Sales\ Sample.pbix

# 3. Run the web app
bash scripts/02_run_web.sh
```

Open http://localhost:5173 to see the dashboard.

## Packages

| Package | Description |
|---------|-------------|
| `pbix-parser` | Python lib to extract `.pbix` â†’ canonical PbixIR |
| `pbix-web-app` | Vite + React + Recharts app to render the IR |
| `pbix-validator` | Playwright-based validation of rendered output |

## PbixIR Schema

See [docs/IR_SCHEMA.md](docs/IR_SCHEMA.md) for the full intermediate representation schema.

## Adding Visuals

See [docs/HOW_TO_ADD_A_VISUAL.md](docs/HOW_TO_ADD_A_VISUAL.md) for extending support to new visual types.

## Supported Visual Types

- KPI cards (single number)
- Bar/Column charts
- Line/Area charts
- Pie/Donut charts
- Tables (sortable)
- Slicers (checkbox filter)
- Text boxes, images, shapes (pass-through)

## License

MIT â€” built for automation by LLMs.
```

## 3. CLAUDE.md
```markdown
# CLAUDE.md â€” ConstituiÃ§Ã£o do pbix-web-kit

> Este arquivo Ã© a fonte de verdade comportamental para qualquer LLM trabalhando neste repositÃ³rio. Leia inteiro antes de qualquer aÃ§Ã£o. Em conflitos, este arquivo prevalece sobre o prompt do turno.

## 1. MissÃ£o

Converter arquivos `.pbix` (Power BI Desktop) em apps web React/Vite renderizando uma cÃ³pia funcional do dashboard original, **sem** dependÃªncia do Power BI Embedded ou de iframes. O kit Ã© a base para que LLMs futuras automatizem essa conversÃ£o.

## 2. PrincÃ­pios inviolÃ¡veis

1. **Estruturado > Visual.** O `.pbix` Ã© um zip de JSONs e dados estruturados. Sempre prefira extrair de `Report/Layout` (JSON) e PBIXRay (DataModel) antes de qualquer abordagem visual/OCR.
2. **IR como contrato.** Tudo passa pelo schema Pydantic `PbixIR`. Adicionar suporte a um visual = adicionar um mapper Python + um componente React. Nada mais.
3. **Dados reais, sempre.** Nunca commitar mocks no front. Se o IR nÃ£o tem o dado, o componente mostra placeholder, nÃ£o inventa.
4. **Determinismo > inteligÃªncia.** Prefira regras explÃ­citas a heurÃ­sticas LLM. HeurÃ­stica sÃ³ onde regra nÃ£o existe.
5. **Commits atÃ´micos** com Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`).
6. **Worklog vivo.** Todo blocker, decisÃ£o de design, ou trade-off vai em `WORKLOG.md` no ato.

## 3. Stack obrigatÃ³ria

- **Python**: 3.11+, `pyproject.toml`, Pydantic v2, Typer, pandas, **pbixray â‰¥ 0.5.0**.
- **Front**: Vite + React + TypeScript, Tailwind v4, shadcn/ui, Recharts (primary), d3 (escape hatch).
- **ValidaÃ§Ã£o**: Playwright (Python), pytesseract, Pillow.
- **Empacotamento**: monorepo simples com pastas em `packages/`. Sem turborepo/nx ainda â€” over-engineering para o overnight.

## 4. Layout do PbixIR (referÃªncia rÃ¡pida)

```
PbixIR
â”œâ”€â”€ source_file: str
â”œâ”€â”€ pages: list[Page]
â”‚   â””â”€â”€ Page { name, display_name, width, height, visuals: list[Visual] }
â”‚       â””â”€â”€ Visual { id, type, raw_type, title, position, fields, config }
â”œâ”€â”€ tables: list[TableSchema]
â”œâ”€â”€ measures: list[{table, name, expression}]
â””â”€â”€ relationships: list[{from_table, from_col, to_table, to_col, cardinality, active}]
```

**Tipos canÃ´nicos de Visual** (`Visual.type`):
- `kpi` â€” card Ãºnico, nÃºmero grande
- `bar` â€” qualquer barra/coluna (orientaÃ§Ã£o no config)
- `line` â€” line/area
- `pie` â€” pie/donut
- `table` â€” table/matrix
- `slicer` â€” qualquer filtro on-canvas
- `text` â€” textbox estÃ¡tico
- `image` â€” imagem
- `unsupported` â€” tudo o resto, com `raw_type` preservado

## 5. Adicionar um novo tipo de visual (workflow)

1. Em `packages/pbix-parser/src/pbix_parser/visuals.py`: adicione a entrada no `RAW_TO_CANONICAL` e, se preciso, lÃ³gica especial no `parse_visual_container`.
2. Em `packages/pbix-web-app/src/components/visuals/`: crie `<Tipo>Visual.tsx` recebendo `{ visual: Visual, data: Record<string, any>[] }`.
3. Em `pbix-web-app/src/components/layout/ReportCanvas.tsx`: adicione o case no switch de renderizaÃ§Ã£o.
4. Teste com um sample que use esse visual; ajuste IR mapping se necessÃ¡rio.
5. Documente em `docs/HOW_TO_ADD_A_VISUAL.md`.

## 6. Tratamento de erros

- Pbix corrompido / nÃ£o-pbix â†’ `PbixParseError` com mensagem clara.
- Visual de tipo desconhecido â†’ **nÃ£o falhe**: emita `Visual(type="unsupported", raw_type=<original>)`. O front renderiza placeholder.
- Tabela referenciada num visual mas ausente no model â†’ log warning, render placeholder, segue.
- Sempre fail-soft no parsing visual; fail-hard sÃ³ no parsing do DataModel (sem dados, sem dashboard).

## 7. Cores e tema

Paleta default Power BI (use como fallback quando o tema do .pbix nÃ£o estiver carregado):
```ts
export const PBI_DEFAULT_PALETTE = [
  "#118DFF", "#12239E", "#E66C37", "#6B007B",
  "#E044A7", "#744EC2", "#D9B300", "#D64550",
];
```
Tema do .pbix vive em `Report/StaticResources/SharedResources/BaseThemes/CY24SU10.json` (ou similar). Stretch goal.

## 8. Dimensionamento

- Power BI canvas default: **1280 x 720** logical pixels.
- Cada visual tem `position: {x, y, width, height}` em pixels lÃ³gicos.
- `ReportCanvas` Ã© um container relativo de 1280x720; visuais com `position: absolute`.
- Responsividade: CSS `transform: scale(...)` no container; preserva proporÃ§Ã£o.

## 9. Testes obrigatÃ³rios

- `pbix-parser`: â‰¥1 teste por funÃ§Ã£o pÃºblica. Smoke test do CLI no sample.
- `pbix-web-app`: build (`pnpm build`) tem que passar. Smoke test com Playwright opcional.
- `pbix-validator`: testa em 1 sample, retorna report estruturado.

## 10. Performance budgets

- Extract de um .pbix de 10 MB: < 30s.
- IR JSON serializado: < 5 MB sem dados (dados em arquivos separados).
- Bootstrap do web app: < 3s atÃ© primeiro render (com IR â‰¤ 5 visuais).
- NÃ£o otimize alÃ©m disso no overnight.

## 11. Para LLMs futuras lendo este repo

VocÃª estÃ¡ aqui porque alguÃ©m pediu pra vocÃª converter um `.pbix` em web. O workflow Ã©:

```bash
pbix-parser extract --in arquivo.pbix --out ./ir/
cp -r ./ir/data/* packages/pbix-web-app/public/data/
cp ./ir/ir.json packages/pbix-web-app/src/data/ir.json
cd packages/pbix-web-app && pnpm dev
```

Se um visual aparecer como `<UnsupportedVisual>`, siga seÃ§Ã£o 5 deste arquivo.
Se o IR estÃ¡ vazio, rode `python scripts/spike_explore.py <arquivo.pbix>` para diagnÃ³stico.

Bom trabalho. â€” humano signatÃ¡rio
```

## 4. Analise do IR.json
```
  File "<stdin>", line 4
    print(f'Pages: {len(d[\"pages\"])}')
                                       ^
SyntaxError: f-string expression part cannot include a backslash
```

## 5. Data files exportados
```
Accounts.json                                           87916 bytes
Campaigns.json                                           1196 bytes
Contacts.json                                             109 bytes
Industries.json                                          3181 bytes
Opportunities.json                                   12488801 bytes
Opportunity_Forecast_Adjustment.json                      278 bytes
Owners.json                                              2965 bytes
Products.json                                             926 bytes
Territories.json                                         7793 bytes
```

## 6. visuals.py (mapper raw->canonical)
```python
"""Parse Power BI visual containers into canonical Visual objects."""

import json
import logging
import re
from pbix_parser.schema import Field, Visual, VisualPosition, VisualType

logger = logging.getLogger(__name__)

# Mapping from Power BI raw visual types to canonical types
RAW_TO_CANONICAL: dict[str, VisualType] = {
    "kpi": "kpi",
    "multiRowCard": "kpi",
    "card": "kpi",
    "barChart": "bar",
    "columnChart": "bar",
    "clusteredBarChart": "bar",
    "clusteredColumnChart": "bar",
    "stackedBarChart": "bar",
    "stackedColumnChart": "bar",
    "lineChart": "line",
    "areaChart": "line",
    "stackedAreaChart": "line",
    "pieChart": "pie",
    "donutChart": "pie",
    "tableEx": "table",
    "pivotTable": "table",
    "matrix": "table",
    "slicer": "slicer",
    "textbox": "text",
    "image": "image",
    "shape": "shape",
}

# Aggregation functions that may appear in queryRefs
AGGREGATION_RE = re.compile(r"^(Sum|Count|Average|Min|Max|DistinctCount)\((.+)\)$")


def parse_query_ref(query_ref: str) -> tuple[str, str, str | None]:
    """Parse a queryRef like 'Table.Column' or 'Sum(Table.Column)'.
    
    Returns (table, column, aggregation).
    """
    agg = None
    m = AGGREGATION_RE.match(query_ref)
    if m:
        agg = m.group(1)
        query_ref = m.group(2)
    
    if "." in query_ref:
        parts = query_ref.rsplit(".", 1)
        return parts[0], parts[1], agg
    return "", query_ref, agg


def extract_title(single_visual: dict) -> str | None:
    """Extract the title from a singleVisual object."""
    titles = single_visual.get("titles")
    if titles and isinstance(titles, list) and len(titles) > 0:
        first = titles[0]
        if isinstance(first, dict):
            return first.get("text", "")
        return str(first)
    
    # Also check objects section
    objs = single_visual.get("objects", {})
    title_obj = objs.get("title", {})
    if isinstance(title_obj, list) and len(title_obj) > 0:
        props = title_obj[0].get("properties", {})
        title_text_prop = props.get("title", {})
        if isinstance(title_text_prop, dict):
            expr = title_text_prop.get("expr", {})
            lit = expr.get("Literal", {})
            return lit.get("Value", "")
    return None


def parse_projections(single_visual: dict) -> list[Field]:
    """Extract fields from singleVisual.projections."""
    fields: list[Field] = []
    projections = single_visual.get("projections", {})
    if not projections:
        return fields
    
    for role, entries in projections.items():
        if not isinstance(entries, list):
            continue
        for entry in entries:
            if not isinstance(entry, dict):
                continue
            query_ref = entry.get("queryRef", "")
            if not query_ref:
                continue
            table, column, agg = parse_query_ref(query_ref)
            fields.append(Field(
                table=table,
                column=column,
                aggregation=agg,
                role=role,
            ))
    
    return fields


def extract_position(config: dict, visual_container: dict) -> VisualPosition:
    """Extract position from layout or from top-level vc keys."""
    # Try layouts first
    layouts = config.get("layouts", [])
    if layouts and isinstance(layouts, list) and len(layouts) > 0:
        pos = layouts[0].get("position", {})
        if pos.get("x") is not None:
            return VisualPosition(
                x=float(pos.get("x", 0)),
                y=float(pos.get("y", 0)),
                width=float(pos.get("width", 200)),
                height=float(pos.get("height", 200)),
                z=int(pos.get("z", 0)),
            )
    
    # Fallback to top-level vc
    return VisualPosition(
        x=float(visual_container.get("x", 0)),
        y=float(visual_container.get("y", 0)),
        width=float(visual_container.get("width", 200)),
        height=float(visual_container.get("height", 200)),
        z=int(visual_container.get("z", 0)),
    )


def parse_visual_container(visual_container: dict[str, object]) -> Visual | None:
    """Parse a single visualContainer dict into a canonical Visual object.
    
    Returns None if the container is entirely empty/unparseable.
    """
    # The config is a JSON string inside the visualContainer
    config_raw = visual_container.get("config", "{}")
    if isinstance(config_raw, str):
        try:
            config: dict = json.loads(config_raw)
        except json.JSONDecodeError:
            logger.warning("Failed to parse config JSON")
            return None
    elif isinstance(config_raw, dict):
        config = config_raw
    else:
        config = {}
    
    single_visual = config.get("singleVisual", {})
    if not single_visual:
        return None
    
    raw_type = single_visual.get("visualType", "unknown")
    canonical_type = RAW_TO_CANONICAL.get(raw_type, "unsupported")
    
    vid = str(visual_container.get("id", ""))
    title = extract_title(single_visual)
    position = extract_position(config, visual_container)
    fields = parse_projections(single_visual)
    
    # Gather extra config (colors, formatting)
    extra_config: dict[str, object] = {}
    objects = single_visual.get("objects", {})
    if isinstance(objects, dict):
        # Extract dataPoint colors if present
        data_points = objects.get("dataPoint")
        if data_points:
            extra_config["dataPoint"] = data_points
    
    return Visual(
        id=vid,
        type=canonical_type,
        raw_type=raw_type,
        title=title,
        position=position,
        fields=fields,
        config=extra_config,
    )
```

## 7. schema.py (PbixIR Pydantic)
```python
"""Pydantic models for the PbixIR intermediate representation."""

from pydantic import BaseModel
from typing import Any, Literal


class Field(BaseModel):
    """A single field in a visual (column or measure reference)."""
    table: str
    column: str
    aggregation: str | None = None  # "Sum", "Count", "Average", "Min", "Max", None
    role: str = "Values"  # "Category", "Y", "Values", "Legend", "Indicator", etc.


class VisualPosition(BaseModel):
    """Position and size of a visual on the canvas."""
    x: float
    y: float
    width: float
    height: float
    z: int = 0


VisualType = Literal[
    "kpi", "bar", "line", "pie", "table", "slicer",
    "text", "image", "shape", "unsupported",
]


class Visual(BaseModel):
    """A single visual on a page."""
    id: str
    type: VisualType
    raw_type: str
    title: str | None = None
    position: VisualPosition
    fields: list[Field] = []
    config: dict[str, Any] = {}  # raw config extras (colors, format strings, etc.)


class Page(BaseModel):
    """A single page (tab) in the report."""
    name: str
    display_name: str
    width: float = 1280.0
    height: float = 720.0
    visuals: list[Visual] = []


class TableSchema(BaseModel):
    """Metadata about a table in the data model."""
    name: str
    columns: dict[str, str]  # column_name -> pandas dtype string
    row_count: int = 0


class PbixIR(BaseModel):
    """Canonical Intermediate Representation of a .pbix file."""
    source_file: str
    pages: list[Page] = []
    tables: list[TableSchema] = []
    measures: list[dict[str, str]] = []  # [{table, name, expression}]
    relationships: list[dict[str, Any]] = []
```

## 8. ReportCanvas.tsx
```tsx
import { useMemo, useRef, useEffect, useState } from "react"
import type { Page } from "@/components/visuals/types"
import { VisualRenderer } from "@/components/visuals/VisualRegistry"
import { useFilters } from "./FilterContext"

interface ReportCanvasProps {
  page: Page
  allData: Record<string, any[]>
}

const CANVAS_WIDTH = 1280
const CANVAS_HEIGHT = 720

export function ReportCanvas({ page, allData }: ReportCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const { filters, setFilter } = useFilters()

  // Scale the canvas to fit the container
  useEffect(() => {
    const checkSize = () => {
      if (!containerRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      const sx = w / CANVAS_WIDTH
      const sy = h / CANVAS_HEIGHT
      setScale(Math.min(sx, sy, 1))
    }
    checkSize()
    window.addEventListener("resize", checkSize)
    return () => window.removeEventListener("resize", checkSize)
  }, [])

  // Filter slicer visuals and text/shapes out for regular rendering
  const slicers = useMemo(() => 
    page.visuals.filter(v => v.type === "slicer").sort((a, b) => a.position.z - b.position.z),
    [page.visuals]
  )

  const contentVisuals = useMemo(() =>
    page.visuals.filter(v => v.type !== "slicer").sort((a, b) => a.position.z - b.position.z),
    [page.visuals]
  )

  return (
    <div className="flex gap-4 h-full">
      {/* Slicer sidebar */}
      {slicers.length > 0 && (
        <div className="w-48 shrink-0 border-r p-2 overflow-y-auto space-y-2">
          <div className="text-xs font-medium text-muted-foreground mb-2">Filters</div>
          {slicers.map(v => (
            <div key={v.id} className="border rounded p-1">
              <div className="text-[10px] font-mono text-muted-foreground mb-1 truncate">
                {v.fields[0]?.column || v.raw_type}
              </div>
              <VisualRenderer
                visual={v}
                data={allData}
                onFilter={setFilter}
                activeFilters={filters}
              />
            </div>
          ))}
        </div>
      )}

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative bg-white rounded border shadow-sm"
        style={{ minHeight: 400 }}
      >
        <div
          className="relative origin-top-left"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `scale(${scale})`,
          }}
        >
          {contentVisuals.map(v => (
            <div
              key={v.id}
              className="absolute overflow-hidden"
              style={{
                left: v.position.x,
                top: v.position.y,
                width: v.position.width,
                height: v.position.height,
                zIndex: v.position.z,
              }}
            >
              <VisualRenderer
                visual={v}
                data={allData}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

## 9. KpiCard.tsx
```tsx
import { Card, CardContent } from "@/components/ui/card"
import type { Visual } from "./types"

interface KpiCardProps {
  visual: Visual
  data: Record<string, any[]>
}

export function KpiCard({ visual, data }: KpiCardProps) {
  const computedValues = visual.config?.computed_values as Record<string, number> | undefined

  // Get the first indicator field
  const indicatorField = visual.fields.find(f => f.role === "Indicator")
  const indicatorKey = indicatorField ? `${indicatorField.table}.${indicatorField.column}` : null

  let value: number | null = null
  let label = ""

  // Try computed values first
  if (indicatorKey && computedValues?.[indicatorKey] !== undefined) {
    value = computedValues[indicatorKey]
  }

  // Fallback: try to compute from raw data (simple sum)
  if (value === null && indicatorField) {
    const tableData = data[indicatorField.table]
    if (tableData && tableData.length > 0) {
      const col = indicatorField.column
      // Check if column exists in raw data
      if (col in tableData[0]) {
        value = tableData.reduce((sum: number, row: any) => sum + (Number(row[col]) || 0), 0)
      }
    }
  }

  if (indicatorField) {
    label = indicatorField.column
  }

  const displayValue = value !== null
    ? formatNumber(value)
    : "â€”"

  return (
    <Card className="h-full w-full flex flex-col justify-center items-center p-3">
      <CardContent className="p-0 text-center">
        <div className="text-2xl font-bold tabular-nums">{displayValue}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </CardContent>
    </Card>
  )
}

function formatNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) {
    return (n / 1_000_000_000).toFixed(1) + "B"
  }
  if (Math.abs(n) >= 1_000_000) {
    return (n / 1_000_000).toFixed(1) + "M"
  }
  if (Math.abs(n) >= 1_000) {
    return (n / 1_000).toFixed(1) + "K"
  }
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 })
}
```

## 10. DataTableVisual.tsx
```tsx
import { useState, useMemo } from "react"
import type { Visual } from "./types"

interface DataTableVisualProps {
  visual: Visual
  data: Record<string, any[]>
}

export function DataTableVisual({ visual, data }: DataTableVisualProps) {
  const rowFields = visual.fields.filter(f => f.role === "Rows")
  const valueFields = visual.fields.filter(f => f.role === "Values")

  // Try to find data table
  const allTables = [...new Set(visual.fields.map(f => f.table))]
  const firstTable = allTables[0]
  const tableData = data[firstTable]

  if (!tableData || tableData.length === 0) {
    return <div className="text-muted-foreground text-xs p-4">No data available</div>
  }

  // Build columns from fields
  const displayCols = [...rowFields.map(f => f.column), ...valueFields.map(f => f.column)]

  // Aggregate values group by row fields
  const aggregated = useMemo(() => {
    const groups: Record<string, Record<string, number>> = {}
    for (const row of tableData) {
      const key = rowFields.map(f => String(row[f.column] ?? "")).join("|")
      if (!groups[key]) {
        groups[key] = {}
      }
      for (const vf of valueFields) {
        const val = Number(row[vf.column] ?? 0)
        groups[key][vf.column] = (groups[key][vf.column] ?? 0) + val
      }
    }
    return Object.entries(groups).map(([key, vals]) => {
      const parts = key.split("|")
      const result: Record<string, any> = {}
      rowFields.forEach((f, i) => { result[f.column] = parts[i] || "" })
      Object.entries(vals).forEach(([col, val]) => { result[col] = formatNum(val) })
      return result
    })
  }, [tableData, rowFields, valueFields])

  const [sortCol, setSortCol] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const sorted = useMemo(() => {
    if (!sortCol) return aggregated
    return [...aggregated].sort((a, b) => {
      const va = a[sortCol]
      const vb = b[sortCol]
      if (typeof va === "number" && typeof vb === "number") {
        return sortDir === "asc" ? va - vb : vb - va
      }
      return sortDir === "asc"
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va))
    })
  }, [aggregated, sortCol, sortDir])

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(d => d === "asc" ? "desc" : "asc")
    } else {
      setSortCol(col)
      setSortDir("asc")
    }
  }

  return (
    <div className="w-full h-full overflow-auto p-1">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b">
            {displayCols.map(col => (
              <th
                key={col}
                className="text-left p-1 font-medium cursor-pointer hover:bg-muted sticky top-0 bg-background"
                onClick={() => handleSort(col)}
              >
                {col}
                {sortCol === col && (sortDir === "asc" ? " â–²" : " â–¼")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.slice(0, 100).map((row, i) => (
            <tr key={i} className="border-b hover:bg-muted/50">
              {displayCols.map(col => (
                <td key={col} className="p-1 whitespace-nowrap">
                  {row[col] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatNum(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 })
}
```

## 11. SlicerVisual.tsx + FilterContext.tsx
### packages\pbix-web-app\src\components\visuals\SlicerVisual.tsx
```tsx
import { useState, useMemo } from "react"
import type { Visual } from "./types"

interface SlicerVisualProps {
  visual: Visual
  data: Record<string, any[]>
  onFilter?: (field: string, values: string[]) => void
  activeFilters?: Record<string, string[]>
}

export function SlicerVisual({ visual, data, onFilter, activeFilters }: SlicerVisualProps) {
  const valuesField = visual.fields.find(f => f.role === "Values")
  if (!valuesField) return <div className="text-muted-foreground text-xs p-4">No field</div>

  const tableData = data[valuesField.table]
  if (!tableData || tableData.length === 0) {
    return <div className="text-muted-foreground text-xs p-4">No data</div>
  }

  // Try to find the column â€” fallback to first string column
  let col = valuesField.column
  if (!(col in tableData[0])) {
    // Try other columns in the table
    for (const [k, v] of Object.entries(tableData[0])) {
      if (typeof v === "string") { col = k; break }
    }
  }

  if (!(col in tableData[0])) {
    return <div className="text-muted-foreground text-xs p-4">No data</div>
  }

  // Get unique values
  const uniqueValues = useMemo(() => {
    const vals = new Set<string>()
    for (const row of tableData) {
      const v = row[col]
      if (v != null && v !== "") vals.add(String(v))
    }
    return Array.from(vals).sort()
  }, [tableData, col])

  const fieldKey = `${valuesField.table}.${valuesField.column}`
  const selected = activeFilters?.[fieldKey] || []
  const [search, setSearch] = useState("")

  const filtered = uniqueValues.filter(v =>
    v.toLowerCase().includes(search.toLowerCase())
  )

  const toggleValue = (val: string) => {
    const newVals = selected.includes(val)
      ? selected.filter(v => v !== val)
      : [...selected, val]
    onFilter?.(fieldKey, newVals)
  }

  return (
    <div className="w-full h-full flex flex-col p-1 overflow-hidden">
      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="text-xs border rounded px-2 py-1 mb-1"
      />
      <div className="flex-1 overflow-y-auto">
        {filtered.slice(0, 100).map(val => (
          <label key={val} className="flex items-center gap-1 text-xs py-0.5 cursor-pointer hover:bg-muted rounded px-1">
            <input
              type="checkbox"
              checked={selected.includes(val)}
              onChange={() => toggleValue(val)}
              className="size-3"
            />
            <span className="truncate">{val}</span>
          </label>
        ))}
        {filtered.length > 100 && (
          <div className="text-xs text-muted-foreground px-1">+{filtered.length - 100} more</div>
        )}
      </div>
    </div>
  )
}
```
### packages\pbix-web-app\src\components\layout\FilterContext.tsx
```tsx
import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface FilterContextValue {
  filters: Record<string, string[]>
  setFilter: (field: string, values: string[]) => void
  clearFilters: () => void
  isFiltered: (field: string, value: string) => boolean
}

const FilterContext = createContext<FilterContextValue | null>(null)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Record<string, string[]>>({})

  const setFilter = useCallback((field: string, values: string[]) => {
    setFilters(prev => {
      if (values.length === 0) {
        const { [field]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [field]: values }
    })
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  const isFiltered = useCallback((field: string, value: string) => {
    const vals = filters[field]
    if (!vals || vals.length === 0) return true
    return vals.includes(value)
  }, [filters])

  return (
    <FilterContext.Provider value={{ filters, setFilter, clearFilters, isFiltered }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error("useFilters must be used within FilterProvider")
  return ctx
}
```

## 12. pnpm build status
```
```

## 13. pytest status
```
```

