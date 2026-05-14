import { useMemo } from "react"
import { useAggregation, useDistinctValues, useFilter, useFilters } from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
  ScatterChart, Scatter,
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

export default function DiscountImpact({ engine, store }: Props) {
  const [catFilter, setCatFilter] = useFilter(store, "Category")
  const allFilters = useFilters(store)
  const filterArr = useMemo(() => Object.values(allFilters).flat(), [allFilters])

  const categories = useDistinctValues(engine, "v_orders", "Category")

  // ── Discounted filters ──
  const discountFilters = useMemo(() => {
    const f = filterArr.length > 0 ? [...filterArr] : []
    f.push({ column: "Discount", op: "gt", values: [0] })
    return f
  }, [filterArr])

  // ── KPIs ──
  const avgDiscount = useAggregation(engine, {
    table: "v_orders",
    measures: [{ column: "Discount", fn: "avg", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
  })

  const revAtRisk = useAggregation(engine, {
    table: "v_orders",
    measures: [{ column: "Sales", fn: "sum", alias: "val" }],
    filters: discountFilters,
  })

  const dealsWithDiscount = useAggregation(engine, {
    table: "v_orders",
    measures: [{ column: "Order_ID", fn: "count", alias: "val" }],
    filters: discountFilters,
  })

  // ── Bar: Avg Discount by Category ──
  const avgDiscByCat = useAggregation(engine, {
    table: "v_orders",
    groupBy: ["Category"],
    measures: [{ column: "Discount", fn: "avg", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "val", dir: "desc" }],
  })

  // ── Scatter: Discount vs Profit Margin by Sub-Category ──
  const scatterRaw = useAggregation(engine, {
    table: "v_orders",
    groupBy: ["Sub_Category"],
    measures: [
      { column: "Discount", fn: "avg", alias: "disc" },
      { column: "Profit_Margin_Pct", fn: "avg", alias: "margin" },
    ],
    filters: filterArr.length > 0 ? filterArr : undefined,
  })

  const scatterChartData = useMemo(() => {
    return (scatterRaw.data ?? [])
      .map((r: any) => ({
        name: r.Sub_Category,
        disc: Number(r.disc ?? 0),
        margin: Number(r.margin ?? 0),
      }))
      .filter((r) => r.disc > 0)
  }, [scatterRaw.data])

  // ── Table ──
  const tableData = useAggregation(engine, {
    table: "v_orders",
    groupBy: ["Category"],
    measures: [
      { column: "Discount", fn: "avg", alias: "avgDisc" },
      { column: "Profit_Margin_Pct", fn: "avg", alias: "avgMargin" },
      { column: "Sales", fn: "sum", alias: "sumSales" },
      { column: "Order_ID", fn: "count", alias: "cnt" },
    ],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "avgDisc", dir: "desc" }],
  })

  // ── Handlers ──
  const handleCategoryClick = (cat: string) => {
    if (!catFilter || catFilter.values?.[0] !== cat) {
      setCatFilter({ column: "Category", op: "eq", values: [cat] })
    } else {
      setCatFilter(null)
    }
  }

  const avgDiscPct = useMemo(() => {
    const raw = avgDiscount.data?.[0]?.val
    return raw != null ? Number(raw) * 100 : null
  }, [avgDiscount.data])

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* ── KPI Row ── */}
      <div className="col-span-4">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Avg Discount %</div>
          <div className={kpiValueClass} style={{ color: colors.warning }}>
            {fmtPct(avgDiscPct)}
          </div>
        </div>
      </div>
      <div className="col-span-4">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Revenue at Risk</div>
          <div className={kpiValueClass} style={{ color: colors.danger }}>
            {fmtCurrency(revAtRisk.data?.[0]?.val)}
          </div>
        </div>
      </div>
      <div className="col-span-4">
        <div className={cardClass}>
          <div className={kpiLabelClass}>Deals with Discount</div>
          <div className={kpiValueClass} style={{ color: colors.neutral }}>
            {fmtNum(dealsWithDiscount.data?.[0]?.val)}
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

      {/* ── Avg Discount by Category ── */}
      <div className="col-span-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Avg Discount by Category</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.large}>
            <BarChart data={avgDiscByCat.data ?? []} layout="vertical" margin={{ left: 100, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis type="number" tick={pctTick} {...axisStyle} domain={[0, 1]} />
              <YAxis type="category" dataKey="Category" width={90} {...axisStyle} />
              <Tooltip content={<CustomTooltip formatter={(v: number) => fmtPct(v)} />} />
              <Bar dataKey="val" fill={colors.warning} radius={[0, 4, 4, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Scatter: Discount vs Profit Margin ── */}
      <div className="col-span-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Discount vs Profit Margin by Sub-Category</div>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT.scatter}>
            <ScatterChart margin={{ left: 20, right: 20, top: 8, bottom: 8 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis type="number" dataKey="disc" name="Avg Discount" tick={pctTick} {...axisStyle} domain={[0, 1]} />
              <YAxis type="number" dataKey="margin" name="Profit Margin" tick={pctTick} {...axisStyle} domain={[0, 1]} />
              <Tooltip
                content={<CustomTooltip formatter={(v: number) => fmtPct(v)} />}
                cursor={{ strokeDasharray: "3 3" }}
              />
              <Scatter data={scatterChartData} fill={colors.chart[3]} opacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="col-span-12">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Discounting by Category</div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={tableHeaderClass}>Category</th>
                  <th className={tableHeaderClass}>Avg Discount</th>
                  <th className={tableHeaderClass}>Avg Profit Margin</th>
                  <th className={tableHeaderClass}>Sum Sales</th>
                  <th className={tableHeaderClass}>Count</th>
                </tr>
              </thead>
              <tbody>
                {(tableData.data ?? []).map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-[#F1F5F9] transition-colors">
                    <td className={tableCellClass}>{row.Category}</td>
                    <td className={tableCellClass}>{fmtPct(row.avgDisc)}</td>
                    <td className={tableCellClass}>{fmtPct(row.avgMargin)}</td>
                    <td className={tableCellClass}>{fmtCurrency(row.sumSales)}</td>
                    <td className={tableCellClass}>{fmtNum(row.cnt)}</td>
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
