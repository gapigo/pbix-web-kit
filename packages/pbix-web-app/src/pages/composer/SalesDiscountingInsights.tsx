import { KpiCard, BarChartVisual, DataTableVisual } from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"

interface Props { engine: QueryEngine | null }

export default function SalesDiscountingInsights({ engine }: Props) {
  const wonFilter = [{ column: "Status", op: "eq" as const, values: ["Won"] }]

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* KPI Row */}
      <div className="col-span-3">
        <KpiCard measure={{ table: "v_opportunities", column: "Discount", agg: "avg" }} label="Avg Discount" engine={engine} format="percent" color="#4f46e5" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "v_opportunities", column: "Discount", agg: "min" }} label="Min Discount" engine={engine} format="percent" color="#0891b2" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "v_opportunities", column: "Discount", agg: "max" }} label="Max Discount" engine={engine} format="percent" color="#059669" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "v_opportunities", column: "Value", agg: "count" }} label="Won Deals" engine={engine} filters={wonFilter} format="compact" />
      </div>

      {/* Avg Discount by Product */}
      <div className="col-span-6">
        <BarChartVisual table="v_opportunities" category={{ column: "Product", maxItems: 10 }} values={[{ column: "Discount", agg: "avg", label: "Avg Discount" }]} engine={engine} filters={wonFilter} />
      </div>

      {/* Avg Discount by Territory */}
      <div className="col-span-6">
        <BarChartVisual table="v_opportunities" category={{ column: "Territory", maxItems: 10 }} values={[{ column: "Discount", agg: "avg", label: "Avg Discount" }]} engine={engine} filters={wonFilter} />
      </div>

      {/* Discount Detail Table */}
      <div className="col-span-12">
        <DataTableVisual table="v_opportunities" columns={[
          { column: "Product", role: "row" },
          { column: "Territory", role: "row" },
          { column: "Owner", role: "row" },
          { column: "Discount", agg: "avg", role: "value", format: "percent", label: "Avg Discount" },
          { column: "Discount", agg: "min", role: "value", format: "percent", label: "Min Discount" },
          { column: "Discount", agg: "max", role: "value", format: "percent", label: "Max Discount" },
          { column: "Value", agg: "count", role: "value", label: "Deals" },
        ]} engine={engine} filters={wonFilter} virtualized={false} />
      </div>
    </div>
  )
}
