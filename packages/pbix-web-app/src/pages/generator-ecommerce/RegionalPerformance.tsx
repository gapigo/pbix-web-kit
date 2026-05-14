import { useMemo } from "react"
import { useAggregation, useDistinctValues, useFilter, useFilters } from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
} from "recharts"
import {
  colors, cardClass, kpiValueClass, kpiLabelClass, sectionLabelClass,
  tableHeaderClass, tableCellClass, filterChipClass,
  fmtCurrency, fmtNum, fmtPct, CustomTooltip,
  CHART_HEIGHT, axisStyle, gridStyle, currencyTick, pctTick,
} from "@/lib/designTokens"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

export default function RegionalPerformance({ engine, store }: Props) {
  const [regionFilter, setRegionFilter] = useFilter(store, "Region")
  const [segmentFilter, setSegmentFilter] = useFilter(store, "Segment")
  const allFilters = useFilters(store)
  const filterArr = useMemo(() => Object.values(allFilters).flat(), [allFilters])

  const regions = useDistinctValues(engine, "v_orders", "Region")
  const segments = useDistinctValues(engine, "v_orders", "Segment")

  // ── KPI queries ──
  const salesByRegion = useAggregation(engine, {
    table: "v_orders",
    groupBy: ["Region"],
    measures: [{ column: "Sales", fn: "sum", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "val", dir: "desc" }],
  })

  const bestRegionSales = useMemo(() => {
    const data = salesByRegion.data ?? []
    return data.length > 0 ? data[0] : null
  }, [salesByRegion.data])

  const worstRegionSales = useMemo(() => {
    const data = salesByRegion.data ?? []
    return data.length > 0 ? data[data.length - 1] : null
  }, [salesByRegion.data])

  const avgOrderVal = useAggregation(engine, {
    table: "v_orders",
    measures: [{ column: "Sales", fn: "avg", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
  })

  // ── Bar: Profit Margin by Region ──
  const marginByRegion = useAggregation(engine, {
    table: "v_orders",
    groupBy: ["Region"],
    measures: [{ column: "Profit_Margin_Pct", fn: "avg", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "val", dir: "desc" }],
  })

  // ── Table ──
  const tableData = useAggregation(engine, {
    table: "v_orders",
    groupBy: ["Region"],
    measures: [
      { column: "Sales", fn: "sum", alias: "sales" },
      { column: "Profit", fn: "sum", alias: "profit" },
      { column: "Profit_Margin_Pct", fn: "avg", alias: "margin" },
      { column: "Order_ID", fn: "count", alias: "orders" },
    ],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "sales", dir: "desc" }],
  })

  // ── Handlers ──
  const handleRegionClick = (region: string) => {
    if (!regionFilter || regionFilter.values?.[0] !== region) {
      setRegionFilter({ column: "Region", op: "eq", values: [region] })
    } else {
      setRegionFilter(null)
    }
  }

  const handleSegmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value
    if (v) {
      setSegmentFilter({ column: "Segment", op: "eq", values: [v] })
    } else {
      setSegmentFilter(null)
    }
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* ── KPI Row ── */}
      <div className="col-span-4">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Best Region Sales</div>
          <div className="flex items-baseline gap-2">
            <span className={kpiValueClass} style={{ color: colors.success }}>
              {fmtCurrency(bestRegionSales?.val)}
            </span>
            <span className="text-xs text-[#6B7280]">{bestRegionSales?.Region}</span>
          </div>
        </div>
      </div>
      <div className="col-span-4">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Worst Region Sales</div>
          <div className="flex items-baseline gap-2">
            <span className={kpiValueClass} style={{ color: colors.danger }}>
              {fmtCurrency(worstRegionSales?.val)}
            </span>
            <span className="text-xs text-[#6B7280]">{worstRegionSales?.Region}</span>
          </div>
        </div>
      </div>
      <div className="col-span-4">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Avg Order Value</div>
          <div className={kpiValueClass} style={{ color: colors.brand }}>
            {fmtCurrency(avgOrderVal.data?.[0]?.val)}
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="col-span-7">
        <div className={sectionLabelClass}>Region</div>
        <div className="flex flex-wrap gap-2">
          {(regions.data ?? []).map((r: string) => (
            <button
              key={r}
              onClick={() => handleRegionClick(r)}
              className={filterChipClass(regionFilter?.values?.includes(r) ?? false)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="col-span-5">
        <div className={sectionLabelClass}>Segment</div>
        <select
          value={segmentFilter?.values?.[0] ?? ""}
          onChange={handleSegmentChange}
          className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm bg-white text-[#1F2937]"
        >
          <option value="">All Segments</option>
          {(segments.data ?? []).map((s: string) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* ── Sales by Region ── */}
      <div className="col-span-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Sales by Region</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.large}>
            <BarChart data={salesByRegion.data ?? []} layout="vertical" margin={{ left: 80, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis type="number" tick={currencyTick} {...axisStyle} />
              <YAxis type="category" dataKey="Region" width={70} {...axisStyle} />
              <Tooltip content={<CustomTooltip formatter={fmtCurrency} />} />
              <Bar dataKey="val" fill={colors.chart[0]} radius={[0, 4, 4, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Profit Margin by Region ── */}
      <div className="col-span-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Profit Margin by Region</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.large}>
            <BarChart data={marginByRegion.data ?? []} layout="vertical" margin={{ left: 80, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis type="number" tick={pctTick} {...axisStyle} domain={[0, 1]} />
              <YAxis type="category" dataKey="Region" width={70} {...axisStyle} />
              <Tooltip content={<CustomTooltip formatter={(v: number) => fmtPct(v)} />} />
              <Bar dataKey="val" fill={colors.chart[2]} radius={[0, 4, 4, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="col-span-12">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Regional Performance</div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={tableHeaderClass}>Region</th>
                  <th className={tableHeaderClass}>Sales</th>
                  <th className={tableHeaderClass}>Profit</th>
                  <th className={tableHeaderClass}>Profit Margin %</th>
                  <th className={tableHeaderClass}>Orders</th>
                </tr>
              </thead>
              <tbody>
                {(tableData.data ?? []).map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-[#F1F5F9] transition-colors">
                    <td className={tableCellClass}>{row.Region}</td>
                    <td className={tableCellClass}>{fmtCurrency(row.sales)}</td>
                    <td className={tableCellClass}>{fmtCurrency(row.profit)}</td>
                    <td className={tableCellClass}>{fmtPct(row.margin)}</td>
                    <td className={tableCellClass}>{fmtNum(row.orders)}</td>
                  </tr>
                ))}
                {(tableData.data ?? []).length === 0 && (
                  <tr><td colSpan={5} className="text-center py-6 text-[#6B7280] text-sm">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
