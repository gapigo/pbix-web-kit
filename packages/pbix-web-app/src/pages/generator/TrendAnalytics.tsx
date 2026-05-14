import { useState, useMemo } from "react"
import { useAggregation, useDistinctValues, useFilter, useFilters } from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"
import {
  BarChart, Bar, LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip, Legend, ScatterChart, Scatter, Cell,
} from "recharts"
import {
  cardClass, kpiValueClass, kpiLabelClass, sectionLabelClass,
  tableCellClass, filterChipClass, colors,
  fmtCurrency, fmtNum, fmtPct, fmtDate, CustomTooltip,
  CHART_HEIGHT, axisStyle, gridStyle, currencyTick, numTick, pctTick,
} from "@/lib/designTokens"

const CHART_COLORS = ["#0F52BA", "#1A7A4A", "#C17D00", "#7C3AED", "#0891B2", "#BE185D"]

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

export default function TrendAnalytics({ engine, store }: Props) {
  const [period, setPeriod] = useState<"Monthly" | "Quarterly">("Monthly")
  const allFilters = useFilters(store)
  const filterArr = useMemo(() => Object.values(allFilters).flat(), [allFilters])
  const [territory, setTerritoryFilter] = useFilter(store, "Territory")
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

  // ── KPI: Count Won ──────────────────────────
  const countWon = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "OpportunitySeq", fn: "count", alias: "cnt" }],
    filters: baseWon,
  })

  // ── KPI: Close % ──────────────────────────────
  const countWonForPct = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "OpportunitySeq", fn: "count", alias: "cnt" }],
    filters: baseDecided,
  })
  const countLost = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "OpportunitySeq", fn: "count", alias: "cnt" }],
    filters: [...baseDecided, { column: "Status", op: "eq", values: ["Lost"] }],
  })

  const closePct = useMemo(() => {
    const won = Number(countWonForPct.data?.[0]?.cnt ?? 0)
    const lost = Number(countLost.data?.[0]?.cnt ?? 0)
    return won + lost > 0 ? (won / (won + lost)) * 100 : 0
  }, [countWonForPct.data, countLost.data])

  // ── KPI: Avg Discount ─────────────────────────
  const avgDiscount = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Discount", fn: "avg", alias: "avg" }],
    filters: baseWon,
  })

  // ── KPI: Revenue Won ──────────────────────────
  const revenueWon = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Value", fn: "sum", alias: "val" }],
    filters: baseWon,
  })

  // ── Combo: Monthly Revenue (bars) + Deal Count (line) ───
  const monthlyData = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["CloseDate"],
    measures: [
      { column: "Value", fn: "sum", alias: "revenue" },
      { column: "OpportunitySeq", fn: "count", alias: "cnt" },
    ],
    filters: baseWon,
  })

  const comboChartData = useMemo(() => {
    if (!monthlyData.data) return []
    const byPeriod: Record<string, { revenue: number; cnt: number }> = {}
    monthlyData.data.forEach((r: any) => {
      const d = new Date(r.CloseDate)
      const key =
        period === "Monthly"
          ? d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
          : `Q${Math.ceil((d.getMonth() + 1) / 3)} ${d.getFullYear().toString().slice(-2)}`
      if (!byPeriod[key]) byPeriod[key] = { revenue: 0, cnt: 0 }
      byPeriod[key].revenue += Number(r.revenue ?? 0)
      byPeriod[key].cnt += Number(r.cnt ?? 0)
    })
    return Object.entries(byPeriod).map(([period, v]) => ({
      period,
      revenue: v.revenue,
      cnt: v.cnt,
    }))
  }, [monthlyData.data, period])

  // ── Line: Revenue by Product LOB over time ───
  const lobOverTime = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Product LOB", "CloseDate"],
    measures: [{ column: "Value", fn: "sum", alias: "val" }],
    filters: baseWon,
  })

  const lobLineData = useMemo(() => {
    if (!lobOverTime.data) return []
    const byPeriod: Record<string, Record<string, number>> = {}
    const lobs = new Set<string>()
    lobOverTime.data.forEach((r: any) => {
      const lob = r["Product LOB"] ?? "Unknown"
      lobs.add(lob)
      const d = new Date(r.CloseDate)
      const key =
        period === "Monthly"
          ? d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
          : `Q${Math.ceil((d.getMonth() + 1) / 3)} ${d.getFullYear().toString().slice(-2)}`
      if (!byPeriod[key]) byPeriod[key] = {}
      byPeriod[key][lob] = (byPeriod[key][lob] || 0) + Number(r.val ?? 0)
    })
    return Object.entries(byPeriod)
      .map(([period, vals]) => ({ period, ...vals }))
      .sort((a, b) => {
        const da = new Date(a.period)
        const db = new Date(b.period)
        return da.getTime() - db.getTime()
      })
  }, [lobOverTime.data, period])

  const lobKeys = useMemo(() => {
    if (lobLineData.length === 0) return []
    return Object.keys(lobLineData[0]).filter((k) => k !== "period")
  }, [lobLineData])

  // ── Scatter: Revenue vs Close % by Territory ──
  const scatterWon = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Territory"],
    measures: [
      { column: "Value", fn: "sum", alias: "revenue" },
      { column: "OpportunitySeq", fn: "count", alias: "won" },
    ],
    filters: baseWon,
  })
  const scatterTotal = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Territory"],
    measures: [{ column: "OpportunitySeq", fn: "count", alias: "total" }],
    filters: baseDecided,
  })

  const scatterData = useMemo(() => {
    if (!scatterWon.data || !scatterTotal.data) return []
    const totalMap: Record<string, number> = {}
    scatterTotal.data.forEach((r: any) => {
      totalMap[r.Territory] = Number(r.total ?? 0)
    })
    return scatterWon.data.map((r: any) => {
      const total = totalMap[r.Territory] ?? 0
      const won = Number(r.won ?? 0)
      return {
        territory: r.Territory,
        revenue: Number(r.revenue ?? 0),
        closePct: total > 0 ? (won / total) * 100 : 0,
      }
    })
  }, [scatterWon.data, scatterTotal.data])

  // ── Distinct for territory select ───────────
  const territories = useDistinctValues(engine, "v_opportunities", "Territory")

  const handleTerritory = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value
    setTerritoryFilter(v ? { column: "Territory", op: "eq", values: [v] } : null)
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* ─── Filters ─── */}
      <div className="col-span-12 flex items-center gap-4 flex-wrap">
        <span className={sectionLabelClass}>Period</span>
        {["Monthly", "Quarterly"].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p as "Monthly" | "Quarterly")}
            className={filterChipClass(period === p)}
          >
            {p}
          </button>
        ))}
        <span className={`${sectionLabelClass} ml-4`}>Territory</span>
        <select
          value={territory?.values?.[0] ?? ""}
          onChange={handleTerritory}
          className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-sm bg-white text-[#1F2937]"
        >
          <option value="">All Territories</option>
          {territories.data?.map((t: string) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* ─── KPIs ─── */}
      <div className="col-span-3">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Count Won</div>
          <div className={kpiValueClass}>{fmtNum(countWon.data?.[0]?.cnt ?? 0)}</div>
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
          <div className={kpiLabelClass}>Avg Discount</div>
          <div className={kpiValueClass}>{fmtPct(avgDiscount.data?.[0]?.avg ?? 0)}</div>
        </div>
      </div>
      <div className="col-span-3">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Revenue Won</div>
          <div className={kpiValueClass}>{fmtCurrency(revenueWon.data?.[0]?.val ?? 0)}</div>
        </div>
      </div>

      {/* ─── Combo: Revenue + Deal Count ─── */}
      <div className="col-span-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Revenue & Deal Count ({period.toLowerCase()})</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.large}>
            <ComposedChart data={comboChartData} margin={{ left: 8 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="period" {...axisStyle} />
              <YAxis yAxisId="left" tickFormatter={currencyTick} {...axisStyle} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={numTick} {...axisStyle} />
              <Tooltip content={<CustomTooltip formatter={fmtCurrency} />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="revenue" fill="#0F52BA" radius={[3, 3, 0, 0]} name="Revenue" />
              <Line yAxisId="right" type="monotone" dataKey="cnt" stroke="#1A7A4A" strokeWidth={2} dot name="Deal Count" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Line: Revenue by Product LOB ─── */}
      <div className="col-span-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Revenue by Product LOB ({period.toLowerCase()})</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.large}>
            <LineChart data={lobLineData} margin={{ left: 8 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="period" {...axisStyle} />
              <YAxis tickFormatter={currencyTick} {...axisStyle} />
              <Tooltip content={<CustomTooltip formatter={fmtCurrency} />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {lobKeys.map((lob, i) => (
                <Line
                  key={lob}
                  type="monotone"
                  dataKey={lob}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  name={lob}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Scatter: Revenue vs Close % by Territory ─── */}
      <div className="col-span-12">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Revenue vs Close % by Territory</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.scatter}>
            <ScatterChart margin={{ left: 8 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis
                type="number"
                dataKey="closePct"
                tickFormatter={pctTick}
                domain={[0, 100]}
                label={{ value: "Close %", position: "bottom", style: { fill: "#9CA3AF", fontSize: 11 } }}
                {...axisStyle}
              />
              <YAxis
                type="number"
                dataKey="revenue"
                tickFormatter={currencyTick}
                label={{ value: "Revenue", angle: -90, position: "insideLeft", style: { fill: "#9CA3AF", fontSize: 11 } }}
                {...axisStyle}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={<CustomTooltip formatter={(v: number, name: string) => (name === "closePct" ? fmtPct(v) : fmtCurrency(v))} />}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Scatter data={scatterData} dataKey="revenue" name="Territory">
                {scatterData.map((_: any, i: number) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
