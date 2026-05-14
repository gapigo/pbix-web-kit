import { KpiCard, BarChartVisual, DataTableVisual, ScatterChartVisual, SlicerVisual } from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

export default function DaysToCloseInsights({ engine }: Props) {
  const wonFilter = [{ column: "Status", op: "eq" as const, values: ["Won"] }]

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* KPI Row */}
      <div className="col-span-3">
        <KpiCard measure={{ table: "v_opportunities", column: "DaysToClose", agg: "avg" }} label="Avg Days to Close" engine={engine} filters={wonFilter} format="compact" color="#4f46e5" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "v_opportunities", column: "DaysToClose", agg: "max" }} label="Max Days to Close" engine={engine} filters={wonFilter} format="compact" color="#0891b2" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "v_opportunities", column: "Value", agg: "count" }} label="Won Deals" engine={engine} filters={wonFilter} format="compact" color="#059669" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "v_opportunities", column: "Value", agg: "sum" }} label="Revenue Won" engine={engine} filters={wonFilter} format="currency" color="#d97706" />
      </div>

      {/* Scatter: DaysToClose vs Revenue (by Product) */}
      <div className="col-span-6">
        <ScatterChartVisual
          table="v_opportunities"
          x={{ column: "DaysToClose", agg: "avg", label: "Days to Close" }}
          y={{ column: "Value", agg: "sum", label: "Revenue" }}
          category={{ column: "Product" }}
          engine={engine}
          filters={wonFilter}
        />
      </div>

      {/* Slicer: Sales Stage */}
      <div className="col-span-3">
        <SlicerVisual table="v_opportunities" column="Sales Stage" label="Sales Stage" engine={engine} />
      </div>

      {/* Avg DaysToClose by Territory */}
      <div className="col-span-3">
        <BarChartVisual
          table="v_opportunities"
          category={{ column: "Territory", maxItems: 8 }}
          values={[{ column: "DaysToClose", agg: "avg", label: "Avg Days to Close" }]}
          engine={engine}
          filters={wonFilter}
        />
      </div>

      {/* Avg DaysToClose by Product */}
      <div className="col-span-6">
        <BarChartVisual
          table="v_opportunities"
          category={{ column: "Product", maxItems: 10 }}
          values={[{ column: "DaysToClose", agg: "avg", label: "Avg Days to Close" }]}
          engine={engine}
          filters={wonFilter}
          orientation="horizontal"
        />
      </div>

      {/* Detail Table */}
      <div className="col-span-6">
        <DataTableVisual
          table="v_opportunities"
          columns={[
            { column: "Account Name", role: "row" },
            { column: "Product", role: "row" },
            { column: "Owner", role: "row" },
            { column: "DaysToClose", agg: "avg", role: "value", label: "Days to Close" },
            { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue" },
            { column: "Sales Stage", role: "value", label: "Stage" },
            { column: "CloseDate", role: "value", label: "Close Date" },
          ]}
          engine={engine}
          filters={wonFilter}
          virtualized={false}
        />
      </div>
    </div>
  )
}
