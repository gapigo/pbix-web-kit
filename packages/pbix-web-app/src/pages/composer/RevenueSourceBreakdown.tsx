import { KpiCard, BarChartVisual, TreemapVisual, DataTableVisual } from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

interface Props { engine: QueryEngine | null; store: UseBoundStore<StoreApi<DashboardStore>> }

export default function RevenueSourceBreakdown({ engine }: Props) {
  const wonFilter = [{ column: "Status", op: "eq" as const, values: ["Won"] }]

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* KPI Row — Won revenue metrics */}
      <div className="col-span-4">
        <KpiCard measure={{ table: "v_opportunities", column: "Value", agg: "sum" }} label="Revenue Won" engine={engine} filters={wonFilter} format="currency" color="#4f46e5" />
      </div>
      <div className="col-span-4">
        <KpiCard measure={{ table: "v_opportunities", column: "Value", agg: "avg" }} label="Avg Deal Size" engine={engine} filters={wonFilter} format="currency" color="#0891b2" />
      </div>
      <div className="col-span-4">
        <KpiCard measure={{ table: "v_opportunities", column: "OpportunitySeq", agg: "count" }} label="Deals Won" engine={engine} filters={wonFilter} format="compact" color="#059669" />
      </div>

      {/* Revenue by Product LOB (Treemap) */}
      <div className="col-span-6">
        <TreemapVisual table="v_opportunities" category={{ column: "Product LOB" }} value={{ column: "Value", agg: "sum", label: "Revenue" }} engine={engine} filters={wonFilter} />
      </div>

      {/* Revenue by Product (Treemap) */}
      <div className="col-span-6">
        <TreemapVisual table="v_opportunities" category={{ column: "Product" }} value={{ column: "Value", agg: "sum", label: "Revenue" }} engine={engine} filters={wonFilter} />
      </div>

      {/* Revenue by Territory — bar chart */}
      <div className="col-span-12">
        <BarChartVisual table="v_opportunities" category={{ column: "Territory", maxItems: 12 }} values={[
          { column: "Value", agg: "sum", label: "Revenue", color: "#4f46e5" },
          { column: "OpportunitySeq", agg: "count", label: "Deals", color: "#0891b2" },
        ]} engine={engine} filters={wonFilter} />
      </div>

      {/* Detail Table — by Product LOB, Product, Territory */}
      <div className="col-span-12">
        <DataTableVisual table="v_opportunities" columns={[
          { column: "Product LOB", role: "row" },
          { column: "Product", role: "row" },
          { column: "Territory", role: "row" },
          { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue" },
          { column: "OpportunitySeq", agg: "count", role: "value", format: "compact", label: "Deals" },
          { column: "Value", agg: "avg", role: "value", format: "currency", label: "Avg Deal" },
        ]} engine={engine} filters={wonFilter} virtualized={false} />
      </div>
    </div>
  )
}
