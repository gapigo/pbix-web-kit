import { KpiCard, BarChartVisual, ComboChartVisual, DataTableVisual } from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

export default function TrendAnalytics({ engine }: Props) {
  const wonFilter = [{ column: "Status", op: "eq" as const, values: ["Won"] }]
  const openFilter = [{ column: "Status", op: "eq" as const, values: ["Open"] }]

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* KPI Row */}
      <div className="col-span-3">
        <KpiCard
          measure={{ table: "v_opportunities", column: "Value", agg: "sum" }}
          label="Revenue Won"
          engine={engine}
          filters={wonFilter}
          format="currency"
        />
      </div>
      <div className="col-span-3">
        <KpiCard
          measure={{ table: "v_opportunities", column: "Value", agg: "avg" }}
          label="Avg Deal Size"
          engine={engine}
          format="currency"
        />
      </div>
      <div className="col-span-3">
        <KpiCard
          measure={{ table: "v_opportunities", column: "Value", agg: "sum" }}
          label="Pipeline Revenue"
          engine={engine}
          filters={openFilter}
          format="currency"
        />
      </div>
      <div className="col-span-3">
        <KpiCard
          measure={{ table: "v_opportunities", column: "OpportunitySeq", agg: "count" }}
          label="Total Opportunities"
          engine={engine}
          format="compact"
        />
      </div>

      {/* Revenue Trend by Close Date (combo: bars=revenue, line=avg deal) */}
      <div className="col-span-12">
        <div className="text-sm font-medium text-muted-foreground mb-2">Revenue Trend by Close Date</div>
        <ComboChartVisual
          table="v_opportunities"
          category={{ column: "CloseDate" }}
          bars={[{ column: "Value", agg: "sum", label: "Revenue Won" }]}
          lines={[{ column: "Value", agg: "avg", label: "Avg Deal Size" }]}
          engine={engine}
          filters={wonFilter}
        />
      </div>

      {/* Revenue by Sales Stage */}
      <div className="col-span-6">
        <div className="text-sm font-medium text-muted-foreground mb-2">Revenue by Sales Stage</div>
        <ComboChartVisual
          table="v_opportunities"
          category={{ column: "Sales Stage" }}
          bars={[{ column: "Value", agg: "sum", label: "Revenue" }]}
          lines={[{ column: "OpportunitySeq", agg: "count", label: "Opportunity Count" }]}
          engine={engine}
        />
      </div>

      {/* Revenue by Territory */}
      <div className="col-span-6">
        <div className="text-sm font-medium text-muted-foreground mb-2">Revenue by Territory</div>
        <BarChartVisual
          table="v_opportunities"
          category={{ column: "Territory", maxItems: 15 }}
          values={[{ column: "Value", agg: "sum", label: "Revenue Won" }]}
          engine={engine}
          filters={wonFilter}
        />
      </div>

      {/* Revenue by Product */}
      <div className="col-span-6">
        <div className="text-sm font-medium text-muted-foreground mb-2">Revenue by Product</div>
        <BarChartVisual
          table="v_opportunities"
          category={{ column: "Product", maxItems: 10 }}
          values={[{ column: "Value", agg: "sum", label: "Revenue Won" }]}
          engine={engine}
          filters={wonFilter}
        />
      </div>

      {/* Owner Revenue Detail */}
      <div className="col-span-6">
        <div className="text-sm font-medium text-muted-foreground mb-2">Owner Revenue Detail</div>
        <DataTableVisual
          table="v_opportunities"
          columns={[
            { column: "Owner", role: "row" },
            { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue Won" },
            { column: "Value", agg: "count", role: "value", format: "compact", label: "Deals" },
          ]}
          engine={engine}
          filters={wonFilter}
          virtualized={false}
        />
      </div>
    </div>
  )
}
