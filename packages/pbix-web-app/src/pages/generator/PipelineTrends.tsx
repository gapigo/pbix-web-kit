import { useState, useMemo } from "react"
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
  tableHeaderClass, tableCellClass, filterChipClass,
  fmtCurrency, fmtNum, fmtDate, CustomTooltip,
  CHART_HEIGHT, axisStyle, gridStyle, currencyTick,
} from "@/lib/designTokens"

const STAGES = ["1-Qualify", "2-Develop", "3-Proposal", "4-Close"]
const CHART_COLORS = ["#0F52BA", "#1A7A4A", "#C17D00", "#7C3AED", "#0891B2"]

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

export default function PipelineTrends({ engine, store }: Props) {
  const [activeStages, setActiveStages] = useState<Set<string>>(new Set())
  const allFilters = useFilters(store)
  const filterArr = useMemo(() => Object.values(allFilters).flat(), [allFilters])
  const [territory, setTerritoryFilter] = useFilter(store, "Territory")
  const storeFilter = useMemo(() => filterArr, [filterArr])

  const openFilter = useMemo<{ column: string; op: "eq"; values: string[] }[]>(
    () => [{ column: "Status", op: "eq", values: ["Open"] }],
    [],
  )

  const stageFilter = useMemo(() => {
    if (activeStages.size === 0) return undefined
    return { column: "Sales Stage" as const, op: "in" as const, values: [...activeStages] }
  }, [activeStages])

  const combinedFilters = useMemo(() => {
    const f = [...openFilter, ...storeFilter]
    if (stageFilter) f.push(stageFilter)
    return f.length > 0 ? f : undefined
  }, [openFilter, storeFilter, stageFilter])

  const qualFilters = useMemo(() => {
    const f = [...openFilter, ...storeFilter]
    f.push({ column: "Sales Stage" as const, op: "in" as const, values: ["2-Develop", "3-Proposal", "4-Close"] })
    return f
  }, [openFilter, storeFilter])

  // ── KPI queries ──────────────────────────────
  const oppCount = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "OpportunitySeq", fn: "count", alias: "cnt" }],
    filters: combinedFilters,
  })
  const totalPipeline = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Value", fn: "sum", alias: "val" }],
    filters: combinedFilters,
  })
  const avgDaysRemaining = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Days Remaining In Pipeline", fn: "avg", alias: "avg" }],
    filters: combinedFilters,
  })
  const qualifiedPipeline = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Value", fn: "sum", alias: "val" }],
    filters: qualFilters,
  })

  // ── Bar: Revenue by Product (horizontal) ─────
  const revByProduct = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Product"],
    measures: [{ column: "Value", fn: "sum", alias: "val" }],
    filters: combinedFilters,
    orderBy: [{ column: "val", dir: "desc" }],
    limit: 10,
  })

  // ── Line: Pipeline by Industry over time ─────
  const indOverTime = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Industry", "CloseDate"],
    measures: [{ column: "Value", fn: "sum", alias: "val" }],
    filters: combinedFilters,
  })

  // ── Funnel: by Sales Stage ───────────────────
  const funnelData = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Sales Stage"],
    measures: [{ column: "Value", fn: "sum", alias: "val" }],
    filters: storeFilter.length > 0 ? [...openFilter, ...storeFilter] : openFilter,
  })

  // ── Table: Pipeline Details ──────────────────
  const tableData = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: [
      "Territory", "Days Remaining In Pipeline", "Weeks Open",
      "Industry", "Account Name", "Owner", "Sales Stage", "Product",
    ],
    measures: [{ column: "Value", fn: "sum", alias: "val" }],
    filters: combinedFilters,
    orderBy: [{ column: "val", dir: "desc" }],
    limit: 50,
  })

  // ── Distinct for territory select ───────────
  const territories = useDistinctValues(engine, "v_opportunities", "Territory")

  // ── Process top-5 industries line chart ──────
  const topIndustries = useMemo(() => {
    if (!indOverTime.data) return []
    const totals: Record<string, number> = {}
    indOverTime.data.forEach((r: any) => {
      const ind = r.Industry ?? "Unknown"
      totals[ind] = (totals[ind] || 0) + Number(r.val ?? 0)
    })
    const top5 = new Set(
      Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k]) => k),
    )
    const byMonth: Record<string, Record<string, number>> = {}
    indOverTime.data.forEach((r: any) => {
      const ind = r.Industry ?? "Unknown"
      if (!top5.has(ind)) return
      const month = fmtDate(r.CloseDate)
      if (!byMonth[month]) byMonth[month] = {}
      byMonth[month][ind] = (byMonth[month][ind] || 0) + Number(r.val ?? 0)
    })
    return Object.entries(byMonth)
      .map(([month, vals]) => ({ month, ...vals }))
      .sort((a, b) => {
        const da = new Date(a.month)
        const db = new Date(b.month)
        return da.getTime() - db.getTime()
      })
  }, [indOverTime.data])

  // ── Funnel data: order by stage ──────────────
  const sortedFunnel = useMemo(() => {
    if (!funnelData.data) return []
    const order: Record<string, number> = {
      "1-Qualify": 1, "2-Develop": 2, "3-Proposal": 3, "4-Close": 4,
    }
    const arr = [...funnelData.data]
      .map((r: any) => ({ ...r, _val: Number(r.val ?? 0) }))
      .sort((a: any, b: any) => (order[a["Sales Stage"]] ?? 99) - (order[b["Sales Stage"]] ?? 99))
    const maxVal = Math.max(...arr.map((r: any) => r._val), 1)
    return arr.map((r: any) => ({ ...r, widthPct: (r._val / maxVal) * 100 }))
  }, [funnelData.data])

  // ── Handlers ─────────────────────────────────
  const toggleStage = (s: string) =>
    setActiveStages((prev) => {
      const next = new Set(prev)
      next.has(s) ? next.delete(s) : next.add(s)
      return next
    })

  const handleTerritory = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value
    setTerritoryFilter(v ? { column: "Territory", op: "eq", values: [v] } : null)
  }

  // ── Render ───────────────────────────────────
  return (
    <div className="grid grid-cols-12 gap-4">
      {/* ─── Filters ─── */}
      <div className="col-span-12 flex items-center gap-4 flex-wrap">
        <span className={sectionLabelClass}>Sales Stage</span>
        {STAGES.map((s) => (
          <button key={s} onClick={() => toggleStage(s)} className={filterChipClass(activeStages.has(s))}>
            {s}
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

      {/* ─── KPI Row ─── */}
      <div className="col-span-3">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Opportunity Count</div>
          <div className={kpiValueClass}>{fmtNum(oppCount.data?.[0]?.cnt ?? 0)}</div>
        </div>
      </div>
      <div className="col-span-3">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Total Pipeline</div>
          <div className={kpiValueClass}>{fmtCurrency(totalPipeline.data?.[0]?.val ?? 0)}</div>
        </div>
      </div>
      <div className="col-span-3">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Avg Days Remaining</div>
          <div className={kpiValueClass}>{fmtNum(avgDaysRemaining.data?.[0]?.avg ?? 0)}</div>
        </div>
      </div>
      <div className="col-span-3">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Qualified Pipeline</div>
          <div className={kpiValueClass}>{fmtCurrency(qualifiedPipeline.data?.[0]?.val ?? 0)}</div>
        </div>
      </div>

      {/* ─── Bar: Revenue by Product (horizontal) ─── */}
      <div className="col-span-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Revenue by Product (Open)</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.large}>
            <BarChart data={revByProduct.data} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis type="number" tickFormatter={currencyTick} {...axisStyle} />
              <YAxis type="category" dataKey="Product" {...axisStyle} />
              <Tooltip content={<CustomTooltip formatter={fmtCurrency} />} />
              <Bar dataKey="val" fill="#0F52BA" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Line: Pipeline by Top 5 Industries over time ─── */}
      <div className="col-span-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Pipeline by Industry over Time</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.large}>
            <LineChart data={topIndustries} margin={{ left: 8 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="month" {...axisStyle} />
              <YAxis tickFormatter={currencyTick} {...axisStyle} />
              <Tooltip content={<CustomTooltip formatter={fmtCurrency} />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {topIndustries.length > 0 &&
                Object.keys(topIndustries[0])
                  .filter((k) => k !== "month")
                  .map((ind, i) => (
                    <Line
                      key={ind}
                      type="monotone"
                      dataKey={ind}
                      stroke={CHART_COLORS[i % 5]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Funnel: Pipeline Funnel ─── */}
      <div className="col-span-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Pipeline Funnel</div>
          <div className="flex flex-col gap-3">
            {sortedFunnel.length === 0 && (
              <div className="text-sm text-[#6B7280] italic">No data</div>
            )}
            {sortedFunnel.map((r: any) => (
              <div key={r["Sales Stage"]} className="flex items-center gap-3">
                <span className="w-24 text-xs text-[#6B7280] text-right">{r["Sales Stage"]}</span>
                <div
                  className="h-8 rounded-r-md bg-[#0F52BA] transition-all flex items-center justify-end pr-2"
                  style={{ width: `${Math.max(r.widthPct, 4)}%` }}
                >
                  <span className="text-xs font-semibold text-white">{fmtCurrency(r._val)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Table: Pipeline Details ─── */}
      <div className="col-span-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Pipeline Details</div>
          <div className="overflow-auto max-h-[320px]">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={tableHeaderClass}>Territory</th>
                  <th className={tableHeaderClass}>Days</th>
                  <th className={tableHeaderClass}>Weeks</th>
                  <th className={tableHeaderClass}>Industry</th>
                  <th className={tableHeaderClass}>Account</th>
                  <th className={tableHeaderClass}>Owner</th>
                  <th className={tableHeaderClass}>Stage</th>
                  <th className={tableHeaderClass}>Product</th>
                  <th className={tableHeaderClass}>Value</th>
                </tr>
              </thead>
              <tbody>
                {tableData.data?.map((r: any, i: number) => (
                  <tr key={i}>
                    <td className={tableCellClass}>{r.Territory}</td>
                    <td className={tableCellClass}>{r["Days Remaining In Pipeline"]}</td>
                    <td className={tableCellClass}>{r["Weeks Open"]}</td>
                    <td className={tableCellClass}>{r.Industry}</td>
                    <td className={tableCellClass}>{r["Account Name"]}</td>
                    <td className={tableCellClass}>{r.Owner}</td>
                    <td className={tableCellClass}>{r["Sales Stage"]}</td>
                    <td className={tableCellClass}>{r.Product}</td>
                    <td className={tableCellClass}>{fmtCurrency(r.val)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
