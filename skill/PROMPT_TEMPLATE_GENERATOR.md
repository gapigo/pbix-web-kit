# Prompt Template: Generator Mode

Full creative freedom: custom Recharts + `@pbix/runtime` visuals. No line limit.

## Template

```
You are implementing a dashboard page using the pbix-web-kit SDK.

{{SKILL_MD}}

## Page: {{PAGE_BRIEF.title}}

{{PAGE_BRIEF.narrative}}

### Hero metric
{{PAGE_BRIEF.hero}}

### Visuals (in priority order, with full measure/dimension details)
{{PAGE_BRIEF.visuals}}

### Data sources
{{PAGE_BRIEF.tables}}

### Available imports

**From `@pbix/runtime`:** Data: useAggregation, useQuery, useDistinctValues, useFilter, useFilters, useStoryboard, useActivePage. Visuals: KpiCard, BarChartVisual, LineChartVisual, PieChartVisual, DataTableVisual, ComboChartVisual, ScatterChartVisual, TreemapVisual, FunnelVisual, GaugeVisual, MapPlaceholder, SlicerVisual. Layout: DashboardShell, PageTabs, FilterBar. Utils: formatNumber, formatCurrency, formatPercent, formatCompact. Theme: theme, PBI_PALETTE

**From `recharts` (Generator mode only):** BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, ComposedChart, ScatterChart, Scatter, Treemap, FunnelChart, Funnel, RadialBarChart, RadialBar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell

{{ALLOWED_IMPORTS}}

### Data samples
{{DATA_SAMPLES}}

### Storyboard context
{{STORYBOARD_NARRATIVE}}

### Requirements
- One file: `pages/generator/{{PAGE_BRIEF.title | slugify}}.tsx`
- NO line limit. Prioritize correctness and polish over brevity.
- Prefer `@pbix/runtime` visuals for standard charts (bar, line, pie, kpi, slicer).
- Use Recharts directly for custom layouts or visuals not in the SDK.
- All data from Parquet via DuckDB — never mock.
- Cross-filter via `useFilter`/`useFilters`.
- Responsive containers, truncated labels, overflow hidden.
- Skeleton/loading/error states on every visual.
- Colors from `theme.colors[i]` or `PBI_PALETTE`.
- Skip chrome visuals (`chrome: true`).
- Large tables (>200 rows): virtualize.
```

## Example (Python f-string)

```python
prompt = f"""\
You are implementing a dashboard page using the pbix-web-kit SDK.

{SKILL_MD}

## Page: Pipeline Trends

This page presents Opportunities.Opportunity Count, broken down by Discount, Industry, Year Month. Hero: Opportunities.Opportunity Count.

### Visuals (priority order)
| # | Type   | Name                              | Dimensions                               |
|---|--------|-----------------------------------|------------------------------------------|
| 1 | kpi    | Opportunity Count                 | —                                        |
| 2 | ribbon | Count over Month                  | Date Table (Month Year)                  |
| 3 | combo  | Revenue In Pipeline + Won by Ind. | Industry                                 |
| 4 | funnel | Pipeline Stages                   | PipelineStep → Revenue Open              |
| 5 | slicer | Industry slicer                   | Industry                                 |

### Data sources
Opportunities, Date Table, Industries

### Available imports
From @pbix/runtime: KpiCard, BarChartVisual, ComboChartVisual, FunnelVisual, SlicerVisual,
  useAggregation, useFilter, useFilters, theme, PBI_PALETTE, formatCompact, formatCurrency
From recharts: ComposedChart, Bar, Line, FunnelChart, Funnel, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell

### Data samples
{DATA_SAMPLES}

### Storyboard context
{STORYBOARD_NARRATIVE}

### Requirements
- One file: `pages/generator/PipelineTrends.tsx`. No line limit.
- Ribbon: custom Recharts with gradient fill. Combo: <ComposedChart> with Bar+Line.
- Funnel: custom layout with % labels. Slicer: use SlicerVisual.
- Cross-filter via useFilter. All data from DuckDB. No mocks.
"""
```
