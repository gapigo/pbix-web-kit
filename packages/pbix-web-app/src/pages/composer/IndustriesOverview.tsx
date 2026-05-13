import { DataTableVisual, ScatterChartVisual, LineChartVisual } from "@pbix/runtime"
import { useEngine, useStore } from "../../boot"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

export default function IndustriesOverview({ engine }: Props) {
  const wonFilter = [{ column: "Status", op: "eq" as const, values: ["Won"] }]
  const store = useStore()!

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Table - Revenue Won by Industry */}
      <div className="col-span-6">
        <DataTableVisual
          table="Opportunities"
          columns={[
            { column: "Industry", role: "row" },
            { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue Won" },
            { column: "Value", agg: "count", role: "value", format: "number", label: "Deal Count" },
            { column: "Value", agg: "avg", role: "value", format: "currency", label: "Avg Deal Size" },
          ]}
          engine={engine}
          filters={wonFilter}
          virtualized={false}
        />
      </div>

      {/* Table - Revenue Won by Product LOB */}
      <div className="col-span-6">
        <DataTableVisual
          table="Opportunities"
          columns={[
            { column: "Product", role: "row" },
            { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue Won" },
            { column: "Value", agg: "count", role: "value", format: "number", label: "Deal Count" },
          ]}
          engine={engine}
          filters={wonFilter}
          virtualized={false}
        />
      </div>

      {/* Scatter - Revenue Won vs Deal Count by Industry */}
      <div className="col-span-6">
        <ScatterChartVisual
          table="Opportunities"
          x={{ column: "Value", agg: "sum", label: "Revenue Won" }}
          y={{ column: "Value", agg: "count", label: "Deal Count" }}
          category={{ column: "Industry" }}
          engine={engine}
          filters={wonFilter}
        />
      </div>

      {/* Line - Revenue Won trend by Close Month */}
      <div className="col-span-6">
        <LineChartVisual
          table="Opportunities"
          category={{ column: "CloseDate" }}
          values={[
            { column: "Value", agg: "sum", label: "Revenue Won", color: "#118DFF" },
          ]}
          engine={engine}
          filters={wonFilter}
        />
      </div>

      {/* Table - Details by Manager */}
      <div className="col-span-12">
        <DataTableVisual
          table="Opportunities"
          columns={[
            { column: "Owner", role: "row" },
            { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue Won" },
            { column: "Value", agg: "count", role: "value", format: "number", label: "Deal Count" },
            { column: "Value", agg: "avg", role: "value", format: "currency", label: "Avg Deal Size" },
          ]}
          engine={engine}
          filters={wonFilter}
          virtualized={false}
        />
      </div>
    </div>
  )
}
