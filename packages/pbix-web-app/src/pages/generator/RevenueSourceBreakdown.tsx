import { useAggregation, useDistinctValues, useFilter, useFilters } from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import {
  colors, cardClass, kpiValueClass, kpiLabelClass, sectionLabelClass,
  tableHeaderClass, tableCellClass,
  fmtCurrency, fmtNum, fmtPct,
  CustomTooltip, CHART_HEIGHT,
} from "@/lib/designTokens"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

export default function RevenueSourceBreakdown({ engine, store }: Props) {
  const [lobFilter, setLobFilter] = useFilter(store, "v_opportunities.Product LOB")
  const [industryFilter, setIndustryFilter] = useFilter(store, "v_opportunities.Industry")
  const allFilters = useFilters(store)
  const filterArr = Object.values(allFilters).flat()

  const activeLOB = lobFilter?.values?.[0] ?? null
  const activeIndustry = industryFilter?.values?.[0] ?? null

  // Distinct values
  const lobs = useDistinctValues(engine, "v_opportunities", "Product LOB")
  const industries = useDistinctValues(engine, "v_opportunities", "Industry")

  // KPI: Total Revenue
  const totalRevenue = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Value", fn: "sum", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
  })

  // LOB breakdown for KPI cards + donut
  const lobRevenue = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Product LOB"],
    measures: [{ column: "Value", fn: "sum", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "val", dir: "desc" }],
  })

  // Industry breakdown Top 8 for donut
  const industryRevenue = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Industry"],
    measures: [{ column: "Value", fn: "sum", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "val", dir: "desc" }],
    limit: 8,
  })

  // Table: Product × Revenue × % of Total × Deals
  const tableData = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Product"],
    measures: [
      { column: "Value", fn: "sum", alias: "revenue" },
      { column: "OpportunitySeq", fn: "count", alias: "cnt" },
    ],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "revenue", dir: "desc" }],
    limit: 20,
  })

  const totalVal = totalRevenue.data?.[0]?.val as number | undefined
  const lobRows = lobRevenue.data ?? []
  const indRows = industryRevenue.data ?? []

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* == FILTERS == */}
      <div className="col-span-12 flex items-center gap-4 flex-wrap">
        {/* Product LOB select */}
        <select
          value={activeLOB ?? ""}
          onChange={(e) =>
            setLobFilter(
              e.target.value
                ? { column: "v_opportunities.Product LOB", op: "eq", values: [e.target.value] }
                : null
            )
          }
          className="border border-[#E2E8F0] rounded-md px-3 py-1.5 text-sm bg-white text-[#1F2937]"
        >
          <option value="">All LOBs</option>
          {(lobs.data ?? []).map((l: string) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        {/* Industry select */}
        <select
          value={activeIndustry ?? ""}
          onChange={(e) =>
            setIndustryFilter(
              e.target.value
                ? { column: "v_opportunities.Industry", op: "eq", values: [e.target.value] }
                : null
            )
          }
          className="border border-[#E2E8F0] rounded-md px-3 py-1.5 text-sm bg-white text-[#1F2937]"
        >
          <option value="">All Industries</option>
          {(industries.data ?? []).map((ind: string) => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
      </div>

      {/* == KPIs == */}
      <div className={`${cardClass} col-span-3`}>
        <p className={kpiLabelClass}>Total Revenue</p>
        <p className={kpiValueClass}>{fmtCurrency(totalVal ?? null)}</p>
      </div>

      {/* LOB KPI cards — up to 3 */}
      {lobRows.slice(0, 3).map((row: any, i: number) => (
        <div key={i} className={`${cardClass} col-span-3`}>
          <p className={kpiLabelClass}>{row["Product LOB"]}</p>
          <p className={kpiValueClass}>{fmtCurrency(row.val)}</p>
        </div>
      ))}
      {/* Pad remaining LOB slots if fewer than 3 */}
      {lobRows.length < 3 && Array.from({ length: 3 - lobRows.length }).map((_, i) => (
        <div key={`pad-${i}`} className={`${cardClass} col-span-3`}>
          <p className={kpiLabelClass}>{lobRows[i]?.["Product LOB"] ?? "\u00A0"}</p>
          <p className={kpiValueClass}>&mdash;</p>
        </div>
      ))}

      {/* == Donut: Revenue by Product LOB == */}
      <div className={`${cardClass} col-span-6`}>
        <p className={sectionLabelClass}>Revenue by Product LOB</p>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT.donut}>
          <PieChart>
            <Pie
              data={lobRows}
              dataKey="val"
              nameKey="Product LOB"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={2}
            >
              {lobRows.map((_: any, i: number) => (
                <Cell key={i} fill={colors.chart[i % colors.chart.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip formatter={(v: number) => fmtCurrency(v)} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* == Donut: Revenue by Industry Top 8 == */}
      <div className={`${cardClass} col-span-6`}>
        <p className={sectionLabelClass}>Revenue by Industry (Top 8)</p>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT.donut}>
          <PieChart>
            <Pie
              data={indRows}
              dataKey="val"
              nameKey="Industry"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={2}
            >
              {indRows.map((_: any, i: number) => (
                <Cell key={i} fill={colors.chart[i % colors.chart.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip formatter={(v: number) => fmtCurrency(v)} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* == Table: Product breakdown == */}
      <div className={`${cardClass} col-span-12`}>
        <p className={sectionLabelClass}>Product Revenue Breakdown</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className={tableHeaderClass}>Product</th>
                <th className={tableHeaderClass}>Revenue</th>
                <th className={tableHeaderClass}>% of Total</th>
                <th className={tableHeaderClass}>Deals</th>
              </tr>
            </thead>
            <tbody>
              {(tableData.data ?? []).map((row: any, i: number) => (
                <tr key={i} className="hover:bg-[#F1F5F9] transition-colors">
                  <td className={tableCellClass}>{row.Product}</td>
                  <td className={tableCellClass}>{fmtCurrency(row.revenue)}</td>
                  <td className={tableCellClass}>
                    {totalVal ? fmtPct(row.revenue / totalVal) : "\u2014"}
                  </td>
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
