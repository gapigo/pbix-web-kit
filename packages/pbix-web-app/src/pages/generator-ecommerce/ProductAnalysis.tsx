import { useMemo } from "react"
import { useAggregation, useDistinctValues, useFilter, useFilters } from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
  ScatterChart, Scatter, Legend,
} from "recharts"
import {
  colors, cardClass, kpiValueClass, kpiLabelClass, sectionLabelClass,
  tableHeaderClass, tableCellClass, filterChipClass,
  fmtCurrency, fmtNum, fmtPct, CustomTooltip,
  CHART_HEIGHT, axisStyle, gridStyle, currencyTick,
} from "@/lib/designTokens"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

export default function ProductAnalysis({ engine, store }: Props) {
  const [catFilter, setCatFilter] = useFilter(store, "Category")
  const allFilters = useFilters(store)
  const filterArr = useMemo(() => Object.values(allFilters).flat(), [allFilters])

  const categories = useDistinctValues(engine, "v_orders", "Category")

  // ── KPI queries ──
  const topCatSales = useAggregation(engine, {
    table: "v_orders",
    groupBy: ["Category"],
    measures: [{ column: "Sales", fn: "sum", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "val", dir: "desc" }],
    limit: 1,
  })

  const bestMargin = useAggregation(engine, {
    table: "v_orders",
    groupBy: ["Category"],
    measures: [{ column: "Profit_Margin_Pct", fn: "avg", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "val", dir: "desc" }],
    limit: 1,
  })

  const subCategories = useDistinctValues(engine, "v_orders", "Sub_Category")
  const totalProducts = subCategories.data?.length ?? 0

  // ── Bar: Sales by Sub-Category Top 10 ──
  const salesBySub = useAggregation(engine, {
    table: "v_orders",
    groupBy: ["Sub_Category"],
    measures: [{ column: "Sales", fn: "sum", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "val", dir: "desc" }],
    limit: 10,
  })

  // ── Bar: Profit by Sub-Category ──
  const profitBySub = useAggregation(engine, {
    table: "v_orders",
    groupBy: ["Sub_Category"],
    measures: [{ column: "Profit", fn: "sum", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "val", dir: "desc" }],
    limit: 10,
  })

  // ── Scatter: Sales vs Profit by Sub-Category ──
  const scatterData = useAggregation(engine, {
    table: "v_orders",
    groupBy: ["Sub_Category"],
    measures: [
      { column: "Sales", fn: "sum", alias: "sales" },
      { column: "Profit", fn: "sum", alias: "profit" },
      { column: "Quantity", fn: "avg", alias: "qty" },
    ],
    filters: filterArr.length > 0 ? filterArr : undefined,
  })

  const scatterChartData = useMemo(() => {
    return (scatterData.data ?? []).map((r: any) => ({
      Sub_Category: r.Sub_Category,
      sales: Number(r.sales ?? 0),
      profit: Number(r.profit ?? 0),
      qty: Math.max(Math.round(Number(r.qty ?? 1) * 5), 5),
    }))
  }, [scatterData.data])

  // ── Table ──
  const tableData = useAggregation(engine, {
    table: "v_orders",
    groupBy: ["Sub_Category"],
    measures: [
      { column: "Sales", fn: "sum", alias: "sales" },
      { column: "Profit", fn: "sum", alias: "profit" },
      { column: "Profit_Margin_Pct", fn: "avg", alias: "margin" },
      { column: "Quantity", fn: "sum", alias: "qty" },
    ],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "sales", dir: "desc" }],
    limit: 20,
  })

  // ── Handlers ──
  const handleCategoryClick = (cat: string) => {
    if (!catFilter || catFilter.values?.[0] !== cat) {
      setCatFilter({ column: "Category", op: "eq", values: [cat] })
    } else {
      setCatFilter(null)
    }
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* ── KPI Row ── */}
      <div className="col-span-4">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Top Category Sales</div>
          <div className="flex items-baseline gap-2">
            <span className={kpiValueClass} style={{ color: colors.brand }}>
              {fmtCurrency(topCatSales.data?.[0]?.val)}
            </span>
            <span className="text-xs text-[#6B7280]">{topCatSales.data?.[0]?.Category}</span>
          </div>
        </div>
      </div>
      <div className="col-span-4">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Best Margin</div>
          <div className="flex items-baseline gap-2">
            <span className={kpiValueClass} style={{ color: colors.success }}>
              {fmtPct(bestMargin.data?.[0]?.val)}
            </span>
            <span className="text-xs text-[#6B7280]">{bestMargin.data?.[0]?.Category}</span>
          </div>
        </div>
      </div>
      <div className="col-span-4">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Total Products</div>
          <div className={kpiValueClass} style={{ color: colors.neutral }}>
            {fmtNum(totalProducts)}
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="col-span-12">
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

      {/* ── Sales by Sub-Category Top 10 ── */}
      <div className="col-span-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Sales by Sub-Category — Top 10</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.large}>
            <BarChart data={salesBySub.data ?? []} layout="vertical" margin={{ left: 120, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis type="number" tick={currencyTick} {...axisStyle} />
              <YAxis type="category" dataKey="Sub_Category" width={110} {...axisStyle} />
              <Tooltip content={<CustomTooltip formatter={fmtCurrency} />} />
              <Bar dataKey="val" fill={colors.chart[0]} radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Profit by Sub-Category ── */}
      <div className="col-span-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Profit by Sub-Category</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.large}>
            <BarChart data={profitBySub.data ?? []} layout="vertical" margin={{ left: 120, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis type="number" tick={currencyTick} {...axisStyle} />
              <YAxis type="category" dataKey="Sub_Category" width={110} {...axisStyle} />
              <Tooltip content={<CustomTooltip formatter={fmtCurrency} />} />
              <Bar dataKey="val" fill={colors.chart[1]} radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Scatter: Sales vs Profit ── */}
      <div className="col-span-12">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Sales vs Profit by Sub-Category</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.scatter}>
            <ScatterChart margin={{ left: 20, right: 20, top: 8, bottom: 8 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis type="number" dataKey="sales" name="Sales" tick={currencyTick} {...axisStyle} />
              <YAxis type="number" dataKey="profit" name="Profit" tick={currencyTick} {...axisStyle} />
              <Tooltip
                content={<CustomTooltip formatter={(v: number) => fmtCurrency(v)} />}
                cursor={{ strokeDasharray: "3 3" }}
              />
              <Scatter data={scatterChartData} dataKey="qty" fill={colors.chart[4]} opacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="col-span-12">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Sub-Category Breakdown</div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={tableHeaderClass}>Sub-Category</th>
                  <th className={tableHeaderClass}>Sales</th>
                  <th className={tableHeaderClass}>Profit</th>
                  <th className={tableHeaderClass}>Profit Margin %</th>
                  <th className={tableHeaderClass}>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {(tableData.data ?? []).map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-[#F1F5F9] transition-colors">
                    <td className={tableCellClass}>{row.Sub_Category}</td>
                    <td className={tableCellClass}>{fmtCurrency(row.sales)}</td>
                    <td className={tableCellClass}>{fmtCurrency(row.profit)}</td>
                    <td className={tableCellClass}>{fmtPct(row.margin)}</td>
                    <td className={tableCellClass}>{fmtNum(row.qty)}</td>
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
