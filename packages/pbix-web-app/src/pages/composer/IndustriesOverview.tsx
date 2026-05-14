import { DataTableVisual, ScatterChartVisual, LineChartVisual, KpiCard, BarChartVisual } from "@pbix/runtime"
import { useEngine } from "../../boot"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

export default function IndustriesOverview({ engine }: Props) {
  const wonFilter = [{ column: "Status", op: "eq" as const, values: ["Won"] }]
  const openFilter = [{ column: "Status", op: "eq" as const, values: ["Open"] }]

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Total Pipeline KPI */}
      <div className="col-span-4">
        <KpiCard
          measure={{ table: "v_opportunities", column: "Value", agg: "sum" }}
          label="Total Pipeline"
          engine={engine}
          filters={openFilter}
          format="currency"
          color="#4f46e5"
        />
      </div>

      {/* Revenue Won by Industry */}
      <div className="col-span-4">
        <DataTableVisual
          table="v_opportunities"
          columns={[
            { column: "Industry", role: "row" },
            { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue Won" },
            { column: "Value", agg: "count", role: "value", format: "percent", label: "Close %" },
            { column: "Value", agg: "avg", role: "value", format: "currency", label: "Avg Deal Size" },
          ]}
          engine={engine}
          filters={wonFilter}
          virtualized={false}
        />
      </div>

      {/* Revenue Won by Product LOB */}
      <div className="col-span-4">
        <DataTableVisual
          table="v_opportunities"
          columns={[
            { column: "Product LOB", role: "row" },
            { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue Won" },
            { column: "Value", agg: "count", role: "value", format: "percent", label: "Close %" },
            { column: "Value", agg: "avg", role: "value", format: "currency", label: "Avg Deal Size" },
          ]}
          engine={engine}
          filters={wonFilter}
          virtualized={false}
        />
      </div>

      {/* Pipeline by Industry */}
      <div className="col-span-6">
        <BarChartVisual
          table="v_opportunities"
          category={{ column: "Industry", maxItems: 12 }}
          values={[
            { column: "Value", agg: "sum", label: "Pipeline", color: "#4f46e5" },
          ]}
          engine={engine}
          filters={openFilter}
          orientation="horizontal"
        />
      </div>

      {/* Pipeline by Product LOB */}
      <div className="col-span-6">
        <BarChartVisual
          table="v_opportunities"
          category={{ column: "Product LOB", maxItems: 12 }}
          values={[
            { column: "Value", agg: "sum", label: "Pipeline", color: "#0891b2" },
          ]}
          engine={engine}
          filters={openFilter}
          orientation="horizontal"
        />
      </div>

      {/* Revenue Won Trend */}
      <div className="col-span-6">
        <LineChartVisual
          table="v_opportunities"
          category={{ column: "CloseDate" }}
          values={[
            { column: "Value", agg: "sum", label: "Revenue Won", color: "#118DFF" },
          ]}
          engine={engine}
          filters={wonFilter}
        />
      </div>

      {/* Revenue Won vs Opportunity Count by Industry */}
      <div className="col-span-6">
        <ScatterChartVisual
          table="v_opportunities"
          x={{ column: "Value", agg: "sum", label: "Revenue Won" }}
          y={{ column: "Value", agg: "count", label: "Opportunity Count" }}
          category={{ column: "Industry" }}
          engine={engine}
          filters={wonFilter}
        />
      </div>
    </div>
  )
}
