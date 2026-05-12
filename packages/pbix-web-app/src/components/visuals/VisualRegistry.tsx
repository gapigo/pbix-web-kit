import type { Visual } from "./types"
import { KpiCard } from "./KpiCard"
import { BarChartVisual } from "./BarChartVisual"
import { LineChartVisual } from "./LineChartVisual"
import { PieChartVisual } from "./PieChartVisual"
import { DataTableVisual } from "./DataTableVisual"
import { SlicerVisual } from "./SlicerVisual"
import { UnsupportedVisual } from "./UnsupportedVisual"

interface VisualRendererProps {
  visual: Visual
  data: Record<string, any[]>
  onFilter?: (field: string, values: string[]) => void
  activeFilters?: Record<string, string[]>
}

export function VisualRenderer({ visual, data, onFilter, activeFilters }: VisualRendererProps) {
  switch (visual.type) {
    case "kpi":
      return <KpiCard visual={visual} data={data} />
    case "bar":
      return <BarChartVisual visual={visual} data={data} />
    case "line":
      return <LineChartVisual visual={visual} data={data} />
    case "pie":
      return <PieChartVisual visual={visual} data={data} />
    case "table":
      return <DataTableVisual visual={visual} data={data} />
    case "slicer":
      return <SlicerVisual visual={visual} data={data} onFilter={onFilter} activeFilters={activeFilters} />
    case "text":
      return null // text boxes are decorations, skip for MVP
    case "image":
    case "shape":
      return null // skip for MVP
    default:
      return <UnsupportedVisual visual={visual} />
  }
}
