import { KpiCard, BarChartVisual, DataTableVisual, PieChartVisual, TreemapVisual } from "@pbix/runtime"
import { useEngine, useStore } from "../../boot"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

export default function RevenueSourceBreakdown({ engine }: Props) {
  return (
    <div className="grid grid-cols-12 gap-4">
      {/* KPI Row */}
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Value", agg: "sum" }} label="Total Revenue" engine={engine} format="currency" color="#4f46e5" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Value", agg: "avg" }} label="Avg Deal Size" engine={engine} format="currency" color="#0891b2" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Value", agg: "count" }} label="Total Deals" engine={engine} format="compact" color="#059669" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Value", agg: "max" }} label="Largest Deal" engine={engine} format="currency" color="#d97706" />
      </div>

      {/* Revenue by Product LOB (Pie) */}
      <div className="col-span-6">
        <PieChartVisual
          table="Opportunities"
          category={{ column: "Product LOB" }}
          value={{ column: "Value", agg: "sum", label: "Revenue" }}
          engine={engine}
        />
      </div>

      {/* Revenue by Product (Treemap) */}
      <div className="col-span-6">
        <TreemapVisual
          table="Opportunities"
          category={{ column: "Product" }}
          value={{ column: "Value", agg: "sum", label: "Revenue" }}
          engine={engine}
        />
      </div>

      {/* Revenue by Product LOB - Bar Chart */}
      <div className="col-span-12">
        <BarChartVisual
          table="Opportunities"
          category={{ column: "Product LOB", maxItems: 10 }}
          values={[
            { column: "Value", agg: "sum", label: "Revenue" },
            { column: "Value", agg: "count", label: "Deal Count" },
          ]}
          engine={engine}
        />
      </div>

      {/* Revenue Source Detail Table */}
      <div className="col-span-12">
        <DataTableVisual
          table="Opportunities"
          columns={[
            { column: "Product LOB", role: "row" },
            { column: "Product", role: "row" },
            { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue" },
            { column: "Value", agg: "count", role: "value", format: "compact", label: "Deals" },
            { column: "Value", agg: "avg", role: "value", format: "currency", label: "Avg Deal" },
          ]}
          engine={engine}
          virtualized={false}
        />
      </div>
    </div>
  )
}
