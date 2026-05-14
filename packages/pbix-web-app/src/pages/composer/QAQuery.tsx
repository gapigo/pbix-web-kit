import { KpiCard, DataTableVisual, SlicerVisual } from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"

interface Props {
  engine: QueryEngine | null
}

export default function QAQuery({ engine }: Props) {
  return (
    <div className="grid grid-cols-12 gap-4">
      {/* KPI Row — summary aggregates */}
      <div className="col-span-3">
        <KpiCard measure={{ table: "v_opportunities", column: "Value", agg: "sum" }} label="Total Revenue" engine={engine} format="currency" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "v_opportunities", column: "OpportunitySeq", agg: "count" }} label="Total Opportunities" engine={engine} format="compact" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "v_opportunities", column: "Value", agg: "avg" }} label="Avg Deal Size" engine={engine} format="currency" />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "v_opportunities", column: "Discount", agg: "avg" }} label="Avg Discount %" engine={engine} format="percent" />
      </div>

      {/* Slicers — quick dimension filters */}
      <div className="col-span-3">
        <SlicerVisual table="v_opportunities" column="Status" label="Status" engine={engine} />
      </div>
      <div className="col-span-3">
        <SlicerVisual table="v_opportunities" column="Sales Stage" label="Sales Stage" engine={engine} />
      </div>
      <div className="col-span-6" />

      {/* Detail table — all opportunity fields as raw rows */}
      <div className="col-span-12">
        <DataTableVisual
          table="v_opportunities"
          columns={[
            { column: "Account Name", role: "row" },
            { column: "Status", role: "row" },
            { column: "Sales Stage", role: "row" },
            { column: "Product", role: "row" },
            { column: "Product LOB", role: "row" },
            { column: "Territory", role: "row" },
            { column: "Region", role: "row" },
            { column: "Owner", role: "row" },
            { column: "Manager", role: "row" },
            { column: "Industry", role: "row" },
            { column: "Value", role: "row", format: "currency" },
            { column: "Discount", role: "row", format: "percent" },
            { column: "CloseDate", role: "row" },
            { column: "Weeks Open", role: "row" },
            { column: "DaysToClose", role: "row" },
            { column: "State Or Province", role: "row" },
          ]}
          engine={engine}
          virtualized={false}
        />
      </div>
    </div>
  )
}
