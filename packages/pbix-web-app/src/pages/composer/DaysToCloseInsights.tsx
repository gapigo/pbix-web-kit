import { KpiCard, BarChartVisual, DataTableVisual, ScatterChartVisual, SlicerVisual } from "@pbix/runtime"
import { useStore } from "../../boot"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

export default function DaysToCloseInsights({ engine }: Props) {
  const wonFilter = [{ column: "Status", op: "eq" as const, values: ["Won"] }]

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* KPI Row */}
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Value", agg: "count" }} label="Total Opportunities" engine={engine} format="compact" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Value", agg: "sum" }} label="Total Revenue" engine={engine} format="currency" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Value", agg: "avg" }} label="Avg Deal Size" engine={engine} format="currency" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Value", agg: "count" }} label="Won Deals" engine={engine} filters={wonFilter} format="compact" color="#16a34a" />
      </div>

      {/* Revenue by Pipeline Stage */}
      <div className="col-span-6">
        <BarChartVisual table="Opportunities" category={{ column: "PipelineStep", maxItems: 10 }} values={[{ column: "Value", agg: "sum", label: "Revenue" }]} engine={engine} />
      </div>

      {/* Revenue by Territory */}
      <div className="col-span-6">
        <BarChartVisual table="Opportunities" category={{ column: "Territory", maxItems: 10 }} values={[{ column: "Value", agg: "sum", label: "Revenue" }]} engine={engine} orientation="horizontal" />
      </div>

      {/* Deal Count vs Revenue by Pipeline Step */}
      <div className="col-span-6">
        <ScatterChartVisual table="Opportunities" x={{ column: "Value", agg: "count", label: "Deal Count" }} y={{ column: "Value", agg: "sum", label: "Revenue" }} category={{ column: "PipelineStep" }} engine={engine} />
      </div>

      {/* Avg Revenue by Product */}
      <div className="col-span-6">
        <BarChartVisual table="Opportunities" category={{ column: "Product", maxItems: 10 }} values={[{ column: "Value", agg: "avg", label: "Avg Revenue" }]} engine={engine} />
      </div>

      {/* Slicers */}
      <div className="col-span-6">
        <SlicerVisual table="Opportunities" column="Status" label="Status" engine={engine} />
      </div>
      <div className="col-span-6">
        <SlicerVisual table="Opportunities" column="Product" label="Product" engine={engine} />
      </div>

      {/* Detail Table — opportunity breakdown with close date */}
      <div className="col-span-12">
        <DataTableVisual table="Opportunities" columns={[
          { column: "CloseDate", role: "row" },
          { column: "PipelineStep", role: "row" },
          { column: "Product", role: "row" },
          { column: "Territory", role: "row" },
          { column: "Owner", role: "row" },
          { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue" },
          { column: "Sales Stage", role: "value", label: "Stage" },
          { column: "Discount", role: "value", label: "Discount" },
        ]} engine={engine} virtualized={false} />
      </div>
    </div>
  )
}
