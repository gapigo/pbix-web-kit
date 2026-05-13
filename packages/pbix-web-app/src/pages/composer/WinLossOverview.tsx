import { KpiCard, BarChartVisual, LineChartVisual, DataTableVisual, MapPlaceholder } from "@pbix/runtime"
import { useQuery } from "@pbix/runtime"
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

  // Close % = Won / (Won + Lost) using raw SQL
  const { data: closeRate, loading: crLoading } = useQuery({
    engine,
    sql: `SELECT ROUND(CAST(SUM(CASE WHEN Status='Won' THEN 1 ELSE 0 END) AS FLOAT) / NULLIF(COUNT(*), 0) * 100, 1) AS val FROM v_opportunities WHERE Status IN ('Won', 'Lost')`,
  })
  const crVal = closeRate?.[0]?.val as number | undefined

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* KPI Row */}
      <div className="col-span-3">
        <KpiCard measure={{ table: "v_opportunities", column: "Value", agg: "sum" }} label="Revenue Open" engine={engine} filters={openFilter} format="currency" color="#4f46e5" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "v_opportunities", column: "Value", agg: "sum" }} label="Forecast Pipeline" engine={engine} filters={openFilter} format="currency" color="#0891b2" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "v_opportunities", column: "Value", agg: "sum" }} label="Revenue Won" engine={engine} filters={wonFilter} format="currency" color="#059669" />
      </div>
      <div className="col-span-3">
        {crLoading ? (
          <div className="h-24 bg-gray-100 rounded-lg animate-pulse p-4"><div className="h-8 w-24 bg-gray-200 rounded" /></div>
        ) : (
          <div className="h-24 bg-white rounded-lg border p-4">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Close %</div>
            <div className="text-2xl font-bold" style={{ color: "#d97706" }}>{crVal !== undefined ? `${crVal}%` : "—"}</div>
          </div>
        )}
      </div>

      {/* Close % by Product — Won deals count by Product */}
      <div className="col-span-6">
        <BarChartVisual
          table="v_opportunities"
          category={{ column: "Product", maxItems: 12 }}
          values={[{ column: "OpportunitySeq", agg: "count", label: "Deals Won", color: "#4f46e5" }]}
          engine={engine}
          filters={wonFilter}
          orientation="horizontal"
        />
      </div>

      {/* Close % by Manager — Won deals count by Manager */}
      <div className="col-span-6">
        <BarChartVisual
          table="v_opportunities"
          category={{ column: "Manager", maxItems: 12 }}
          values={[{ column: "OpportunitySeq", agg: "count", label: "Deals Won", color: "#0891b2" }]}
          engine={engine}
          filters={wonFilter}
          orientation="horizontal"
        />
      </div>

      {/* DataTable by Owner */}
      <div className="col-span-6">
        <DataTableVisual
          table="v_opportunities"
          columns={[
            { column: "Owner", role: "row" },
            { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue Won" },
            { column: "OpportunitySeq", agg: "count", role: "value", label: "Deals Won" },
          ]}
          engine={engine}
          filters={wonFilter}
          virtualized={false}
        />
      </div>

      {/* Won Trend by CloseDate */}
      <div className="col-span-6">
        <LineChartVisual
          table="v_opportunities"
          category={{ column: "CloseDate" }}
          values={[{ column: "OpportunitySeq", agg: "count", label: "Deals Won", color: "#059669" }]}
          engine={engine}
          filters={wonFilter}
        />
      </div>

      {/* Flow Visual Fallback */}
      <div className="col-span-12">
        <MapPlaceholder name="Flow / Sankey Diagram" />
      </div>
    </div>
  )
}
