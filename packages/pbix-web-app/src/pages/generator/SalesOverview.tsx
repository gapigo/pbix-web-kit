import { useMemo } from 'react'
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

export default function SalesOverview({ engine, store }: Props) {
  const [stageFilter, setStageFilter] = useFilter(store, 'Sales Stage')
  const [territoryFilter, setTerritoryFilter] = useFilter(store, 'Territory')
  const allFilters = useFilters(store)
  const filterArr = useMemo(() => Object.values(allFilters).flat(), [allFilters])

  const stages = useDistinctValues(engine, 'v_opportunities', 'Sales Stage')
  const territories = useDistinctValues(engine, 'v_opportunities', 'Territory')

  const wonFilters = useMemo(() => [...filterArr, { column: 'Status', op: 'eq' as const, values: ['Won'] }], [filterArr])
  const openFilters = useMemo(() => [...filterArr, { column: 'Status', op: 'eq' as const, values: ['Open'] }], [filterArr])

  const revWon = useAggregation(engine, {
    table: 'v_opportunities',
    measures: [{ column: 'Value', fn: 'sum', alias: 'val' }],
    filters: wonFilters,
  })
  const pipeline = useAggregation(engine, {
    table: 'v_opportunities',
    measures: [{ column: 'Value', fn: 'sum', alias: 'val' }],
    filters: openFilters,
  })
  const totalOpps = useAggregation(engine, {
    table: 'v_opportunities',
    measures: [{ column: 'OpportunitySeq', fn: 'count', alias: 'val' }],
    filters: filterArr.length > 0 ? filterArr : undefined,
  })
  const wonCount = useAggregation(engine, {
    table: 'v_opportunities',
    measures: [{ column: 'OpportunitySeq', fn: 'count', alias: 'val' }],
    filters: wonFilters,
  })
  const closedCount = useAggregation(engine, {
    table: 'v_opportunities',
    measures: [{ column: 'OpportunitySeq', fn: 'count', alias: 'val' }],
    filters: [...filterArr, { column: 'Status', op: 'in' as const, values: ['Won', 'Lost'] }],
  })

  const winRateVal = useMemo(() => {
    const wc = wonCount.data?.[0]?.val
    const cc = closedCount.data?.[0]?.val
    return wc != null && cc != null && cc > 0 ? (wc / cc) * 100 : null
  }, [wonCount.data, closedCount.data])

  const prodData = useAggregation(engine, {
    table: 'v_opportunities',
    groupBy: ['Product'],
    measures: [{ column: 'Value', fn: 'sum', alias: 'val' }],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: 'val', dir: 'desc' }],
    limit: 10,
  })
  const terrChartData = useAggregation(engine, {
    table: 'v_opportunities',
    groupBy: ['Territory'],
    measures: [{ column: 'Value', fn: 'sum', alias: 'val' }],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: 'val', dir: 'desc' }],
    limit: 15,
  })

  // Table: Territory × Revenue Won × Pipeline × Close %
  const terrWon = useAggregation(engine, {
    table: 'v_opportunities',
    groupBy: ['Territory'],
    measures: [{ column: 'Value', fn: 'sum', alias: 'val' }],
    filters: wonFilters,
    orderBy: [{ column: 'val', dir: 'desc' }],
  })
  const terrPipe = useAggregation(engine, {
    table: 'v_opportunities',
    groupBy: ['Territory'],
    measures: [{ column: 'Value', fn: 'sum', alias: 'val' }],
    filters: openFilters,
  })
  const terrWonCnt = useAggregation(engine, {
    table: 'v_opportunities',
    groupBy: ['Territory'],
    measures: [{ column: 'OpportunitySeq', fn: 'count', alias: 'val' }],
    filters: wonFilters,
  })
  const terrClosedCnt = useAggregation(engine, {
    table: 'v_opportunities',
    groupBy: ['Territory'],
    measures: [{ column: 'OpportunitySeq', fn: 'count', alias: 'val' }],
    filters: [...filterArr, { column: 'Status', op: 'in' as const, values: ['Won', 'Lost'] }],
  })

  const tableRows = useMemo(() => {
    const wonMap = new Map((terrWon.data ?? []).map(r => [r.Territory, r.val]))
    const pipeMap = new Map((terrPipe.data ?? []).map(r => [r.Territory, r.val]))
    const wcMap = new Map((terrWonCnt.data ?? []).map(r => [r.Territory, r.val]))
    const ccMap = new Map((terrClosedCnt.data ?? []).map(r => [r.Territory, r.val]))
    const territories = new Set([...wonMap.keys(), ...pipeMap.keys()])
    return Array.from(territories)
      .map(t => ({
        territory: t,
        revWon: wonMap.get(t) ?? 0,
        pipeline: pipeMap.get(t) ?? 0,
        closePct: (() => {
          const wc = wcMap.get(t) ?? 0
          const cc = ccMap.get(t) ?? 0
          return cc > 0 ? (wc / cc) * 100 : 0
        })(),
      }))
      .sort((a, b) => b.revWon - a.revWon)
  }, [terrWon.data, terrPipe.data, terrWonCnt.data, terrClosedCnt.data, filterArr])

  const handleStageClick = (stage: string) => {
    if (!stageFilter || (stageFilter as any)?.values?.[0] !== stage) {
      setStageFilter({ column: 'Sales Stage', op: 'eq' as const, values: [stage] })
    } else {
      setStageFilter(null)
    }
  }

  const handleTerritoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value
    if (v) {
      setTerritoryFilter({ column: 'Territory', op: 'eq' as const, values: [v] })
    } else {
      setTerritoryFilter(null)
    }
  }

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
          <div className={kpiLabelClass}>Total Opps</div>
          <div className={kpiValueClass} style={{ color: colors.neutral }}>{fmtNum(totalOpps.data?.[0]?.val)}</div>
        </div>
      </div>
      <div className="col-span-3">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Win Rate</div>
          <div className={kpiValueClass} style={{ color: colors.warning }}>{fmtPct(winRateVal)}</div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="col-span-7">
        <div className={sectionLabelClass}>Sales Stage</div>
        <div className="flex flex-wrap gap-2">
          {(stages.data ?? []).map(s => (
            <button key={s} onClick={() => handleStageClick(s)} className={filterChipClass(stageFilter?.values?.includes(s) ?? false)}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="col-span-5">
        <div className={sectionLabelClass}>Territory</div>
        <select
          value={(territoryFilter as any)?.values?.[0] ?? ''}
          onChange={handleTerritoryChange}
          className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm bg-white text-[#1F2937]"
        >
          <option value="">All Territories</option>
          {(territories.data ?? []).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* ── Revenue by Product ── */}
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

      {/* ── Revenue by Territory ── */}
      <div className="col-span-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Revenue by Territory</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.large}>
            <BarChart data={terrChartData.data ?? []} layout="vertical" margin={{ left: 100, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis type="number" tick={currencyTick} {...axisStyle} />
              <YAxis type="category" dataKey="Territory" width={90} {...axisStyle} />
              <Tooltip content={<CustomTooltip formatter={fmtCurrency} />} />
              <Bar dataKey="val" fill={colors.chart[2]} radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Territory Table ── */}
      <div className="col-span-12">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Territory Performance</div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={tableHeaderClass}>Territory</th>
                  <th className={tableHeaderClass}>Revenue Won</th>
                  <th className={tableHeaderClass}>Pipeline</th>
                  <th className={tableHeaderClass}>Close %</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map(r => (
                  <tr key={r.territory}>
                    <td className={tableCellClass}>{r.territory}</td>
                    <td className={tableCellClass}>{fmtCurrency(r.revWon)}</td>
                    <td className={tableCellClass}>{fmtCurrency(r.pipeline)}</td>
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
    </div>
  )
}
