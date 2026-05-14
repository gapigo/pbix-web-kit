import { useMemo } from "react"
import { useAggregation, useDistinctValues, useFilter, useFilters } from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LineChart, Line,
} from "recharts"
import {
  colors, cardClass, kpiValueClass, kpiLabelClass, sectionLabelClass,
  tableHeaderClass, tableCellClass, filterChipClass,
  fmtCurrency, fmtNum, fmtPct, fmtDate, CustomTooltip,
  CHART_HEIGHT, axisStyle, gridStyle, currencyTick,
} from "@/lib/designTokens"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

export default function ExecutiveOverview({ engine, store }: Props) {
  const [catFilter, setCatFilter] = useFilter(store, "Category")
  const [regionFilter, setRegionFilter] = useFilter(store, "Region")
  const allFilters = useFilters(store)
  const filterArr = useMemo(() => Object.values(allFilters).flat(), [allFilters])

  const categories = useDistinctValues(engine, "v_orders", "Category")
  const regions = useDistinctValues(engine, "v_orders", "Region")

  // ── KPIs ──
  const totalSales = useAggregation(engine, {
    table: "v_orders",
    measures: [{ column: "Sales", fn: "sum", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
  })
  const totalProfit = useAggregation(engine, {
    table: "v_orders",
    measures: [{ column: "Profit", fn: "sum", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
  })
  const orderCount = useAggregation(engine, {
    table: "v_orders",
    measures: [{ column: "Order_ID", fn: "count", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
  })
  const profitMargin = useAggregation(engine, {
    table: "v_orders",
    measures: [{ column: "Profit_Margin_Pct", fn: "avg", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
  })

  // ── Charts ──
  const salesByCat = useAggregation(engine, {
    table: "v_orders",
    groupBy: ["Category"],
    measures: [{ column: "Sales", fn: "sum", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "val", dir: "desc" }],
  })

  const salesByRegion = useAggregation(engine, {
    table: "v_orders",
    groupBy: ["Region"],
    measures: [{ column: "Sales", fn: "sum", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "val", dir: "desc" }],
  })

  const salesTrend = useAggregation(engine, {
    table: "v_orders",
    groupBy: ["YearMonth"],
    measures: [{ column: "Sales", fn: "sum", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "YearMonth", dir: "asc" }],
  })

  const trendChartData = useMemo(() => {
    return (salesTrend.data ?? []).map((r: any) => ({
      month: fmtDate(r.YearMonth),
      val: Number(r.val ?? 0),
    }))
  }, [salesTrend.data])

  // ── Handlers ──
  const handleCategoryClick = (cat: string) => {
    if (!catFilter || catFilter.values?.[0] !== cat) {
      setCatFilter({ column: "Category", op: "eq", values: [cat] })
    } else {
      setCatFilter(null)
    }
  }

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value
    if (v) {
      setRegionFilter({ column: "Region", op: "eq", values: [v] })
    } else {
      setRegionFilter(null)
    }
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* ── KPI Row ── */}
      <div className="col-span-3">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Total Sales</div>
          <div className={kpiValueClass} style={{ color: colors.brand }}>
            {fmtCurrency(totalSales.data?.[0]?.val)}
          </div>
        </div>
      </div>
      <div className="col-span-3">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Total Profit</div>
          <div className={kpiValueClass} style={{ color: colors.success }}>
            {fmtCurrency(totalProfit.data?.[0]?.val)}
          </div>
        </div>
      </div>
      <div className="col-span-3">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Orders</div>
          <div className={kpiValueClass} style={{ color: colors.neutral }}>
            {fmtNum(orderCount.data?.[0]?.val)}
          </div>
        </div>
      </div>
      <div className="col-span-3">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Profit Margin %</div>
          <div className={kpiValueClass} style={{ color: colors.warning }}>
            {fmtPct(profitMargin.data?.[0]?.val)}
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="col-span-7">
        <div className={sectionLabelClass}>Category</div>
        <div className="flex flex-wrap gap-2">
          {(categories.data ?? []).map((cat: string) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={filterChipClass(catFilter?.values?.includes(cat) ?? false)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      <div className="col-span-5">
        <div className={sectionLabelClass}>Region</div>
        <select
          value={regionFilter?.values?.[0] ?? ""}
          onChange={handleRegionChange}
          className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm bg-white text-[#1F2937]"
        >
          <option value="">All Regions</option>
          {(regions.data ?? []).map((r: string) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* ── Sales by Category ── */}
      <div className="col-span-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Sales by Category</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.large}>
            <BarChart data={salesByCat.data ?? []} layout="vertical" margin={{ left: 100, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis type="number" tickFormatter={currencyTick} {...axisStyle} />
              <YAxis type="category" dataKey="Category" width={90} {...axisStyle} />
              <Tooltip content={<CustomTooltip formatter={fmtCurrency} />} />
              <Bar dataKey="val" fill={colors.chart[0]} radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Sales Trend Over Time ── */}
      <div className="col-span-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Sales Trend Over Time</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.large}>
            <LineChart data={trendChartData} margin={{ left: 8, right: 16 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="month" {...axisStyle} />
              <YAxis tickFormatter={currencyTick} {...axisStyle} />
              <Tooltip content={<CustomTooltip formatter={fmtCurrency} />} />
              <Line type="monotone" dataKey="val" stroke={colors.brand} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Sales by Region ── */}
      <div className="col-span-12">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Sales by Region</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.large}>
            <BarChart data={salesByRegion.data ?? []} layout="vertical" margin={{ left: 80, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis type="number" tickFormatter={currencyTick} {...axisStyle} />
              <YAxis type="category" dataKey="Region" width={70} {...axisStyle} />
              <Tooltip content={<CustomTooltip formatter={fmtCurrency} />} />
              <Bar dataKey="val" fill={colors.chart[2]} radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
