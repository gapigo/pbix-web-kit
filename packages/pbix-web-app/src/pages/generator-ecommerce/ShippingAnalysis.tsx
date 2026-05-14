import { useMemo } from "react"
import { useAggregation, useDistinctValues, useFilter, useFilters } from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
  LineChart, Line, Legend,
} from "recharts"
import {
  colors, cardClass, kpiValueClass, kpiLabelClass, sectionLabelClass,
  tableHeaderClass, tableCellClass, filterChipClass,
  fmtCurrency, fmtNum, fmtPct, fmtDate, CustomTooltip,
  CHART_HEIGHT, axisStyle, gridStyle, currencyTick, numTick,
} from "@/lib/designTokens"

const SHIP_COLORS = ["#0F52BA", "#1A7A4A", "#C17D00", "#7C3AED", "#0891B2", "#BE185D"]

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

export default function ShippingAnalysis({ engine, store }: Props) {
  const [shipFilter, setShipFilter] = useFilter(store, "Ship_Mode")
  const [catFilter, setCatFilter] = useFilter(store, "Category")
  const allFilters = useFilters(store)
  const filterArr = useMemo(() => Object.values(allFilters).flat(), [allFilters])

  const shipModes = useDistinctValues(engine, "v_orders", "Ship_Mode")
  const categories = useDistinctValues(engine, "v_orders", "Category")

  // ── KPI: orders by ship mode for percentages ──
  const shipModeCounts = useAggregation(engine, {
    table: "v_orders",
    groupBy: ["Ship_Mode"],
    measures: [{ column: "Order_ID", fn: "count", alias: "cnt" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
  })

  const totalOrders = useMemo(() => {
    const data = shipModeCounts.data ?? []
    return data.reduce((sum: number, r: any) => sum + Number(r.cnt ?? 0), 0)
  }, [shipModeCounts.data])

  const shipModePcts = useMemo(() => {
    const data = shipModeCounts.data ?? []
    const map: Record<string, number> = {}
    data.forEach((r: any) => {
      map[r.Ship_Mode] = totalOrders > 0 ? (Number(r.cnt ?? 0) / totalOrders) * 100 : 0
    })
    return map
  }, [shipModeCounts.data, totalOrders])

  // ── Bar: Orders by Ship Mode ──
  const ordersByShip = useAggregation(engine, {
    table: "v_orders",
    groupBy: ["Ship_Mode"],
    measures: [{ column: "Order_ID", fn: "count", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "val", dir: "desc" }],
  })

  // ── Line: Orders over time by Ship Mode ──
  const ordersOverTime = useAggregation(engine, {
    table: "v_orders",
    groupBy: ["YearMonth", "Ship_Mode"],
    measures: [{ column: "Order_ID", fn: "count", alias: "cnt" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "YearMonth", dir: "asc" }],
  })

  const lineChartData = useMemo(() => {
    if (!ordersOverTime.data) return []
    const modes = new Set<string>()
    const byMonth: Record<string, Record<string, number>> = {}
    ordersOverTime.data.forEach((r: any) => {
      const mode = r.Ship_Mode ?? "Unknown"
      const month = fmtDate(r.YearMonth)
      modes.add(mode)
      if (!byMonth[month]) byMonth[month] = {}
      byMonth[month][mode] = (byMonth[month][mode] || 0) + Number(r.cnt ?? 0)
    })
    return Object.entries(byMonth)
      .map(([month, vals]) => ({ month, ...vals }))
      .sort((a, b) => {
        const da = new Date(a.month)
        const db = new Date(b.month)
        return da.getTime() - db.getTime()
      })
  }, [ordersOverTime.data])

  const shipModeList = useMemo(() => {
    if (!ordersOverTime.data) return []
    return [...new Set(ordersOverTime.data.map((r: any) => r.Ship_Mode ?? "Unknown"))]
  }, [ordersOverTime.data])

  // ── Table ──
  const tableData = useAggregation(engine, {
    table: "v_orders",
    groupBy: ["Ship_Mode"],
    measures: [
      { column: "Order_ID", fn: "count", alias: "orders" },
      { column: "Sales", fn: "avg", alias: "avgSales" },
      { column: "Profit", fn: "avg", alias: "avgProfit" },
      { column: "Discount", fn: "avg", alias: "avgDisc" },
    ],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "orders", dir: "desc" }],
  })

  // ── Handlers ──
  const handleShipModeClick = (mode: string) => {
    if (!shipFilter || shipFilter.values?.[0] !== mode) {
      setShipFilter({ column: "Ship_Mode", op: "eq", values: [mode] })
    } else {
      setShipFilter(null)
    }
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value
    if (v) {
      setCatFilter({ column: "Category", op: "eq", values: [v] })
    } else {
      setCatFilter(null)
    }
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* ── KPI Row ── */}
      <div className="col-span-4">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Standard Class %</div>
          <div className={kpiValueClass} style={{ color: colors.brand }}>
            {fmtPct(shipModePcts["Standard Class"])}
          </div>
        </div>
      </div>
      <div className="col-span-4">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Second Class %</div>
          <div className={kpiValueClass} style={{ color: colors.success }}>
            {fmtPct(shipModePcts["Second Class"])}
          </div>
        </div>
      </div>
      <div className="col-span-4">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Same Day %</div>
          <div className={kpiValueClass} style={{ color: colors.warning }}>
            {fmtPct(shipModePcts["Same Day"])}
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="col-span-7">
        <div className={sectionLabelClass}>Ship Mode</div>
        <div className="flex flex-wrap gap-2">
          {(shipModes.data ?? []).map((m: string) => (
            <button
              key={m}
              onClick={() => handleShipModeClick(m)}
              className={filterChipClass(shipFilter?.values?.includes(m) ?? false)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <div className="col-span-5">
        <div className={sectionLabelClass}>Category</div>
        <select
          value={catFilter?.values?.[0] ?? ""}
          onChange={handleCategoryChange}
          className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm bg-white text-[#1F2937]"
        >
          <option value="">All Categories</option>
          {(categories.data ?? []).map((c: string) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* ── Orders by Ship Mode ── */}
      <div className="col-span-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Orders by Ship Mode</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.large}>
            <BarChart data={ordersByShip.data ?? []} layout="vertical" margin={{ left: 120, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis type="number" tickFormatter={numTick} {...axisStyle} />
              <YAxis type="category" dataKey="Ship_Mode" width={110} {...axisStyle} />
              <Tooltip content={<CustomTooltip formatter={fmtNum} />} />
              <Bar dataKey="val" fill={colors.chart[0]} radius={[0, 4, 4, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Orders over time by Ship Mode ── */}
      <div className="col-span-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Orders Over Time by Ship Mode</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.large}>
            <LineChart data={lineChartData} margin={{ left: 8, right: 16 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="month" {...axisStyle} />
              <YAxis tickFormatter={numTick} {...axisStyle} />
              <Tooltip content={<CustomTooltip formatter={fmtNum} />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {shipModeList.map((mode, i) => (
                <Line
                  key={mode}
                  type="monotone"
                  dataKey={mode}
                  stroke={SHIP_COLORS[i % SHIP_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="col-span-12">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Shipping Summary</div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={tableHeaderClass}>Ship Mode</th>
                  <th className={tableHeaderClass}>Orders</th>
                  <th className={tableHeaderClass}>Avg Sales</th>
                  <th className={tableHeaderClass}>Avg Profit</th>
                  <th className={tableHeaderClass}>Avg Discount</th>
                </tr>
              </thead>
              <tbody>
                {(tableData.data ?? []).map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-[#F1F5F9] transition-colors">
                    <td className={tableCellClass}>{row.Ship_Mode}</td>
                    <td className={tableCellClass}>{fmtNum(row.orders)}</td>
                    <td className={tableCellClass}>{fmtCurrency(row.avgSales)}</td>
                    <td className={tableCellClass}>{fmtCurrency(row.avgProfit)}</td>
                    <td className={tableCellClass}>{fmtPct(row.avgDisc)}</td>
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
