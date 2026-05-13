import { KpiCard, BarChartVisual, DataTableVisual, PieChartVisual, ScatterChartVisual } from "@pbix/runtime"
import { useStore } from "../../boot"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

export default function WinLossInsights({ engine }: Props) {
  const wonFilter = [{ column: "Status", op: "eq" as const, values: ["Won"] }]
  const lostFilter = [{ column: "Status", op: "eq" as const, values: ["Lost"] }]

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* KPI Row */}
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Value", agg: "sum" }} label="Revenue Won" engine={engine} filters={wonFilter} format="currency" color="#16a34a" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Value", agg: "sum" }} label="Revenue Lost" engine={engine} filters={lostFilter} format="currency" color="#dc2626" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Value", agg: "count" }} label="Won Deals" engine={engine} filters={wonFilter} format="compact" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Value", agg: "avg" }} label="Avg Deal (Won)" engine={engine} filters={wonFilter} format="currency" />
      </div>

      {/* Win/Loss Distribution */}
      <div className="col-span-5">
        <PieChartVisual table="Opportunities" category={{ column: "Status" }} value={{ column: "Value", agg: "count", label: "Count" }} engine={engine} maxSlices={5} />
      </div>

      {/* Revenue Won by Product */}
      <div className="col-span-7">
        <BarChartVisual table="Opportunities" category={{ column: "Product", maxItems: 10 }} values={[{ column: "Value", agg: "sum", label: "Revenue Won" }]} engine={engine} filters={wonFilter} />
      </div>

      {/* Revenue Won by Owner */}
      <div className="col-span-6">
        <BarChartVisual table="Opportunities" category={{ column: "Owner", maxItems: 10 }} values={[{ column: "Value", agg: "sum", label: "Revenue Won" }]} engine={engine} filters={wonFilter} orientation="horizontal" />
      </div>

      {/* Deal Count vs Revenue by Territory */}
      <div className="col-span-6">
        <ScatterChartVisual table="Opportunities" x={{ column: "Value", agg: "count", label: "Deal Count" }} y={{ column: "Value", agg: "sum", label: "Revenue Won" }} category={{ column: "Territory" }} engine={engine} filters={wonFilter} />
      </div>

      {/* Detailed Breakdown Table */}
      <div className="col-span-12">
        <DataTableVisual table="Opportunities" columns={[
          { column: "Status", role: "row" },
          { column: "Product", role: "row" },
          { column: "Territory", role: "row" },
          { column: "Owner", role: "row" },
          { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue" },
          { column: "Value", agg: "count", role: "value", label: "Deals" },
        ]} engine={engine} virtualized={false} />
      </div>
    </div>
  )
}
