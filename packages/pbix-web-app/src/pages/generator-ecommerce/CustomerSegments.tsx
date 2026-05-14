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

export default function CustomerSegments({ engine, store }: Props) {
  const [segFilter, setSegFilter] = useFilter(store, "Segment")
  const [shipFilter, setShipFilter] = useFilter(store, "Ship_Mode")
  const allFilters = useFilters(store)
  const filterArr = useMemo(() => Object.values(allFilters).flat(), [allFilters])

  const segments = useDistinctValues(engine, "v_orders", "Segment")
  const shipModes = useDistinctValues(engine, "v_orders", "Ship_Mode")

  // ── KPI queries ──
  const salesBySeg = useAggregation(engine, {
    table: "v_orders",
    groupBy: ["Segment"],
    measures: [{ column: "Sales", fn: "sum", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "val", dir: "desc" }],
  })

  const topSegmentSales = useMemo(() => {
    const data = salesBySeg.data ?? []
    return data.length > 0 ? data[0] : null
  }, [salesBySeg.data])

  const avgOrderBySeg = useAggregation(engine, {
    table: "v_orders",
    groupBy: ["Segment"],
    measures: [{ column: "Sales", fn: "avg", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "val", dir: "desc" }],
  })

  const ordersBySeg = useAggregation(engine, {
    table: "v_orders",
    groupBy: ["Segment"],
    measures: [{ column: "Order_ID", fn: "count", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "val", dir: "desc" }],
  })

  // ── Bar: Profit Margin by Segment ──
  const marginBySeg = useAggregation(engine, {
    table: "v_orders",
    groupBy: ["Segment"],
    measures: [{ column: "Profit_Margin_Pct", fn: "avg", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "val", dir: "desc" }],
  })

  // ── Table ──
  const tableData = useAggregation(engine, {
    table: "v_orders",
    groupBy: ["Segment"],
    measures: [
      { column: "Sales", fn: "sum", alias: "sales" },
      { column: "Order_ID", fn: "count", alias: "orders" },
      { column: "Sales", fn: "avg", alias: "avgOrder" },
      { column: "Profit_Margin_Pct", fn: "avg", alias: "margin" },
    ],
    filters: filterArr.length > 0 ? filterArr : undefined,
  })

  // ── Handlers ──
  const handleSegmentClick = (seg: string) => {
    if (!segFilter || segFilter.values?.[0] !== seg) {
      setSegFilter({ column: "Segment", op: "eq", values: [seg] })
    } else {
      setSegFilter(null)
    }
  }

  const handleShipModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value
    if (v) {
      setShipFilter({ column: "Ship_Mode", op: "eq", values: [v] })
    } else {
      setShipFilter(null)
    }
  }

  const topSegAvgVal = useMemo(() => {
    const data = avgOrderBySeg.data ?? []
    const top = data.length > 0 ? data[0] : null
    return top?.val
  }, [avgOrderBySeg.data])

  const topSegOrdersVal = useMemo(() => {
    const data = ordersBySeg.data ?? []
    const top = data.length > 0 ? data[0] : null
    return top?.val
  }, [ordersBySeg.data])

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* ── KPI Row ── */}
      <div className="col-span-4">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Top Segment Sales</div>
          <div className="flex items-baseline gap-2">
            <span className={kpiValueClass} style={{ color: colors.brand }}>
              {fmtCurrency(topSegmentSales?.val)}
            </span>
            <span className="text-xs text-[#6B7280]">{topSegmentSales?.Segment}</span>
          </div>
        </div>
      </div>
      <div className="col-span-4">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Avg Order by Segment</div>
          <div className="flex items-baseline gap-2">
            <span className={kpiValueClass} style={{ color: colors.success }}>
              {fmtCurrency(topSegAvgVal)}
            </span>
            <span className="text-xs text-[#6B7280]">{avgOrderBySeg.data?.[0]?.Segment}</span>
          </div>
        </div>
      </div>
      <div className="col-span-4">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Orders by Segment</div>
          <div className="flex items-baseline gap-2">
            <span className={kpiValueClass} style={{ color: colors.neutral }}>
              {fmtNum(topSegOrdersVal)}
            </span>
            <span className="text-xs text-[#6B7280]">{ordersBySeg.data?.[0]?.Segment}</span>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="col-span-7">
        <div className={sectionLabelClass}>Segment</div>
        <div className="flex flex-wrap gap-2">
          {(segments.data ?? []).map((s: string) => (
            <button
              key={s}
              onClick={() => handleSegmentClick(s)}
              className={filterChipClass(segFilter?.values?.includes(s) ?? false)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="col-span-5">
        <div className={sectionLabelClass}>Ship Mode</div>
        <select
          value={shipFilter?.values?.[0] ?? ""}
          onChange={handleShipModeChange}
          className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm bg-white text-[#1F2937]"
        >
          <option value="">All Ship Modes</option>
          {(shipModes.data ?? []).map((s: string) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* ── Sales by Segment ── */}
      <div className="col-span-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Sales by Segment</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.large}>
            <BarChart data={salesBySeg.data ?? []} layout="vertical" margin={{ left: 120, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis type="number" tickFormatter={currencyTick} {...axisStyle} />
              <YAxis type="category" dataKey="Segment" width={110} {...axisStyle} />
              <Tooltip content={<CustomTooltip formatter={fmtCurrency} />} />
              <Bar dataKey="val" fill={colors.chart[0]} radius={[0, 4, 4, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Profit Margin by Segment ── */}
      <div className="col-span-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Profit Margin by Segment</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.large}>
            <BarChart data={marginBySeg.data ?? []} layout="vertical" margin={{ left: 120, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis type="number" tickFormatter={pctTick} {...axisStyle} domain={[0, 1]} />
              <YAxis type="category" dataKey="Segment" width={110} {...axisStyle} />
              <Tooltip content={<CustomTooltip formatter={(v: number) => fmtPct(v)} />} />
              <Bar dataKey="val" fill={colors.chart[2]} radius={[0, 4, 4, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="col-span-12">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Segment Performance</div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={tableHeaderClass}>Segment</th>
                  <th className={tableHeaderClass}>Sales</th>
                  <th className={tableHeaderClass}>Orders</th>
                  <th className={tableHeaderClass}>Avg Order Value</th>
                  <th className={tableHeaderClass}>Profit Margin %</th>
                </tr>
              </thead>
              <tbody>
                {(tableData.data ?? []).map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-[#F1F5F9] transition-colors">
                    <td className={tableCellClass}>{row.Segment}</td>
                    <td className={tableCellClass}>{fmtCurrency(row.sales)}</td>
                    <td className={tableCellClass}>{fmtNum(row.orders)}</td>
                    <td className={tableCellClass}>{fmtCurrency(row.avgOrder)}</td>
                    <td className={tableCellClass}>{fmtPct(row.margin)}</td>
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
