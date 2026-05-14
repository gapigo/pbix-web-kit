# Prompt Template: Composer Mode

Fast, constrained page gen using `@pbix/runtime` visuals.
Single `<150 line` TSX per page, SDK imports only.

## Template

```
You are implementing a dashboard page using the pbix-web-kit SDK.

{{SKILL_MD}}

## Page: {{PAGE_BRIEF.title}}

{{PAGE_BRIEF.narrative}}

### Hero metric
{{PAGE_BRIEF.hero}}

### Visuals (in priority order)
{{PAGE_BRIEF.visuals}}

### Data sources
{{PAGE_BRIEF.tables}}

### Allowed imports (only these)
import { DashboardShell, KpiCard, BarChartVisual, LineChartVisual, PieChartVisual, DataTableVisual, SlicerVisual, ComboChartVisual, ScatterChartVisual, TreemapVisual, FunnelVisual, GaugeVisual, MapPlaceholder, PageTabs, FilterBar, useAggregation, useQuery, useDistinctValues, useFilter, useFilters, useStoryboard, useActivePage, createDashboardStore, useUrlSyncedFilters, theme, formatCurrency, formatCompact, formatPercent, formatNumber, PBI_PALETTE } from "@pbix/runtime"
{{ALLOWED_IMPORTS}}

### Data samples
{{DATA_SAMPLES}}

### Storyboard context
{{STORYBOARD_NARRATIVE}}

### Requirements
- One file: `pages/composer/{{PAGE_BRIEF.title | slugify}}.tsx`
- MAX 150 lines. Shorter is better.
- All data from Parquet via DuckDB (useAggregation / useQuery).
- Use `useFilter`/`useFilters` for cross-filtering.
- Format numbers: `formatCurrency`, `formatCompact`, etc.
- Skeleton/loading/empty states on every visual.
- Colors from `theme.colors[i]` or `PBI_PALETTE`.
- CSS grid: `<div className="grid grid-cols-12 gap-4">`.
- Skip chrome visuals (`chrome: true`).
- Override `table` field with the DuckDB-registered table name.
```

## Example (Python f-string)

```python
prompt = f"""\
You are implementing a dashboard page using the pbix-web-kit SDK.

{SKILL_MD}

## Page: Sales Overview

This page presents Opportunities.Revenue Won, broken down by Owner Goal, State or Province, Forecast Adjustment. Hero: Opportunities.Revenue Won.

### Visuals (priority order)
| # | Type  | Name                 | Dimensions                               |
|---|-------|----------------------|------------------------------------------|
| 1 | kpi   | Revenue Won          | —                                        |
| 2 | bar   | Revenue by Product   | Products.Product LOB, Products.Product   |
| 3 | table | Territory breakdown  | Accounts.State, Territories.Territory    |
| 4 | combo | Trend over Manager   | Owners.Owner Goal, Owners.Manager        |
| 5 | slicer| Forecast Adjustment  | Forecast Adjustment.Forecast Adjustment  |

### Data sources
Accounts, Opportunities, Owners, Products, Territories, Opportunity Forecast Adjustment

### Allowed imports (only these)
import {{ KpiCard, BarChartVisual, DataTableVisual, ComboChartVisual, SlicerVisual,
  DashboardShell, PageTabs, FilterBar, useAggregation, useFilter, useFilters,
  useStoryboard, useActivePage, theme, formatCurrency, formatCompact, formatPercent }}
  from "@pbix/runtime"

### Data samples
{DATA_SAMPLES}

### Storyboard context
{STORYBOARD_NARRATIVE}

### Requirements
- One file: `pages/composer/SalesOverview.tsx`. MAX 150 lines.
- All data from DuckDB. Cross-filter via useFilter.
- Skeleton/loading/empty states. CSS grid layout.
- Skip chrome. Colors from theme.colors.
"""
```
