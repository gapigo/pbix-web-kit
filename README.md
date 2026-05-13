# pbix-web-kit

> Convert Power BI `.pbix` files into functional web dashboards using React.  
> No Power BI Embedded, no iframes — native React rendering from extracted data.

**Mission**: Enable LLMs to convert arbitrary `.pbix` files into faithful web dashboards with a reusable SDK + pipeline.

## Architecture

```
.pbix ──► pbix-parser ──► IR (JSON + data) ──► pbix-storyboard ──► Storyboard + Parquet + Briefs
                                                                              │
                                                                              ▼
                                                                   @pbix/runtime SDK
                                                                     │          │
                                                                 Composer    Generator
                                                                 (pronto)   (criativo)
                                                                     │          │
                                                                     ▼          ▼
                                                              Dashboard Web (22 páginas)
```

## Quick Start (5 commands)

```bash
# 1. Bootstrap environment
bash scripts/00_bootstrap.sh

# 2. Extract a .pbix to IR
pbix-parser extract --in "samples/regional_sales/Regional Sales Sample.pbix" --out samples/regional_sales/ir/

# 3. Generate Storyboard + Parquet + Briefs
pbix-storyboard extract --ir-dir samples/regional_sales/ir --out samples/regional_sales/
pbix-storyboard data-to-parquet --ir-dir samples/regional_sales/ir --out samples/regional_sales/parquet
pbix-storyboard brief --storyboard-file samples/regional_sales/storyboard.json --out samples/regional_sales/briefs

# 4. Run the demo app
cd packages/pbix-web-app && pnpm dev
```

Open http://localhost:5173 to see the dashboard in Composer and Generator modes (toggle in header).

## Packages

| Package | Description |
|---------|-------------|
| `pbix-parser` | Python — extract `.pbix` → canonical IR + data JSON |
| `pbix-storyboard` | Python — transform IR into Storyboard + Parquet + briefs |
| `@pbix/runtime` | React SDK — data/state/visuals/layout primitives for dashboard building |
| `pbix-web-app` | Demo Vite + React app showing both Composer and Generator modes |
| `pbix-validator` | Playwright-based validation of rendered output |

## SDK (`@pbix/runtime`)

The heart of the kit. Exports:

- **Data**: `DuckDBProvider`, `QueryEngine`, `loadParquet`, `registerTables`
- **State**: `createDashboardStore()`, `useUrlSyncedFilters`
- **Hooks**: `useAggregation`, `useQuery`, `useDistinctValues`, `useTopN`, `useFilter`, `useFilters`, `useStoryboard`
- **Visuals**: `KpiCard`, `BarChartVisual`, `LineChartVisual`, `PieChartVisual`, `DataTableVisual`, `SlicerVisual`, `ComboChartVisual`, `ScatterChartVisual`, `TreemapVisual`, `FunnelVisual`, `GaugeVisual`, `MapPlaceholder`
- **Layout**: `DashboardShell`, `PageTabs`, `FilterBar`
- **Theme + Utils**: `theme`, `PBI_PALETTE`, `formatCompact`, `formatCurrency`, `formatPercent`, `formatNumber`

## For LLMs

The most important file is [skill/SKILL.md](./skill/SKILL.md) — a complete guide for converting any `.pbix` into a web dashboard using this kit.

Other key docs:
- [skill/COMPOSER_GUIDE.md](./skill/COMPOSER_GUIDE.md) — how to build pages in Composer mode (restricted, consistent)
- [skill/GENERATOR_GUIDE.md](./skill/GENERATOR_GUIDE.md) — how to build pages in Generator mode (creative, flexible)
- [skill/EVALUATION.md](./skill/EVALUATION.md) — empirical comparison of both modes
- [docs/IR_SCHEMA.md](./docs/IR_SCHEMA.md) — intermediate representation schema
- [docs/HOW_TO_ADD_A_VISUAL.md](./docs/HOW_TO_ADD_A_VISUAL.md) — extending visual support

## Supported Visual Types

- KPI cards (single number)
- Bar/Column charts (vertical, horizontal, stacked)
- Line/Area charts
- Pie/Donut charts
- Combo charts (bar + line)
- Scatter plots
- Treemap
- Funnel charts
- Gauge (radial)
- Data tables (with virtualized scroll >200 rows)
- Slicers (multi-select)
- Map placeholder

## License

MIT — built for automation by LLMs.
