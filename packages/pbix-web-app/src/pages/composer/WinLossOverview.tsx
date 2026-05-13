import { KpiCard, BarChartVisual, LineChartVisual, DataTableVisual, MapPlaceholder } from "@pbix/runtime"
import { useEngine, useStore } from "../../boot"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

export default function WinLossOverview({ engine }: Props) {
  const openFilter = [{ column: "Status", op: "eq" as const, values: ["Open"] }]
  const wonFilter = [{ column: "Status", op: "eq" as const, values: ["Won"] }]

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* KPI Row */}
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Value", agg: "sum" }} label="Revenue Open" engine={engine} filters={openFilter} format="currency" color="#4f46e5" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Value", agg: "sum" }} label="Forecast by Win/Loss" engine={engine} filters={openFilter} format="currency" color="#0891b2" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Value", agg: "sum" }} label="Revenue Won" engine={engine} filters={wonFilter} format="currency" color="#059669" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Value", agg: "count" }} label="Close %" engine={engine} filters={wonFilter} format="percent" color="#d97706" />
      </div>

      {/* Close % by Product LOB */}
      <div className="col-span-6">
        <BarChartVisual
          table="Opportunities"
          category={{ column: "Product", maxItems: 12 }}
          values={[
            { column: "Value", agg: "count", label: "Close %", color: "#4f46e5" },
          ]}
          engine={engine}
          orientation="horizontal"
        />
      </div>

      {/* Close % by Manager */}
      <div className="col-span-6">
        <BarChartVisual
          table="Opportunities"
          category={{ column: "Owner", maxItems: 12 }}
          values={[
            { column: "Value", agg: "count", label: "Close %", color: "#0891b2" },
          ]}
          engine={engine}
          orientation="horizontal"
        />
      </div>

      {/* DataTable by Owner */}
      <div className="col-span-6">
        <DataTableVisual
          table="Opportunities"
          columns={[
            { column: "Owner", role: "row" },
            { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue Open" },
            { column: "Value", agg: "count", role: "value", format: "percent", label: "Close %" },
            { column: "Value", agg: "sum", role: "value", format: "currency", label: "Forecast by W/L" },
          ]}
          engine={engine}
          virtualized={false}
        />
      </div>

      {/* Close % Trend */}
      <div className="col-span-6">
        <LineChartVisual
          table="Opportunities"
          category={{ column: "CloseDate" }}
          values={[
            { column: "Value", agg: "count", label: "Close %", color: "#4f46e5" },
          ]}
          engine={engine}
        />
      </div>

      {/* Flow Visual Fallback */}
      <div className="col-span-12">
        <MapPlaceholder name="Flow / Sankey Diagram" />
      </div>
    </div>
  )
}
