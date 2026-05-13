// Data
export { DuckDBProvider, useDuckDb } from "./data/DuckDBProvider"
export { loadParquet, registerTables } from "./data/ParquetLoader"
export { QueryEngine, arrowToJSON } from "./data/QueryEngine"
export type { Filter, AggFn, AggregateParams, TopNParams } from "./data/QueryEngine"

// State
export { createDashboardStore } from "./state/createDashboardStore"
export type { DashboardStore } from "./state/createDashboardStore"
export { useUrlSyncedFilters } from "./state/urlSync"
export {
  selectActivePageBrief,
  selectHeroVisuals,
  selectSupportingVisuals,
  selectPageSlicers,
  selectFilterCount,
} from "./state/selectors"

// Hooks
export { useFilter, useFilters, useClearFilters } from "./hooks/useFilter"
export { useQueryHook as useQuery, useAggregation, useDistinctValues, useTopN } from "./hooks/useQuery"
export { useStoryboard, useActivePage } from "./hooks/useStoryboard"

// Visuals
export { KpiCard } from "./visuals/KpiCard"
export { BarChartVisual } from "./visuals/BarChartVisual"
export { LineChartVisual } from "./visuals/LineChartVisual"
export { PieChartVisual } from "./visuals/PieChartVisual"
export { DataTableVisual } from "./visuals/DataTableVisual"
export { SlicerVisual } from "./visuals/SlicerVisual"
export { ComboChartVisual } from "./visuals/ComboChartVisual"
export { ScatterChartVisual } from "./visuals/ScatterChartVisual"
export { TreemapVisual } from "./visuals/TreemapVisual"
export { FunnelVisual } from "./visuals/FunnelVisual"
export { GaugeVisual } from "./visuals/GaugeVisual"
export { MapPlaceholder } from "./visuals/MapPlaceholder"

// Layout
export { DashboardShell } from "./layout/DashboardShell"
export { PageTabs } from "./layout/PageTabs"
export { FilterBar } from "./layout/FilterBar"

// Theme + utils
export { theme, PBI_PALETTE } from "./visuals/theme"
export type { Theme } from "./visuals/theme"
export { formatNumber, formatCurrency, formatPercent, formatCompact } from "./utils/formatters"
export { getTable, resolveColumn } from "./utils/tableLookup"

// Types
export type { Storyboard, PageBrief, VisualSummary, TableSample, MeasureRef } from "./data/types"
