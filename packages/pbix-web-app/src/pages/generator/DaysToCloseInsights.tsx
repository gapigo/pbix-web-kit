import { useAggregation, useDistinctValues, useFilter, useFilters } from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
  ScatterChart, Scatter, Cell,
} from "recharts"
import {
  colors, cardClass, kpiValueClass, kpiLabelClass, sectionLabelClass,
  tableHeaderClass, tableCellClass, filterChipClass,
  fmtCurrency, fmtNum, fmtPct,
  CustomTooltip, CHART_HEIGHT, axisStyle, gridStyle, currencyTick, numTick,
} from "@/lib/designTokens"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

const SALES_STAGES = [
  "Prospecting", "Qualification", "Needs Analysis", "Proposal/Quote",
  "Negotiation", "Closed Won", "Closed Lost",
]

export default function DaysToCloseInsights({ engine, store }: Props) {
  const [stageFilter, setStageFilter] = useFilter(store, "v_opportunities.Sales Stage")
  const [productFilter, setProductFilter] = useFilter(store, "v_opportunities.Product")
  const allFilters = useFilters(store)
  const filterArr = Object.values(allFilters).flat()

  const activeStage = stageFilter?.values?.[0] ?? null
  const activeProduct = productFilter?.values?.[0] ?? null

  const wonFilter = { column: "Status", op: "eq" as const, values: ["Won"] }
  const wonArr = [...filterArr, wonFilter]

  // Distinct Products
  const products = useDistinctValues(engine, "v_opportunities", "Product")

  // KPI: Avg Days to Close (Won)
  const avgDays = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "DaysToClose", fn: "avg", alias: "val" }],
    filters: wonArr.length > 0 ? wonArr : undefined,
  })

  // KPI: Median Deal Size (Won)
  const medianDeal = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Value", fn: "avg", alias: "val" }],
    filters: wonArr.length > 0 ? wonArr : undefined,
  })

  // KPI: Total Closed Deals (Won count)
  const closedDeals = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Value", fn: "count", alias: "val" }],
    filters: wonArr.length > 0 ? wonArr : undefined,
  })

  // KPI: Close Rate (Won / Total with Status not Open)
  const wonCount = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "OpportunitySeq", fn: "count", alias: "val" }],
    filters: [{ column: "Status", op: "eq", values: ["Won"] }],
  })
  const totalDecided = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "OpportunitySeq", fn: "count", alias: "val" }],
    filters: [{ column: "Status", op: "in", values: ["Won", "Lost"] }],
  })

  // Bar: Avg Days to Close by Product (horizontal)
  const barData = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Product"],
    measures: [{ column: "DaysToClose", fn: "avg", alias: "val" }],
    filters: wonArr.length > 0 ? wonArr : undefined,
    orderBy: [{ column: "val", dir: "desc" }],
    limit: 12,
  })

  // Scatter: DaysToClose vs Value by Sales Stage
  const scatterData = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Sales Stage", "OpportunitySeq"],
    measures: [
      { column: "DaysToClose", fn: "avg", alias: "days" },
      { column: "Value", fn: "avg", alias: "val" },
    ],
    filters: filterArr.length > 0 ? filterArr : undefined,
    limit: 200,
  })

  // Table: Product × Avg Days × Revenue × Count
  const tableData = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Product"],
    measures: [
      { column: "DaysToClose", fn: "avg", alias: "avgDays" },
      { column: "Value", fn: "sum", alias: "revenue" },
      { column: "OpportunitySeq", fn: "count", alias: "cnt" },
    ],
    filters: wonArr.length > 0 ? wonArr : undefined,
    orderBy: [{ column: "revenue", dir: "desc" }],
    limit: 20,
  })

  const closeRate = wonCount.data?.[0]?.val != null && totalDecided.data?.[0]?.val != null
    ? (wonCount.data[0].val as number) / (totalDecided.data[0].val as number)
    : null

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* == FILTERS == */}
      <div className="col-span-12 flex items-center gap-4 flex-wrap">
        {/* Stage chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={sectionLabelClass}>Stage:</span>
          {SALES_STAGES.map((s) => (
            <button
              key={s}
              onClick={() =>
                setStageFilter(
                  activeStage === s ? null : { column: "v_opportunities.Sales Stage", op: "eq", values: [s] }
                )
              }
              className={filterChipClass(activeStage === s)}
            >
              {s}
            </button>
          ))}
          {activeStage && (
            <button onClick={() => setStageFilter(null)} className="text-[11px] text-[#6B7280] underline ml-1">
              Clear
            </button>
          )}
        </div>

        {/* Product select */}
        <select
          value={activeProduct ?? ""}
          onChange={(e) =>
            setProductFilter(
              e.target.value ? { column: "v_opportunities.Product", op: "eq", values: [e.target.value] } : null
            )
          }
          className="border border-[#E2E8F0] rounded-md px-3 py-1.5 text-sm bg-white text-[#1F2937]"
        >
          <option value="">All Products</option>
          {(products.data ?? []).map((p: string) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* == KPIs == */}
      <div className={`${cardClass} col-span-3`}>
        <p className={kpiLabelClass}>Avg Days to Close</p>
        <p className={kpiValueClass}>{fmtNum(avgDays.data?.[0]?.val as number | null)}</p>
      </div>
      <div className={`${cardClass} col-span-3`}>
        <p className={kpiLabelClass}>Median Deal Size</p>
        <p className={kpiValueClass}>{fmtCurrency(medianDeal.data?.[0]?.val as number | null)}</p>
      </div>
      <div className={`${cardClass} col-span-3`}>
        <p className={kpiLabelClass}>Total Closed Deals</p>
        <p className={kpiValueClass}>{fmtNum(closedDeals.data?.[0]?.val as number | null)}</p>
      </div>
      <div className={`${cardClass} col-span-3`}>
        <p className={kpiLabelClass}>Close Rate</p>
        <p className={kpiValueClass}>{fmtPct(closeRate)}</p>
      </div>

      {/* == Bar: Avg Days by Product == */}
      <div className={`${cardClass} col-span-6`}>
        <p className={sectionLabelClass}>Avg Days to Close by Product</p>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT.large}>
          <BarChart data={barData.data ?? []} layout="vertical" margin={{ left: 20, right: 20 }}>
            <CartesianGrid {...gridStyle} />
            <XAxis type="number" tick={numTick} {...axisStyle} />
            <YAxis type="category" dataKey="Product" width={100} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip formatter={fmtNum} />} />
            <Bar dataKey="val" fill={colors.brand} radius={[0, 4, 4, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* == Scatter: DaysToClose vs Value == */}
      <div className={`${cardClass} col-span-6`}>
        <p className={sectionLabelClass}>Days to Close vs Deal Value by Stage</p>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT.scatter}>
          <ScatterChart margin={{ left: 10, right: 20 }}>
            <CartesianGrid {...gridStyle} />
            <XAxis type="number" dataKey="days" name="Days to Close" tick={numTick} {...axisStyle} label={{ value: "Days to Close", position: "bottom", style: { fontSize: 10, fill: "#9CA3AF" } }} />
            <YAxis type="number" dataKey="val" name="Value" tick={currencyTick} {...axisStyle} />
            <Tooltip content={<CustomTooltip formatter={(v: number) => fmtCurrency(v)} />} />
            <Scatter data={scatterData.data ?? []} fill={colors.brand} opacity={0.6}>
              {(scatterData.data ?? []).map((entry: any, i: number) => (
                <Cell key={i} fill={colors.chart[i % colors.chart.length]} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* == Table: Product breakdown == */}
      <div className={`${cardClass} col-span-12`}>
        <p className={sectionLabelClass}>Product Performance — Closed Won</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className={tableHeaderClass}>Product</th>
                <th className={tableHeaderClass}>Avg Days to Close</th>
                <th className={tableHeaderClass}>Revenue</th>
                <th className={tableHeaderClass}>Deals</th>
              </tr>
            </thead>
            <tbody>
              {(tableData.data ?? []).map((row: any, i: number) => (
                <tr key={i} className="hover:bg-[#F1F5F9] transition-colors">
                  <td className={tableCellClass}>{row.Product}</td>
                  <td className={tableCellClass}>{fmtNum(row.avgDays)}</td>
                  <td className={tableCellClass}>{fmtCurrency(row.revenue)}</td>
                  <td className={tableCellClass}>{fmtNum(row.cnt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
