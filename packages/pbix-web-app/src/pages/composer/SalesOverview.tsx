import { KpiCard, BarChartVisual, DataTableVisual, MapPlaceholder, ComboChartVisual, FunnelVisual, SlicerVisual } from "@pbix/runtime"
import { useEngine, useStore } from "../../boot"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

export default function SalesOverview({ engine }: Props) {
  const filters = [{ column: "Status", op: "eq" as const, values: ["Won"] }]
  const store = useStore()!

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* KPI Row */}
      <div className="col-span-3"><KpiCard measure={{ table: "Opportunities", column: "Value", agg: "sum" }} label="Revenue Won" engine={engine} filters={filters} format="currency" /></div>
      <div className="col-span-3"><KpiCard measure={{ table: "Owners", column: "Rev Goal", agg: "sum" }} label="Rev Goal" engine={engine} format="currency" /></div>
      <div className="col-span-3"><KpiCard measure={{ table: "Opportunities", column: "Value", agg: "sum" }} label="Revenue In Pipeline" engine={engine} filters={[{ column: "Status", op: "eq", values: ["Open"] }]} format="currency" /></div>
      <div className="col-span-3"><KpiCard measure={{ table: "Opportunities", column: "Value", agg: "count" }} label="Forecast %" engine={engine} format="percent" /></div>

      {/* Slicer */}
      <div className="col-span-3">
        <SlicerVisual table="Opportunity Forecast Adjustment" column="Forecast Adjustment" label="Forecast Adjustment" engine={engine} />
      </div>

      {/* Bar chart - Revenue by Product */}
      <div className="col-span-4">
        <BarChartVisual table="Opportunities" category={{ column: "Product", maxItems: 10 }} values={[{ column: "Value", agg: "sum", label: "Revenue Won" }, { column: "Value", agg: "sum", label: "Revenue Pipeline" }]} engine={engine} />
      </div>

      {/* Map placeholder */}
      <div className="col-span-5"><MapPlaceholder name="Sales by Territory" /></div>

      {/* Combo chart */}
      <div className="col-span-7">
        <ComboChartVisual table="Opportunities" category={{ column: "Owner" }} bars={[{ column: "Value", agg: "sum", label: "Revenue Won" }]} lines={[{ column: "Value", agg: "sum", label: "Pipeline" }]} engine={engine} />
      </div>

      {/* Funnel */}
      <div className="col-span-5"><FunnelVisual table="Opportunities" category={{ column: "PipelineStep" }} value={{ column: "Value", agg: "sum", label: "Revenue" }} engine={engine} /></div>

      {/* Tables */}
      <div className="col-span-6">
        <DataTableVisual table="Opportunities" columns={[{ column: "Territory", role: "row" }, { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue Won" }, { column: "Value", agg: "sum", role: "value", format: "currency", label: "Pipeline" }]} engine={engine} virtualized={false} />
      </div>
      <div className="col-span-6">
        <DataTableVisual table="Opportunities" columns={[{ column: "Product", role: "row" }, { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue Won" }, { column: "Value", agg: "sum", role: "value", format: "currency", label: "Pipeline" }]} engine={engine} virtualized={false} />
      </div>
    </div>
  )
}
