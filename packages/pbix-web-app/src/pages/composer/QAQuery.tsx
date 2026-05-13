import { KpiCard, BarChartVisual, DataTableVisual, SlicerVisual } from "@pbix/runtime"
import { useStore } from "../../boot"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

export default function QAQuery({ engine }: Props) {
  const store = useStore()!

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* KPI Row — top-level indicators */}
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Value", agg: "sum" }} label="Total Revenue" engine={engine} format="currency" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Value", agg: "count" }} label="Total Deals" engine={engine} format="compact" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Value", agg: "avg" }} label="Avg Deal Size" engine={engine} format="currency" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Discount", agg: "avg" }} label="Avg Discount %" engine={engine} format="percent" />
      </div>

      {/* Filter Row — quick dimension filters */}
      <div className="col-span-3">
        <SlicerVisual table="Opportunities" column="Status" label="Status" engine={engine} />
      </div>
      <div className="col-span-3">
        <SlicerVisual table="Opportunities" column="PipelineStep" label="Pipeline Step" engine={engine} />
      </div>
      <div className="col-span-3">
        <SlicerVisual table="Opportunities" column="Sales Stage" label="Sales Stage" engine={engine} />
      </div>
      <div className="col-span-3">
        <SlicerVisual table="Opportunities" column="Product LOB" label="Product LOB" engine={engine} />
      </div>

      {/* Revenue by Product — bar chart */}
      <div className="col-span-6">
        <div className="text-sm font-medium text-muted-foreground mb-2">Revenue by Product</div>
        <BarChartVisual
          table="Opportunities"
          category={{ column: "Product", maxItems: 10 }}
          values={[
            { column: "Value", agg: "sum", label: "Revenue" },
            { column: "Value", agg: "count", label: "Deal Count" },
          ]}
          engine={engine}
        />
      </div>

      {/* Revenue by Territory — bar chart */}
      <div className="col-span-6">
        <div className="text-sm font-medium text-muted-foreground mb-2">Revenue by Territory</div>
        <BarChartVisual
          table="Opportunities"
          category={{ column: "Territory", maxItems: 10 }}
          values={[
            { column: "Value", agg: "sum", label: "Revenue" },
            { column: "Value", agg: "avg", label: "Avg Deal" },
          ]}
          engine={engine}
        />
      </div>

      {/* Large detail table — full ad-hoc query result */}
      <div className="col-span-12">
        <div className="text-sm font-medium text-muted-foreground mb-2">Opportunity Detail — Ad-Hoc Query</div>
        <DataTableVisual
          table="Opportunities"
          columns={[
            { column: "Product", role: "row" },
            { column: "Territory", role: "row" },
            { column: "Owner", role: "row" },
            { column: "Industry", role: "row" },
            { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue" },
            { column: "Value", agg: "count", role: "value", format: "compact", label: "Deals" },
            { column: "Value", agg: "avg", role: "value", format: "currency", label: "Avg Deal" },
            { column: "Discount", agg: "avg", role: "value", format: "percent", label: "Discount" },
          ]}
          engine={engine}
          virtualized={false}
        />
      </div>
    </div>
  )
}
