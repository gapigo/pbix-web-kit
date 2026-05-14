import { useState, useMemo, useCallback } from 'react'
import { useAggregation, useDistinctValues, useFilter, useFilters } from '@pbix/runtime'
import type { QueryEngine } from '@pbix/runtime'
import type { UseBoundStore, StoreApi } from 'zustand'
import type { DashboardStore } from '@pbix/runtime'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LineChart, Line } from 'recharts'
import {
  colors, cardClass, kpiValueClass, kpiLabelClass, sectionLabelClass,
  tableHeaderClass, tableCellClass, filterChipClass, CHART_HEIGHT,
  axisStyle, gridStyle, currencyTick, pctTick, CustomTooltip, fmtCurrency, fmtNum, fmtPct,
} from '@/lib/designTokens'

type Period = '6M' | '1Y' | 'All'

interface Props { engine: QueryEngine | null; store: UseBoundStore<StoreApi<DashboardStore>> }

export default function WinLossOverview({ engine, store }: Props) {
  const [ownerFilter, setOwnerFilter] = useFilter(store, 'Owner')
  const allFilters = useFilters(store)
  const baseFilters = useMemo(() => Object.values(allFilters).filter(f => f.column !== 'Owner').flat(), [allFilters])

  const [period, setPeriod] = useState<Period>('All')

  const periodCutoff = useMemo(() => {
    if (period === 'All') return null
    const d = new Date()
    if (period === '6M') d.setMonth(d.getMonth() - 6)
    else d.setFullYear(d.getFullYear() - 1)
    return d.toISOString()
  }, [period])

  const periodFilter = useMemo(
    () => (periodCutoff ? [{ column: 'CloseDate' as const, op: 'gte' as const, values: [periodCutoff] }] : []),
    [periodCutoff],
  )

  const allActive = useMemo(() => [...baseFilters, ...periodFilter], [baseFilters, periodFilter])
  const allActiveDefined = useMemo(() => (allActive.length > 0 ? allActive : undefined), [allActive])

  const wonFilters = useMemo(() => [...allActive, { column: 'Status', op: 'eq' as const, values: ['Won'] }], [allActive])
  const openFilters = useMemo(() => [...allActive, { column: 'Status', op: 'eq' as const, values: ['Open'] }], [allActive])

  const owners = useDistinctValues(engine, 'v_opportunities', 'Owner')
  const handleOwnerChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value
    if (v) setOwnerFilter({ column: 'Owner', op: 'eq' as const, values: [v] })
    else setOwnerFilter(null)
  }, [setOwnerFilter])

  // ── KPIs ──
  const revWon = useAggregation(engine, { table: 'v_opportunities', measures: [{ column: 'Value', fn: 'sum', alias: 'val' }], filters: wonFilters })
  const pipeline = useAggregation(engine, { table: 'v_opportunities', measures: [{ column: 'Value', fn: 'sum', alias: 'val' }], filters: openFilters })

  const closedCount = useAggregation(engine, {
    table: 'v_opportunities',
    measures: [{ column: 'OpportunitySeq', fn: 'count', alias: 'val' }],
    filters: [...allActive, { column: 'Status', op: 'in' as const, values: ['Won', 'Lost'] }],
  })
  const wonCount = useAggregation(engine, {
    table: 'v_opportunities',
    measures: [{ column: 'OpportunitySeq', fn: 'count', alias: 'val' }],
    filters: wonFilters,
  })
  const avgDeal = useAggregation(engine, {
    table: 'v_opportunities',
    measures: [{ column: 'Value', fn: 'avg', alias: 'val' }],
    filters: wonFilters,
  })

  const closePct = useMemo(() => {
    const wc = wonCount.data?.[0]?.val
    const cc = closedCount.data?.[0]?.val
    return wc != null && cc != null && cc > 0 ? (wc / cc) * 100 : null
  }, [wonCount.data, closedCount.data])

  // ── Bar: Revenue by Product Top 10 ──
  const prodData = useAggregation(engine, {
    table: 'v_opportunities',
    groupBy: ['Product'],
    measures: [{ column: 'Value', fn: 'sum', alias: 'val' }],
    filters: allActiveDefined,
    orderBy: [{ column: 'val', dir: 'desc' }],
    limit: 10,
  })

  // ── Bar: Revenue by Owner/Manager Top 5 ──
  const ownerData = useAggregation(engine, {
    table: 'v_opportunities',
    groupBy: ['Owner'],
    measures: [{ column: 'Value', fn: 'sum', alias: 'val' }],
    filters: allActiveDefined,
    orderBy: [{ column: 'val', dir: 'desc' }],
    limit: 5,
  })

  // ── Table: Owner × Revenue Won × Deals Won × Close % ──
  const tRevWon = useAggregation(engine, {
    table: 'v_opportunities', groupBy: ['Owner'],
    measures: [{ column: 'Value', fn: 'sum', alias: 'val' }],
    filters: wonFilters,
    orderBy: [{ column: 'val', dir: 'desc' }],
  })
  const tDealsWon = useAggregation(engine, {
    table: 'v_opportunities', groupBy: ['Owner'],
    measures: [{ column: 'OpportunitySeq', fn: 'count', alias: 'val' }],
    filters: wonFilters,
  })
  const tClosed = useAggregation(engine, {
    table: 'v_opportunities', groupBy: ['Owner'],
    measures: [{ column: 'OpportunitySeq', fn: 'count', alias: 'val' }],
    filters: [...allActive, { column: 'Status', op: 'in' as const, values: ['Won', 'Lost'] }],
  })

  const tableRows = useMemo(() => {
    const revMap = new Map((tRevWon.data ?? []).map(r => [r.Owner, r.val]))
    const dwMap = new Map((tDealsWon.data ?? []).map(r => [r.Owner, r.val]))
    const clMap = new Map((tClosed.data ?? []).map(r => [r.Owner, r.val]))
    const owners = new Set([...revMap.keys(), ...dwMap.keys(), ...clMap.keys()])
    return Array.from(owners)
      .map(o => ({
        owner: o,
        revWon: revMap.get(o) ?? 0,
        dealsWon: dwMap.get(o) ?? 0,
        closePct: (() => {
          const wc = dwMap.get(o) ?? 0
          const cc = clMap.get(o) ?? 0
          return cc > 0 ? (wc / cc) * 100 : 0
        })(),
      }))
      .sort((a, b) => b.revWon - a.revWon)
  }, [tRevWon.data, tDealsWon.data, tClosed.data])

  return (
    <div className="grid grid-cols-12 gap-5">
      {/* ── KPI Row ── */}
      <div className="col-span-3">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Revenue Won</div>
          <div className={kpiValueClass} style={{ color: colors.success }}>{fmtCurrency(revWon.data?.[0]?.val)}</div>
        </div>
      </div>
      <div className="col-span-3">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Pipeline</div>
          <div className={kpiValueClass} style={{ color: colors.brand }}>{fmtCurrency(pipeline.data?.[0]?.val)}</div>
        </div>
      </div>
      <div className="col-span-3">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Close %</div>
          <div className={kpiValueClass} style={{ color: colors.warning }}>{fmtPct(closePct)}</div>
        </div>
      </div>
      <div className="col-span-3">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Avg Deal Size</div>
          <div className={kpiValueClass} style={{ color: colors.electric }}>{fmtCurrency(avgDeal.data?.[0]?.val)}</div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="col-span-6">
        <div className={sectionLabelClass}>Owner</div>
        <select
          value={(ownerFilter as any)?.values?.[0] ?? ''}
          onChange={handleOwnerChange}
          className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm bg-white text-[#1F2937]"
        >
          <option value="">All Owners</option>
          {(owners.data ?? []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div className="col-span-6">
        <div className={sectionLabelClass}>Period</div>
        <div className="flex gap-2">
          {(['6M', '1Y', 'All'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={filterChipClass(period === p)}
            >
              {p === '6M' ? 'Last 6 Months' : p === '1Y' ? 'Last Year' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Revenue by Product Top 10 ── */}
      <div className="col-span-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Revenue by Product — Top 10</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.large}>
            <BarChart data={prodData.data ?? []} layout="vertical" margin={{ left: 100, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis type="number" tick={currencyTick} {...axisStyle} />
              <YAxis type="category" dataKey="Product" width={90} {...axisStyle} />
              <Tooltip content={<CustomTooltip formatter={fmtCurrency} />} />
              <Bar dataKey="val" fill={colors.chart[0]} radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Revenue by Owner/Manager Top 5 ── */}
      <div className="col-span-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Revenue by Owner — Top 5</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.large}>
            <BarChart data={ownerData.data ?? []} layout="vertical" margin={{ left: 100, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis type="number" tick={currencyTick} {...axisStyle} />
              <YAxis type="category" dataKey="Owner" width={90} {...axisStyle} />
              <Tooltip content={<CustomTooltip formatter={fmtCurrency} />} />
              <Bar dataKey="val" fill={colors.chart[1]} radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Owner Table ── */}
      <div className="col-span-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Owner Performance</div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={tableHeaderClass}>Owner</th>
                  <th className={tableHeaderClass}>Revenue Won</th>
                  <th className={tableHeaderClass}>Deals Won</th>
                  <th className={tableHeaderClass}>Close %</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map(r => (
                  <tr key={r.owner}>
                    <td className={tableCellClass}>{r.owner}</td>
                    <td className={tableCellClass}>{fmtCurrency(r.revWon)}</td>
                    <td className={tableCellClass}>{fmtNum(r.dealsWon)}</td>
                    <td className={tableCellClass}>{fmtPct(r.closePct)}</td>
                  </tr>
                ))}
                {tableRows.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-6 text-[#6B7280] text-sm">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Win Rate Trend (monthly) ── */}
      <WinRateTrend engine={engine} filters={allActive} />
    </div>
  )
}

// Separate component to handle the monthly win rate trend query
function WinRateTrend({ engine, filters }: { engine: QueryEngine | null; filters: any[] }) {
  const wonPerMonth = useAggregation(engine, {
    table: 'v_opportunities',
    groupBy: ['CloseDate'],
    measures: [{ column: 'OpportunitySeq', fn: 'count', alias: 'val' }],
    filters: filters.length > 0
      ? [...filters, { column: 'Status', op: 'eq' as const, values: ['Won'] }]
      : [{ column: 'Status', op: 'eq' as const, values: ['Won'] }],
  })
  const totalPerMonth = useAggregation(engine, {
    table: 'v_opportunities',
    groupBy: ['CloseDate'],
    measures: [{ column: 'OpportunitySeq', fn: 'count', alias: 'val' }],
    filters: filters.length > 0
      ? [...filters, { column: 'Status', op: 'in' as const, values: ['Won', 'Lost'] }]
      : [{ column: 'Status', op: 'in' as const, values: ['Won', 'Lost'] }],
  })

  const trendData = useMemo(() => {
    if (!wonPerMonth.data || !totalPerMonth.data) return []
    const wonBuckets = new Map<string, number>()
    const totalBuckets = new Map<string, number>()

    for (const r of wonPerMonth.data) {
      const d = new Date(r.CloseDate)
      if (isNaN(d.getTime())) continue
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      wonBuckets.set(key, (wonBuckets.get(key) ?? 0) + r.val)
    }
    for (const r of totalPerMonth.data) {
      const d = new Date(r.CloseDate)
      if (isNaN(d.getTime())) continue
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      totalBuckets.set(key, (totalBuckets.get(key) ?? 0) + r.val)
    }

    const months = Array.from(new Set([...wonBuckets.keys(), ...totalBuckets.keys()])).sort()
    return months.map(m => ({
      month: m,
      rate: (() => {
        const won = wonBuckets.get(m) ?? 0
        const total = totalBuckets.get(m) ?? 0
        return total > 0 ? (won / total) * 100 : 0
      })(),
    }))
  }, [wonPerMonth.data, totalPerMonth.data])

  return (
    <div className="col-span-6">
      <div className={cardClass}>
        <div className={sectionLabelClass}>Win Rate Over Time (Monthly)</div>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT.large}>
          <LineChart data={trendData} margin={{ left: 8, right: 16, top: 8, bottom: 4 }}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="month" {...axisStyle} tick={{ ...axisStyle, fontSize: 10 }} angle={-20} textAnchor="end" height={40} />
            <YAxis domain={[0, 100]} tick={pctTick} {...axisStyle} />
            <Tooltip content={<CustomTooltip formatter={(v: number) => `${Number(v).toFixed(1)}%`} />} />
            <Line type="monotone" dataKey="rate" stroke={colors.chart[2]} strokeWidth={2} dot={{ r: 3, fill: colors.chart[2] }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
