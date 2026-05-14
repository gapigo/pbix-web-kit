import { useMemo } from "react"
import { useAggregation, useDistinctValues, useFilter, useFilters } from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip, LineChart, Line, Legend,
} from "recharts"
import {
  cardClass, kpiValueClass, kpiLabelClass, sectionLabelClass,
  tableHeaderClass, tableCellClass, colors,
  fmtCurrency, fmtNum, fmtPct, fmtDate, CustomTooltip,
  CHART_HEIGHT, axisStyle, gridStyle, currencyTick, pctTick,
} from "@/lib/designTokens"

const CHART_COLORS = ["#0F52BA", "#1A7A4A", "#C17D00", "#7C3AED", "#0891B2"]

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

export default function WinLossInsights({ engine, store }: Props) {
  const allFilters = useFilters(store)
  const filterArr = useMemo(() => Object.values(allFilters).flat(), [allFilters])
  const [manager, setManagerFilter] = useFilter(store, "Manager")
  const [industry, setIndustryFilter] = useFilter(store, "Industry")
  const storeFilter = useMemo(() => filterArr, [filterArr])

  const wonFilter = useMemo<{ column: string; op: "eq"; values: string[] }[]>(
    () => [{ column: "Status", op: "eq", values: ["Won"] }],
    [],
  )
  const decidedFilter = useMemo<{ column: string; op: "in"; values: string[] }[]>(
    () => [{ column: "Status", op: "in", values: ["Won", "Lost"] }],
    [],
  )

  const baseWon = useMemo(() => [...wonFilter, ...storeFilter], [wonFilter, storeFilter])
  const baseDecided = useMemo(() => [...decidedFilter, ...storeFilter], [decidedFilter, storeFilter])

  // ── KPI: Revenue Won ──────────────────────────
  const revenueWon = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Value", fn: "sum", alias: "val" }],
    filters: baseWon,
  })

  // ── KPI: Close % ──────────────────────────────
  const closeCounts = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "OpportunitySeq", fn: "count", alias: "cnt" }],
    filters: baseDecided,
  })
  const lostCount = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "OpportunitySeq", fn: "count", alias: "cnt" }],
    filters: [...baseDecided, { column: "Status", op: "eq", values: ["Lost"] }],
  })

  const closePct = useMemo(() => {
    const won = Number(closeCounts.data?.[0]?.cnt ?? 0)
    const lost = Number(lostCount.data?.[0]?.cnt ?? 0)
    return won + lost > 0 ? (won / (won + lost)) * 100 : 0
  }, [closeCounts.data, lostCount.data])

  // ── KPI: Avg Deal Size ─────────────────────────
  const avgDealSize = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Value", fn: "avg", alias: "avg" }],
    filters: baseWon,
  })

  // ── KPI: Best Territory Win Rate ───────────────
  const territoryWinRateData = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Territory", "Status"],
    measures: [{ column: "OpportunitySeq", fn: "count", alias: "cnt" }],
    filters: baseDecided,
  })

  const bestTerritoryWinRate = useMemo(() => {
    if (!territoryWinRateData.data) return { name: "", rate: 0 }
    const byTerritory: Record<string, { won: number; total: number }> = {}
    territoryWinRateData.data.forEach((r: any) => {
      const t = r.Territory ?? ""
      if (!byTerritory[t]) byTerritory[t] = { won: 0, total: 0 }
      byTerritory[t].total += Number(r.cnt ?? 0)
      if (r.Status === "Won") byTerritory[t].won += Number(r.cnt ?? 0)
    })
    let best = { name: "", rate: 0 }
    Object.entries(byTerritory).forEach(([name, v]) => {
      const rate = v.total > 0 ? (v.won / v.total) * 100 : 0
      if (rate > best.rate) best = { name, rate }
    })
    return best
  }, [territoryWinRateData.data])

  // ── Bar: Win Rate by Territory (horizontal) ────
  const wrTerritory = useMemo(() => {
    if (!territoryWinRateData.data) return []
    const byTerritory: Record<string, { won: number; total: number }> = {}
    territoryWinRateData.data.forEach((r: any) => {
      const t = r.Territory ?? ""
      if (!byTerritory[t]) byTerritory[t] = { won: 0, total: 0 }
      byTerritory[t].total += Number(r.cnt ?? 0)
      if (r.Status === "Won") byTerritory[t].won += Number(r.cnt ?? 0)
    })
    return Object.entries(byTerritory)
      .map(([territory, v]) => ({
        territory,
        winRate: v.total > 0 ? (v.won / v.total) * 100 : 0,
      }))
      .sort((a, b) => b.winRate - a.winRate)
  }, [territoryWinRateData.data])

  // ── Table: Manager × Owner × Revenue Won × Close % × Deals ──
  const mgrTableWon = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Manager", "Owner"],
    measures: [
      { column: "Value", fn: "sum", alias: "revenue" },
      { column: "OpportunitySeq", fn: "count", alias: "wonDeals" },
    ],
    filters: baseWon,
  })
  const mgrTableDecided = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Manager", "Owner"],
    measures: [{ column: "OpportunitySeq", fn: "count", alias: "total" }],
    filters: baseDecided,
  })

  const mgrTableData = useMemo(() => {
    if (!mgrTableWon.data || !mgrTableDecided.data) return []
    const totalMap: Record<string, number> = {}
    mgrTableDecided.data.forEach((r: any) => {
      totalMap[`${r.Manager}|${r.Owner}`] = Number(r.total ?? 0)
    })
    return mgrTableWon.data.map((r: any) => {
      const key = `${r.Manager}|${r.Owner}`
      const total = totalMap[key] ?? 0
      const won = Number(r.wonDeals ?? 0)
      return {
        manager: r.Manager,
        owner: r.Owner,
        revenue: Number(r.revenue ?? 0),
        closePct: total > 0 ? (won / total) * 100 : 0,
        deals: won,
      }
    }).sort((a: any, b: any) => b.revenue - a.revenue)
  }, [mgrTableWon.data, mgrTableDecided.data])

  // ── Line: Win Rate trend over time ─────────────
  const wrOverTimeData = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["CloseDate", "Status"],
    measures: [{ column: "OpportunitySeq", fn: "count", alias: "cnt" }],
    filters: baseDecided,
  })

  const wrLineData = useMemo(() => {
    if (!wrOverTimeData.data) return []
    const byMonth: Record<string, { won: number; total: number }> = {}
    wrOverTimeData.data.forEach((r: any) => {
      const month = fmtDate(r.CloseDate)
      if (!byMonth[month]) byMonth[month] = { won: 0, total: 0 }
      byMonth[month].total += Number(r.cnt ?? 0)
      if (r.Status === "Won") byMonth[month].won += Number(r.cnt ?? 0)
    })
    return Object.entries(byMonth)
      .map(([month, v]) => ({
        month,
        winRate: v.total > 0 ? (v.won / v.total) * 100 : 0,
      }))
      .sort((a, b) => {
        const da = new Date(a.month)
        const db = new Date(b.month)
        return da.getTime() - db.getTime()
      })
  }, [wrOverTimeData.data])

  // ── Distinct values ────────────────────────────
  const managers = useDistinctValues(engine, "v_opportunities", "Manager")
  const industries = useDistinctValues(engine, "v_opportunities", "Industry")

  const handleManager = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value
    setManagerFilter(v ? { column: "Manager", op: "eq", values: [v] } : null)
  }
  const handleIndustry = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value
    setIndustryFilter(v ? { column: "Industry", op: "eq", values: [v] } : null)
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* ─── Filters ─── */}
      <div className="col-span-12 flex items-center gap-4 flex-wrap">
        <span className={sectionLabelClass}>Manager</span>
        <select
          value={manager?.values?.[0] ?? ""}
          onChange={handleManager}
          className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-sm bg-white text-[#1F2937]"
        >
          <option value="">All Managers</option>
          {managers.data?.map((m: string) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <span className={`${sectionLabelClass} ml-4`}>Industry</span>
        <select
          value={industry?.values?.[0] ?? ""}
          onChange={handleIndustry}
          className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-sm bg-white text-[#1F2937]"
        >
          <option value="">All Industries</option>
          {industries.data?.map((ind: string) => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
      </div>

      {/* ─── KPIs ─── */}
      <div className="col-span-3">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Revenue Won</div>
          <div className={kpiValueClass}>{fmtCurrency(revenueWon.data?.[0]?.val ?? 0)}</div>
        </div>
      </div>
      <div className="col-span-3">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Close %</div>
          <div className={kpiValueClass}>{fmtPct(closePct)}</div>
        </div>
      </div>
      <div className="col-span-3">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Avg Deal Size</div>
          <div className={kpiValueClass}>{fmtCurrency(avgDealSize.data?.[0]?.avg ?? 0)}</div>
        </div>
      </div>
      <div className="col-span-3">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Best Territory Win Rate</div>
          <div className={`${kpiValueClass} text-[#1A7A4A]`}>{fmtPct(bestTerritoryWinRate.rate)}</div>
          <div className={kpiLabelClass}>{bestTerritoryWinRate.name}</div>
        </div>
      </div>

      {/* ─── Bar: Win Rate by Territory (horizontal) ─── */}
      <div className="col-span-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Win Rate by Territory</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.large}>
            <BarChart data={wrTerritory} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis type="number" tickFormatter={pctTick} domain={[0, 100]} {...axisStyle} />
              <YAxis type="category" dataKey="territory" {...axisStyle} />
              <Tooltip
                content={<CustomTooltip formatter={(v: number) => `${v.toFixed(1)}%`} />}
              />
              <Bar dataKey="winRate" fill="#0F52BA" radius={[0, 3, 3, 0]} name="Win Rate" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Table: Manager / Owner Performance ─── */}
      <div className="col-span-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Manager & Owner Performance</div>
          <div className="overflow-auto max-h-[320px]">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={tableHeaderClass}>Manager</th>
                  <th className={tableHeaderClass}>Owner</th>
                  <th className={tableHeaderClass}>Revenue Won</th>
                  <th className={tableHeaderClass}>Close %</th>
                  <th className={tableHeaderClass}>Deals</th>
                </tr>
              </thead>
              <tbody>
                {mgrTableData.map((r: any, i: number) => (
                  <tr key={i}>
                    <td className={tableCellClass}>{r.manager}</td>
                    <td className={tableCellClass}>{r.owner}</td>
                    <td className={tableCellClass}>{fmtCurrency(r.revenue)}</td>
                    <td className={tableCellClass}>{fmtPct(r.closePct)}</td>
                    <td className={tableCellClass}>{fmtNum(r.deals)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── Line: Win Rate Trend ─── */}
      <div className="col-span-12">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Win Rate Trend</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.small}>
            <LineChart data={wrLineData} margin={{ left: 8 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="month" {...axisStyle} />
              <YAxis tickFormatter={pctTick} domain={[0, 100]} {...axisStyle} />
              <Tooltip content={<CustomTooltip formatter={(v: number) => `${v.toFixed(1)}%`} />} />
              <Line
                type="monotone"
                dataKey="winRate"
                stroke="#0F52BA"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Win Rate"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
