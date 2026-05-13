import { KpiCard, LineChartVisual, ComboChartVisual, DataTableVisual } from "@pbix/runtime"
import { useStore } from "../../boot"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

export default function TrendAnalytics({ engine }: Props) {
  return (
    <div className="grid grid-cols-12 gap-4">
      {/* KPI Row */}
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Value", agg: "sum" }} label="Total Revenue" engine={engine} format="currency" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Value", agg: "avg" }} label="Avg Deal Size" engine={engine} format="currency" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "Owners", column: "Rev Goal", agg: "sum" }} label="Revenue Goal" engine={engine} format="currency" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Value", agg: "count" }} label="Total Opportunities" engine={engine} format="compact" />
      </div>

      {/* Revenue Trend Over Time */}
      <div className="col-span-6">
        <div className="text-sm font-medium text-muted-foreground mb-2">Revenue Trend by Close Date</div>
        <LineChartVisual
          table="Opportunities"
          category={{ column: "CloseDate" }}
          values={[
            { column: "Value", agg: "sum", label: "Revenue" },
            { column: "Value", agg: "avg", label: "Avg Deal Size" },
          ]}
          engine={engine}
        />
      </div>

      {/* Combo Chart: Revenue vs Goal by Territory */}
      <div className="col-span-6">
        <div className="text-sm font-medium text-muted-foreground mb-2">Revenue vs Goal by Territory</div>
        <ComboChartVisual
          table="Opportunities"
          category={{ column: "Territory" }}
          bars={[{ column: "Value", agg: "sum", label: "Revenue Won" }]}
          lines={[{ column: "Value", agg: "avg", label: "Avg Deal Size" }]}
          engine={engine}
        />
      </div>

      {/* Pipeline Stage Breakdown */}
      <div className="col-span-6">
        <div className="text-sm font-medium text-muted-foreground mb-2">Revenue by Pipeline Stage</div>
        <ComboChartVisual
          table="Opportunities"
          category={{ column: "PipelineStep" }}
          bars={[{ column: "Value", agg: "sum", label: "Revenue" }]}
          lines={[{ column: "Value", agg: "count", label: "Opportunity Count" }]}
          engine={engine}
        />
      </div>

      {/* Revenue by Status */}
      <div className="col-span-6">
        <div className="text-sm font-medium text-muted-foreground mb-2">Revenue by Status</div>
        <LineChartVisual
          table="Opportunities"
          category={{ column: "Status" }}
          values={[
            { column: "Value", agg: "sum", label: "Revenue" },
            { column: "Value", agg: "count", label: "Count" },
          ]}
          engine={engine}
        />
      </div>

      {/* Detail Tables */}
      <div className="col-span-6">
        <div className="text-sm font-medium text-muted-foreground mb-2">Owner Revenue Detail</div>
        <DataTableVisual
          table="Opportunities"
          columns={[
            { column: "Owner", role: "row" },
            { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue" },
            { column: "Value", agg: "count", role: "value", format: "compact", label: "Deals" },
            { column: "Value", agg: "avg", role: "value", format: "currency", label: "Avg Deal" },
          ]}
          engine={engine}
          virtualized={false}
        />
      </div>
      <div className="col-span-6">
        <div className="text-sm font-medium text-muted-foreground mb-2">Territory Revenue Detail</div>
        <DataTableVisual
          table="Opportunities"
          columns={[
            { column: "Territory", role: "row" },
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
