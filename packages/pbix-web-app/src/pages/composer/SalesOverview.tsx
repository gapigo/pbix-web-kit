import { KpiCard, BarChartVisual, DataTableVisual, MapPlaceholder, ComboChartVisual, FunnelVisual, SlicerVisual } from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

interface Props { engine: QueryEngine | null; store: UseBoundStore<StoreApi<DashboardStore>> }

export default function SalesOverview({ engine }: Props) {
  const wonFilters = [{ column: "Status", op: "eq" as const, values: ["Won"] }]
  const openFilters = [{ column: "Status", op: "eq" as const, values: ["Open"] }]

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* KPI Row — use v_opportunities for direct column access */}
      <div className="col-span-3">
        <KpiCard measure={{ table: "v_opportunities", column: "Value", agg: "sum" }} label="Revenue Won" engine={engine} filters={wonFilters} format="currency" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "v_opportunities", column: "Value", agg: "sum" }} label="Revenue Pipeline" engine={engine} filters={openFilters} format="currency" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "v_opportunities", column: "Value", agg: "sum" }} label="Total Pipeline Value" engine={engine} format="currency" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "v_opportunities", column: "OpportunitySeq", agg: "count" }} label="Total Opportunities" engine={engine} format="compact" />
      </div>

      {/* Slicer: Sales Stage */}
      <div className="col-span-3">
        <SlicerVisual table="v_opportunities" column="Sales Stage" label="Sales Stage" engine={engine} />
      </div>

      {/* Bar chart: Revenue by Product */}
      <div className="col-span-9">
        <BarChartVisual table="v_opportunities" category={{ column: "Product", maxItems: 10 }} values={[{ column: "Value", agg: "sum", label: "Revenue Won" }]} engine={engine} filters={wonFilters} />
      </div>

      {/* Revenue by Territory */}
      <div className="col-span-6">
        <BarChartVisual table="v_opportunities" category={{ column: "Territory", maxItems: 15 }} values={[{ column: "Value", agg: "sum", label: "Revenue Won" }]} engine={engine} filters={wonFilters} />
      </div>

      {/* Map placeholder */}
      <div className="col-span-6"><MapPlaceholder name="Revenue by Territory" /></div>

      {/* Funnel by Sales Stage */}
      <div className="col-span-12">
        <FunnelVisual table="v_opportunities" category={{ column: "Sales Stage" }} value={{ column: "Value", agg: "sum", label: "Revenue" }} engine={engine} />
      </div>

      {/* Tables: by Product, by Territory */}
      <div className="col-span-6">
        <DataTableVisual table="v_opportunities" columns={[
          { column: "Product", role: "row" },
          { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue Won" },
        ]} engine={engine} filters={wonFilters} virtualized={false} />
      </div>
      <div className="col-span-6">
        <DataTableVisual table="v_opportunities" columns={[
          { column: "Territory", role: "row" },
          { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue Won" },
        ]} engine={engine} filters={wonFilters} virtualized={false} />
      </div>
    </div>
  )
}
