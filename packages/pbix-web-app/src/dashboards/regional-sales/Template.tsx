import { useAggregation, useDistinctValues, useFilter, useFilters } from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
  LineChart, Line,
  PieChart, Pie, Cell,
} from "recharts"
import {
  colors, cardClass, kpiValueClass, kpiLabelClass, sectionLabelClass,
  tableHeaderClass, tableCellClass,
  fmtCurrency, fmtNum, fmtPct,
  CustomTooltip, CHART_HEIGHT, axisStyle, gridStyle, currencyTick, numTick,
} from "@/lib/designTokens"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

export default function Template({ engine, store }: Props) {
  const [stageFilter, setStageFilter] = useFilter(store, "v_opportunities.Sales Stage")
  const [territoryFilter, setTerritoryFilter] = useFilter(store, "v_opportunities.Territory")
  const [industryFilter, setIndustryFilter] = useFilter(store, "v_opportunities.Industry")
  const allFilters = useFilters(store)
  const filterArr = Object.values(allFilters).flat()

  const activeStage = stageFilter?.values?.[0] ?? null
  const activeTerritory = territoryFilter?.values?.[0] ?? null
  const activeIndustry = industryFilter?.values?.[0] ?? null

  // Distinct values for filter dropdowns
  const stages = useDistinctValues(engine, "v_opportunities", "Sales Stage")
  const territories = useDistinctValues(engine, "v_opportunities", "Territory")
  const industries = useDistinctValues(engine, "v_opportunities", "Industry")

  // ── 6 KPIs ──
  const totalRevenue = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Value", fn: "sum", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
  })
  const totalDeals = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "OpportunitySeq", fn: "count", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
  })
  const avgDealSize = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Value", fn: "avg", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
  })
  const winRate = useAggregation(engine, {
    table: "v_opportunities",
    measures: [
      { column: "OpportunitySeq", fn: "count", alias: "won" },
    ],
    filters: [...filterArr, { column: "Status", op: "eq", values: ["Won"] }],
  })
  const totalDecided = useAggregation(engine, {
    table: "v_opportunities",
    measures: [
      { column: "OpportunitySeq", fn: "count", alias: "total" },
    ],
    filters: [...filterArr, { column: "Status", op: "in", values: ["Won", "Lost"] }],
  })
  const pipelineValue = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Value", fn: "sum", alias: "val" }],
    filters: [...filterArr, { column: "Status", op: "eq", values: ["Open"] }],
  })
  const activeDeals = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "OpportunitySeq", fn: "count", alias: "val" }],
    filters: [...filterArr, { column: "Status", op: "eq", values: ["Open"] }],
  })

  const wonVal = winRate.data?.[0]?.won as number | undefined
  const decidedVal = totalDecided.data?.[0]?.total as number | undefined
  const wr = wonVal != null && decidedVal != null && decidedVal > 0 ? wonVal / decidedVal : null

  // ── Chart 1: Revenue by Product (bar) ──
  const productRevenue = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Product"],
    measures: [{ column: "Value", fn: "sum", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "val", dir: "desc" }],
    limit: 10,
  })

  // ── Chart 2: Revenue Trend (line) ──
  const revenueTrend = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["CloseDate"],
    measures: [{ column: "Value", fn: "sum", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "CloseDate", dir: "asc" }],
  })

  // ── Chart 3: Pipeline Funnel (pie) ──
  const pipelineByStage = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Sales Stage"],
    measures: [{ column: "Value", fn: "sum", alias: "val" }],
    filters: [...filterArr, { column: "Status", op: "eq", values: ["Open"] }],
    orderBy: [{ column: "val", dir: "desc" }],
  })

  // ── Table: Top Deals by Account ──
  const topDeals = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Account Name"],
    measures: [
      { column: "Value", fn: "sum", alias: "revenue" },
      { column: "OpportunitySeq", fn: "count", alias: "cnt" },
      { column: "Discount", fn: "avg", alias: "avgDisc" },
    ],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "revenue", dir: "desc" }],
    limit: 15,
  })

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* ═══ SIDEBAR FILTER PANEL — right side ═══ */}
      <div className="col-span-9 grid grid-cols-12 gap-4">
        {/* ═══ KPI ROW 1 ═══ */}
        <div className={`${cardClass} col-span-4`}>
          <p className={kpiLabelClass}>Total Revenue</p>
          <p className={kpiValueClass}>{fmtCurrency(totalRevenue.data?.[0]?.val as number | null)}</p>
        </div>
        <div className={`${cardClass} col-span-4`}>
          <p className={kpiLabelClass}>Total Deals</p>
          <p className={kpiValueClass}>{fmtNum(totalDeals.data?.[0]?.val as number | null)}</p>
        </div>
        <div className={`${cardClass} col-span-4`}>
          <p className={kpiLabelClass}>Avg Deal Size</p>
          <p className={kpiValueClass}>{fmtCurrency(avgDealSize.data?.[0]?.val as number | null)}</p>
        </div>

        {/* ═══ KPI ROW 2 ═══ */}
        <div className={`${cardClass} col-span-4`}>
          <p className={kpiLabelClass}>Win Rate</p>
          <p className={kpiValueClass}>{fmtPct(wr)}</p>
        </div>
        <div className={`${cardClass} col-span-4`}>
          <p className={kpiLabelClass}>Pipeline Value</p>
          <p className={kpiValueClass}>{fmtCurrency(pipelineValue.data?.[0]?.val as number | null)}</p>
        </div>
        <div className={`${cardClass} col-span-4`}>
          <p className={kpiLabelClass}>Active Deals</p>
          <p className={kpiValueClass}>{fmtNum(activeDeals.data?.[0]?.val as number | null)}</p>
        </div>

        {/* ═══ CHART 1: Revenue by Product ═══ */}
        <div className={`${cardClass} col-span-6`}>
          <p className={sectionLabelClass}>Revenue by Product</p>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.large}>
            <BarChart data={productRevenue.data ?? []} margin={{ left: 10, right: 20 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="Product" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={currencyTick} {...axisStyle} />
              <Tooltip content={<CustomTooltip formatter={(v: number) => fmtCurrency(v)} />} />
              <Bar dataKey="val" fill={colors.brand} radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ═══ CHART 2: Revenue Trend ═══ */}
        <div className={`${cardClass} col-span-6`}>
          <p className={sectionLabelClass}>Revenue Trend</p>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.large}>
            <LineChart data={revenueTrend.data ?? []} margin={{ left: 10, right: 20 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="CloseDate" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={currencyTick} {...axisStyle} />
              <Tooltip content={<CustomTooltip formatter={(v: number) => fmtCurrency(v)} />} />
              <Line
                type="monotone"
                dataKey="val"
                stroke={colors.electric}
                strokeWidth={2}
                dot={{ r: 3, fill: colors.electric }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ═══ CHART 3: Pipeline Funnel (pie) ═══ */}
        <div className={`${cardClass} col-span-6`}>
          <p className={sectionLabelClass}>Pipeline by Stage</p>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.donut}>
            <PieChart>
              <Pie
                data={pipelineByStage.data ?? []}
                dataKey="val"
                nameKey="Sales Stage"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {(pipelineByStage.data ?? []).map((_: any, i: number) => (
                  <Cell key={i} fill={colors.chart[i % colors.chart.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip formatter={(v: number) => fmtCurrency(v)} />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* ═══ TABLE: Top Deals by Account ═══ */}
        <div className={`${cardClass} col-span-12`}>
          <p className={sectionLabelClass}>Top Deals by Account</p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={tableHeaderClass}>Account Name</th>
                  <th className={tableHeaderClass}>Revenue</th>
                  <th className={tableHeaderClass}>Deals</th>
                  <th className={tableHeaderClass}>Avg Discount</th>
                </tr>
              </thead>
              <tbody>
                {(topDeals.data ?? []).map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-[#F1F5F9] transition-colors">
                    <td className={tableCellClass}>{row["Account Name"]}</td>
                    <td className={tableCellClass}>{fmtCurrency(row.revenue)}</td>
                    <td className={tableCellClass}>{fmtNum(row.cnt)}</td>
                    <td className={tableCellClass}>{fmtPct(row.avgDisc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══ SIDEBAR FILTER PANEL ═══ */}
      <div className="col-span-3 space-y-4">
        <div className={cardClass}>
          <p className={sectionLabelClass}>Filters</p>

          {/* Sales Stage */}
          <div className="mb-4">
            <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6B7280] block mb-1.5">
              Sales Stage
            </label>
            <select
              value={activeStage ?? ""}
              onChange={(e) =>
                setStageFilter(
                  e.target.value
                    ? { column: "v_opportunities.Sales Stage", op: "eq", values: [e.target.value] }
                    : null
                )
              }
              className="w-full border border-[#E2E8F0] rounded-md px-3 py-1.5 text-sm bg-white text-[#1F2937]"
            >
              <option value="">All Stages</option>
              {(stages.data ?? []).map((s: string) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Territory */}
          <div className="mb-4">
            <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6B7280] block mb-1.5">
              Territory
            </label>
            <select
              value={activeTerritory ?? ""}
              onChange={(e) =>
                setTerritoryFilter(
                  e.target.value
                    ? { column: "v_opportunities.Territory", op: "eq", values: [e.target.value] }
                    : null
                )
              }
              className="w-full border border-[#E2E8F0] rounded-md px-3 py-1.5 text-sm bg-white text-[#1F2937]"
            >
              <option value="">All Territories</option>
              {(territories.data ?? []).map((t: string) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Industry */}
          <div className="mb-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6B7280] block mb-1.5">
              Industry
            </label>
            <select
              value={activeIndustry ?? ""}
              onChange={(e) =>
                setIndustryFilter(
                  e.target.value
                    ? { column: "v_opportunities.Industry", op: "eq", values: [e.target.value] }
                    : null
                )
              }
              className="w-full border border-[#E2E8F0] rounded-md px-3 py-1.5 text-sm bg-white text-[#1F2937]"
            >
              <option value="">All Industries</option>
              {(industries.data ?? []).map((ind: string) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          {/* Clear all */}
          {filterArr.length > 0 && (
            <button
              onClick={() => { setStageFilter(null); setTerritoryFilter(null); setIndustryFilter(null) }}
              className="w-full text-[11px] text-[#B91C1C] underline hover:no-underline pt-2"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
