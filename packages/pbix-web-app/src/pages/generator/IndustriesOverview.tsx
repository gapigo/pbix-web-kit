import { useMemo, useCallback } from 'react'
import { useAggregation, useDistinctValues, useFilter, useFilters } from '@pbix/runtime'
import type { QueryEngine } from '@pbix/runtime'
import type { UseBoundStore, StoreApi } from 'zustand'
import type { DashboardStore } from '@pbix/runtime'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'
import {
  colors, cardClass, kpiValueClass, kpiLabelClass, sectionLabelClass,
  tableHeaderClass, tableCellClass, filterChipClass, CHART_HEIGHT,
  axisStyle, gridStyle, currencyTick, CustomTooltip, fmtCurrency, fmtNum, fmtPct,
} from '@/lib/designTokens'

interface Props { engine: QueryEngine | null; store: UseBoundStore<StoreApi<DashboardStore>> }

export default function IndustriesOverview({ engine, store }: Props) {
  const [industryFilter, setIndustryFilter] = useFilter(store, 'Industry')
  const [lobFilter, setLobFilter] = useFilter(store, 'Product LOB')
  const allFilters = useFilters(store)
  const filterArr = useMemo(() => Object.values(allFilters).flat(), [allFilters])

  const lobValues = useDistinctValues(engine, 'v_opportunities', 'Product LOB')

  // Top 8 industries by value (for chips)
  const topIndustries = useAggregation(engine, {
    table: 'v_opportunities',
    groupBy: ['Industry'],
    measures: [{ column: 'Value', fn: 'sum', alias: 'val' }],
    orderBy: [{ column: 'val', dir: 'desc' }],
    limit: 8,
  })
  const topIndustryNames = useMemo(() => new Set((topIndustries.data ?? []).map(r => r.Industry)), [topIndustries.data])

  const wonFilters = useMemo(() => [...filterArr, { column: 'Status', op: 'eq' as const, values: ['Won'] }], [filterArr])
  const openFilters = useMemo(() => [...filterArr, { column: 'Status', op: 'eq' as const, values: ['Open'] }], [filterArr])

  const selectedIndustries: string[] = (industryFilter as any)?.values ?? []

  // ── KPI ──
  const totalPipeline = useAggregation(engine, {
    table: 'v_opportunities',
    measures: [{ column: 'Value', fn: 'sum', alias: 'val' }],
    filters: openFilters,
  })

  // ── Industry Table: Industry × Revenue Won × Close % × Avg Deal Size ──
  const indWon = useAggregation(engine, {
    table: 'v_opportunities', groupBy: ['Industry'],
    measures: [{ column: 'Value', fn: 'sum', alias: 'val' }],
    filters: wonFilters,
    orderBy: [{ column: 'val', dir: 'desc' }],
  })
  const indAvg = useAggregation(engine, {
    table: 'v_opportunities', groupBy: ['Industry'],
    measures: [{ column: 'Value', fn: 'avg', alias: 'val' }],
    filters: wonFilters,
  })
  const indWonCnt = useAggregation(engine, {
    table: 'v_opportunities', groupBy: ['Industry'],
    measures: [{ column: 'OpportunitySeq', fn: 'count', alias: 'val' }],
    filters: wonFilters,
  })
  const indClosed = useAggregation(engine, {
    table: 'v_opportunities', groupBy: ['Industry'],
    measures: [{ column: 'OpportunitySeq', fn: 'count', alias: 'val' }],
    filters: [...filterArr, { column: 'Status', op: 'in' as const, values: ['Won', 'Lost'] }],
  })

  const indRows = useMemo(() => {
    const revMap = new Map((indWon.data ?? []).map(r => [r.Industry, r.val]))
    const avgMap = new Map((indAvg.data ?? []).map(r => [r.Industry, r.val]))
    const wcMap = new Map((indWonCnt.data ?? []).map(r => [r.Industry, r.val]))
    const ccMap = new Map((indClosed.data ?? []).map(r => [r.Industry, r.val]))
    const keys = new Set([...revMap.keys(), ...avgMap.keys(), ...wcMap.keys(), ...ccMap.keys()])
    return Array.from(keys)
      .map(k => ({
        industry: k,
        revenueWon: revMap.get(k) ?? 0,
        closePct: (() => { const wc = wcMap.get(k) ?? 0; const cc = ccMap.get(k) ?? 0; return cc > 0 ? (wc / cc) * 100 : 0 })(),
        avgDeal: avgMap.get(k) ?? 0,
      }))
      .sort((a, b) => b.revenueWon - a.revenueWon)
  }, [indWon.data, indAvg.data, indWonCnt.data, indClosed.data])

  // ── Product LOB Table: Product LOB × Revenue Won × Close % × Avg Deal Size ──
  const lobWon = useAggregation(engine, {
    table: 'v_opportunities', groupBy: ['Product LOB'],
    measures: [{ column: 'Value', fn: 'sum', alias: 'val' }],
    filters: wonFilters,
    orderBy: [{ column: 'val', dir: 'desc' }],
  })
  const lobAvg = useAggregation(engine, {
    table: 'v_opportunities', groupBy: ['Product LOB'],
    measures: [{ column: 'Value', fn: 'avg', alias: 'val' }],
    filters: wonFilters,
  })
  const lobWonCnt = useAggregation(engine, {
    table: 'v_opportunities', groupBy: ['Product LOB'],
    measures: [{ column: 'OpportunitySeq', fn: 'count', alias: 'val' }],
    filters: wonFilters,
  })
  const lobClosed = useAggregation(engine, {
    table: 'v_opportunities', groupBy: ['Product LOB'],
    measures: [{ column: 'OpportunitySeq', fn: 'count', alias: 'val' }],
    filters: [...filterArr, { column: 'Status', op: 'in' as const, values: ['Won', 'Lost'] }],
  })

  const lobRows = useMemo(() => {
    const revMap = new Map((lobWon.data ?? []).map(r => [r['Product LOB'], r.val]))
    const avgMap = new Map((lobAvg.data ?? []).map(r => [r['Product LOB'], r.val]))
    const wcMap = new Map((lobWonCnt.data ?? []).map(r => [r['Product LOB'], r.val]))
    const ccMap = new Map((lobClosed.data ?? []).map(r => [r['Product LOB'], r.val]))
    const keys = new Set([...revMap.keys(), ...avgMap.keys(), ...wcMap.keys(), ...ccMap.keys()])
    return Array.from(keys)
      .map(k => ({
        lob: k,
        revenueWon: revMap.get(k) ?? 0,
        closePct: (() => { const wc = wcMap.get(k) ?? 0; const cc = ccMap.get(k) ?? 0; return cc > 0 ? (wc / cc) * 100 : 0 })(),
        avgDeal: avgMap.get(k) ?? 0,
      }))
      .sort((a, b) => b.revenueWon - a.revenueWon)
  }, [lobWon.data, lobAvg.data, lobWonCnt.data, lobClosed.data])

  // ── Bar: Revenue Won by Industry Top 10 ──
  const indBar = useAggregation(engine, {
    table: 'v_opportunities', groupBy: ['Industry'],
    measures: [{ column: 'Value', fn: 'sum', alias: 'val' }],
    filters: wonFilters,
    orderBy: [{ column: 'val', dir: 'desc' }],
    limit: 10,
  })

  // ── Bar: Revenue Won by Product LOB ──
  const lobBar = useAggregation(engine, {
    table: 'v_opportunities', groupBy: ['Product LOB'],
    measures: [{ column: 'Value', fn: 'sum', alias: 'val' }],
    filters: wonFilters,
    orderBy: [{ column: 'val', dir: 'desc' }],
  })

  // ── Filter handlers ──
  const toggleIndustry = useCallback((ind: string) => {
    const current = selectedIndustries
    const next = current.includes(ind) ? current.filter(v => v !== ind) : [...current, ind]
    if (next.length === 0) {
      setIndustryFilter(null)
    } else {
      setIndustryFilter({ column: 'Industry', op: 'in' as const, values: next })
    }
  }, [selectedIndustries, setIndustryFilter])

  const handleLobChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value
    if (v) setLobFilter({ column: 'Product LOB', op: 'eq' as const, values: [v] })
    else setLobFilter(null)
  }, [setLobFilter])

  return (
    <div className="grid grid-cols-12 gap-5">
      {/* ── KPI ── */}
      <div className="col-span-12">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Total Pipeline</div>
          <div className={kpiValueClass} style={{ color: colors.brand }}>{fmtCurrency(totalPipeline.data?.[0]?.val)}</div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="col-span-7">
        <div className={sectionLabelClass}>Industry (Top 8)</div>
        <div className="flex flex-wrap gap-2">
          {(topIndustries.data ?? []).map(r => (
            <button
              key={r.Industry}
              onClick={() => toggleIndustry(r.Industry)}
              className={filterChipClass(selectedIndustries.includes(r.Industry))}
            >
              {r.Industry}
            </button>
          ))}
          {selectedIndustries.length > 0 && (
            <button
              onClick={() => setIndustryFilter(null)}
              className="px-3 py-1 rounded-full text-xs font-medium border border-[#B91C1C] text-[#B91C1C] hover:bg-[#B91C1C1A] transition-all"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      <div className="col-span-5">
        <div className={sectionLabelClass}>Product LOB</div>
        <select
          value={(lobFilter as any)?.values?.[0] ?? ''}
          onChange={handleLobChange}
          className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm bg-white text-[#1F2937]"
        >
          <option value="">All Product LOBs</option>
          {(lobValues.data ?? []).map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {/* ── Industry Table ── */}
      <div className="col-span-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Industry Performance</div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={tableHeaderClass}>Industry</th>
                  <th className={tableHeaderClass}>Revenue Won</th>
                  <th className={tableHeaderClass}>Close %</th>
                  <th className={tableHeaderClass}>Avg Deal Size</th>
                </tr>
              </thead>
              <tbody>
                {indRows.map(r => (
                  <tr key={r.industry}>
                    <td className={tableCellClass}>{r.industry}</td>
                    <td className={tableCellClass}>{fmtCurrency(r.revenueWon)}</td>
                    <td className={tableCellClass}>{fmtPct(r.closePct)}</td>
                    <td className={tableCellClass}>{fmtCurrency(r.avgDeal)}</td>
                  </tr>
                ))}
                {indRows.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-6 text-[#6B7280] text-sm">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Product LOB Table ── */}
      <div className="col-span-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Product LOB Performance</div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={tableHeaderClass}>Product LOB</th>
                  <th className={tableHeaderClass}>Revenue Won</th>
                  <th className={tableHeaderClass}>Close %</th>
                  <th className={tableHeaderClass}>Avg Deal Size</th>
                </tr>
              </thead>
              <tbody>
                {lobRows.map(r => (
                  <tr key={r.lob}>
                    <td className={tableCellClass}>{r.lob}</td>
                    <td className={tableCellClass}>{fmtCurrency(r.revenueWon)}</td>
                    <td className={tableCellClass}>{fmtPct(r.closePct)}</td>
                    <td className={tableCellClass}>{fmtCurrency(r.avgDeal)}</td>
                  </tr>
                ))}
                {lobRows.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-6 text-[#6B7280] text-sm">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Bar: Revenue Won by Industry Top 10 ── */}
      <div className="col-span-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Revenue Won by Industry — Top 10</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.large}>
            <BarChart data={indBar.data ?? []} layout="vertical" margin={{ left: 100, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis type="number" tick={currencyTick} {...axisStyle} />
              <YAxis type="category" dataKey="Industry" width={90} {...axisStyle} />
              <Tooltip content={<CustomTooltip formatter={fmtCurrency} />} />
              <Bar dataKey="val" fill={colors.chart[0]} radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bar: Revenue Won by Product LOB ── */}
      <div className="col-span-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Revenue Won by Product LOB</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.large}>
            <BarChart data={lobBar.data ?? []} layout="vertical" margin={{ left: 100, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis type="number" tick={currencyTick} {...axisStyle} />
              <YAxis type="category" dataKey="Product LOB" width={100} {...axisStyle} />
              <Tooltip content={<CustomTooltip formatter={fmtCurrency} />} />
              <Bar dataKey="val" fill={colors.chart[1]} radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
