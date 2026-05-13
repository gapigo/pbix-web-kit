import { KpiCard, BarChartVisual, DataTableVisual, GaugeVisual, FunnelVisual, SlicerVisual } from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

export default function SalesDiscountingInsights({ engine }: Props) {
  return (
    <div className="grid grid-cols-12 gap-4">
      {/* KPI Row */}
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Discount", agg: "avg" }} label="Avg Discount" engine={engine} format="percent" color="#4f46e5" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Discount", agg: "sum" }} label="Total Discount" engine={engine} format="currency" color="#0891b2" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Value", agg: "count" }} label="Discounted Opps" engine={engine} filters={[{ column: "Discount", op: "gt", values: [0] }]} format="compact" color="#059669" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "Opportunities", column: "Value", agg: "sum" }} label="Revenue Impact" engine={engine} format="currency" color="#d97706" />
      </div>

      {/* Slicers */}
      <div className="col-span-2">
        <SlicerVisual table="Opportunities" column="Product" label="Product" engine={engine} />
      </div>
      <div className="col-span-2">
        <SlicerVisual table="Opportunities" column="Territory" label="Territory" engine={engine} />
      </div>

      {/* Gauge - Discount vs Target */}
      <div className="col-span-4">
        <GaugeVisual table="Opportunities" measure={{ column: "Discount", agg: "avg", label: "Avg Discount" }} target={0.15} engine={engine} />
      </div>

      {/* Discount by Product */}
      <div className="col-span-4">
        <BarChartVisual
          table="Opportunities"
          category={{ column: "Product", maxItems: 10 }}
          values={[{ column: "Discount", agg: "avg", label: "Avg Discount" }]}
          engine={engine}
        />
      </div>

      {/* Discount by Territory */}
      <div className="col-span-6">
        <BarChartVisual
          table="Opportunities"
          category={{ column: "Territory", maxItems: 10 }}
          values={[{ column: "Discount", agg: "avg", label: "Avg Discount" }]}
          engine={engine}
        />
      </div>

      {/* Funnel - Discount by Pipeline Stage */}
      <div className="col-span-6">
        <FunnelVisual
          table="Opportunities"
          category={{ column: "PipelineStep" }}
          value={{ column: "Discount", agg: "avg", label: "Avg Discount %" }}
          engine={engine}
        />
      </div>

      {/* Discount Details Table */}
      <div className="col-span-12">
        <DataTableVisual
          table="Opportunities"
          columns={[
            { column: "Territory", role: "row" },
            { column: "Product", role: "row" },
            { column: "Owner", role: "row" },
            { column: "Discount", agg: "avg", role: "value", format: "percent", label: "Avg Discount" },
            { column: "Discount", agg: "sum", role: "value", format: "currency", label: "Total Discount" },
            { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue at Full Price" },
          ]}
          engine={engine}
          virtualized={false}
        />
      </div>
    </div>
  )
}
