import { KpiCard, BarChartVisual, DataTableVisual, SlicerVisual, MapPlaceholder } from "@pbix/runtime"
import { useEngine, useStore } from "../../boot"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

export default function Template({ engine }: Props) {
  const filters = [{ column: "Status", op: "eq" as const, values: ["Won"] }]
  const store = useStore()!

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Example KPI Row */}
      <div className="col-span-3"><KpiCard measure={{ table: "Opportunities", column: "Value", agg: "sum" }} label="Total Revenue" engine={engine} filters={filters} format="currency" /></div>
      <div className="col-span-3"><KpiCard measure={{ table: "Opportunities", column: "Value", agg: "count" }} label="Total Deals" engine={engine} filters={filters} format="compact" /></div>
      <div className="col-span-3"><KpiCard measure={{ table: "Opportunities", column: "Value", agg: "avg" }} label="Avg Deal Size" engine={engine} filters={filters} format="currency" /></div>
      <div className="col-span-3"><KpiCard measure={{ table: "Opportunities", column: "Discount", agg: "avg" }} label="Avg Discount %" engine={engine} filters={filters} format="percent" /></div>

      {/* Slicer Row */}
      <div className="col-span-3">
        <SlicerVisual table="Opportunities" column="Product" label="Product Filter" engine={engine} />
      </div>
      <div className="col-span-2">
        <SlicerVisual table="Opportunities" column="Territory" label="Territory Filter" engine={engine} />
      </div>

      {/* Revenue by Product LOB */}
      <div className="col-span-5">
        <BarChartVisual
          table="Opportunities"
          category={{ column: "Product LOB", maxItems: 8 }}
          values={[{ column: "Value", agg: "sum", label: "Revenue" }]}
          engine={engine}
        />
      </div>

      {/* Revenue by Territory Map */}
      <div className="col-span-7">
        <MapPlaceholder name="Revenue by Territory" />
      </div>

      {/* Deal Details Table */}
      <div className="col-span-6">
        <DataTableVisual
          table="Opportunities"
          columns={[
            { column: "Product", role: "row" },
            { column: "Owner", role: "row" },
            { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue" },
            { column: "Discount", agg: "avg", role: "value", format: "percent", label: "Avg Discount" },
          ]}
          engine={engine}
          virtualized={false}
        />
      </div>

      {/* Pipeline Summary Table */}
      <div className="col-span-6">
        <DataTableVisual
          table="Opportunities"
          columns={[
            { column: "PipelineStep", role: "row" },
            { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue" },
            { column: "Value", agg: "count", role: "value", format: "compact", label: "Deal Count" },
            { column: "Discount", agg: "avg", role: "value", format: "percent", label: "Avg Discount" },
          ]}
          engine={engine}
          virtualized={false}
        />
      </div>
    </div>
  )
}
