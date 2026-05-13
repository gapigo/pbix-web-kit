import { KpiCard, BarChartVisual, LineChartVisual, DataTableVisual } from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"

interface Props {
  engine: QueryEngine | null
}

export default function Template({ engine }: Props) {
  const wonFilters = [{ column: "Status", op: "eq" as const, values: ["Won"] }]
  const openFilters = [{ column: "Status", op: "eq" as const, values: ["Open"] }]

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* KPI Row */}
      <div className="col-span-3">
        <KpiCard measure={{ table: "v_opportunities", column: "Value", agg: "sum" }} label="Revenue Won" engine={engine} filters={wonFilters} format="currency" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "v_opportunities", column: "Value", agg: "sum" }} label="Pipeline Revenue" engine={engine} filters={openFilters} format="currency" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "v_opportunities", column: "Value", agg: "avg" }} label="Avg Deal Size" engine={engine} format="currency" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "v_opportunities", column: "OpportunitySeq", agg: "count" }} label="Total Opportunities" engine={engine} format="compact" />
      </div>

      {/* Bar: Revenue by Product */}
      <div className="col-span-6">
        <BarChartVisual
          table="v_opportunities"
          category={{ column: "Product", maxItems: 10 }}
          values={[{ column: "Value", agg: "sum", label: "Revenue" }]}
          engine={engine}
        />
      </div>

      {/* Line: Revenue Trend by CloseDate */}
      <div className="col-span-6">
        <LineChartVisual
          table="v_opportunities"
          category={{ column: "CloseDate" }}
          values={[{ column: "Value", agg: "sum", label: "Revenue Won" }]}
          engine={engine}
          filters={wonFilters}
        />
      </div>

      {/* Table: Revenue by Territory */}
      <div className="col-span-12">
        <DataTableVisual
          table="v_opportunities"
          columns={[
            { column: "Territory", role: "row" },
            { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue" },
            { column: "OpportunitySeq", agg: "count", role: "value", format: "compact", label: "Deals" },
          ]}
          engine={engine}
          virtualized={false}
        />
      </div>
    </div>
  )
}
