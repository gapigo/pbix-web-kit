import { KpiCard, BarChartVisual, LineChartVisual, DataTableVisual, SlicerVisual } from "@pbix/runtime"
import { useEngine, useStore } from "../../boot"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

export default function PipelineTrends({ engine }: Props) {
  const pipelineFilter = [{ column: "Status", op: "eq" as const, values: ["Open"] }]

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Pipeline KPIs */}
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Value", agg: "sum" }} label="Revenue In Pipeline" engine={engine} filters={pipelineFilter} format="currency" color="#4f46e5" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Value", agg: "count" }} label="Opportunity Count" engine={engine} filters={pipelineFilter} format="compact" color="#0891b2" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Days Remaining In Pipeline", agg: "avg" }} label="Avg Days Remaining" engine={engine} filters={pipelineFilter} format="compact" color="#059669" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Value", agg: "avg" }} label="Avg Deal Size" engine={engine} filters={pipelineFilter} format="currency" color="#d97706" />
      </div>

      {/* Slicers */}
      <div className="col-span-3">
        <SlicerVisual table="Opportunities" column="PipelineStep" label="Pipeline Step" engine={engine} />
      </div>
      <div className="col-span-2">
        <SlicerVisual table="Opportunities" column="Sales Stage" label="Sales Stage" engine={engine} />
      </div>

      {/* Pipeline Revenue Trend Over Time */}
      <div className="col-span-7">
        <LineChartVisual
          table="Opportunities"
          category={{ column: "CloseDate" }}
          values={[{ column: "Value", agg: "sum", label: "Revenue In Pipeline" }]}
          engine={engine}
        />
      </div>

      {/* Pipeline by Stage */}
      <div className="col-span-6">
        <BarChartVisual
          table="Opportunities"
          category={{ column: "PipelineStep", maxItems: 10 }}
          values={[{ column: "Value", agg: "sum", label: "Revenue In Pipeline" }]}
          engine={engine}
        />
      </div>

      {/* Pipeline Details Table */}
      <div className="col-span-6">
        <DataTableVisual
          table="Opportunities"
          columns={[
            { column: "PipelineStep", role: "row" },
            { column: "Territory", role: "row" },
            { column: "Owner", role: "row" },
            { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue" },
            { column: "Weeks Open", agg: "avg", role: "value", format: "compact", label: "Avg Weeks Open" },
          ]}
          engine={engine}
          virtualized={false}
        />
      </div>

      {/* Pipeline Summary Table */}
      <div className="col-span-12">
        <DataTableVisual
          table="Opportunities"
          columns={[
            { column: "PipelineStep", role: "row" },
            { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue" },
            { column: "Value", agg: "count", role: "value", format: "compact", label: "Opportunity Count" },
            { column: "Value", agg: "avg", role: "value", format: "currency", label: "Avg Deal Size" },
          ]}
          engine={engine}
          virtualized={false}
        />
      </div>
    </div>
  )
}
