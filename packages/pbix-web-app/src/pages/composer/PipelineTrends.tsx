import { KpiCard, LineChartVisual, BarChartVisual, DataTableVisual, SlicerVisual } from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

export default function PipelineTrends({ engine }: Props) {
  const openFilter = [{ column: "Status", op: "eq" as const, values: ["Open"] }]

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Pipeline KPI Row — sum Value where Status=Open */}
      <div className="col-span-3">
        <KpiCard measure={{ table: "v_opportunities", column: "Value", agg: "sum" }} label="Revenue In Pipeline" engine={engine} filters={openFilter} format="currency" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "v_opportunities", column: "OpportunitySeq", agg: "count" }} label="Pipeline Count" engine={engine} filters={openFilter} format="compact" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "v_opportunities", column: "Weeks Open", agg: "avg" }} label="Avg Weeks Open" engine={engine} filters={openFilter} format="number" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "v_opportunities", column: "Value", agg: "avg" }} label="Avg Deal Size" engine={engine} filters={openFilter} format="currency" />
      </div>

      {/* Slicer: Sales Stage — replaces old PipelineStep */}
      <div className="col-span-3">
        <SlicerVisual table="v_opportunities" column="Sales Stage" label="Sales Stage" engine={engine} />
      </div>

      {/* Pipeline Revenue Trend by CloseDate */}
      <div className="col-span-9">
        <LineChartVisual
          table="v_opportunities"
          category={{ column: "CloseDate" }}
          values={[{ column: "Value", agg: "sum", label: "Revenue In Pipeline" }]}
          engine={engine}
          filters={openFilter}
        />
      </div>

      {/* Pipeline by Sales Stage */}
      <div className="col-span-6">
        <BarChartVisual
          table="v_opportunities"
          category={{ column: "Sales Stage", maxItems: 10 }}
          values={[{ column: "Value", agg: "sum", label: "Revenue" }]}
          engine={engine}
          filters={openFilter}
        />
      </div>

      {/* Pipeline Details Table */}
      <div className="col-span-6">
        <DataTableVisual
          table="v_opportunities"
          columns={[
            { column: "Sales Stage", role: "row" },
            { column: "Territory", role: "row" },
            { column: "Owner", role: "row" },
            { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue" },
            { column: "Weeks Open", agg: "avg", role: "value", format: "number", label: "Avg Weeks Open" },
          ]}
          engine={engine}
          filters={openFilter}
          virtualized={false}
        />
      </div>

      {/* Pipeline Summary Table */}
      <div className="col-span-12">
        <DataTableVisual
          table="v_opportunities"
          columns={[
            { column: "Sales Stage", role: "row" },
            { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue" },
            { column: "Value", agg: "count", role: "value", format: "compact", label: "Opportunity Count" },
            { column: "Value", agg: "avg", role: "value", format: "currency", label: "Avg Deal Size" },
          ]}
          engine={engine}
          filters={openFilter}
          virtualized={false}
        />
      </div>
    </div>
  )
}
