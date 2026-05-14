import { useState, useMemo } from "react"
import { useAggregation, useDistinctValues } from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"
import type { Filter } from "@pbix/runtime"
import {
  cardClass, kpiValueClass, kpiLabelClass, sectionLabelClass,
  tableHeaderClass, tableCellClass,
  fmtCurrency, fmtNum, fmtPct,
  colors,
} from "@/lib/designTokens"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

/** Build a store-style Filter from column + value, or null to clear. */
function makeFilter(column: string, value: string | null): Filter | null {
  return value ? { column, op: "eq" as const, values: [value] } : null
}

export default function QAQuery({ engine }: Props) {
  // Local cascading filter state — NOT from zustand store
  const [territory, setTerritory] = useState<string | null>(null)
  const [industry, setIndustry] = useState<string | null>(null)
  const [product, setProduct] = useState<string | null>(null)
  const [stage, setStage] = useState<string | null>(null)

  // Build filter array from local state
  const localFilters = useMemo<Filter[]>(() => {
    const f: Filter[] = []
    const t = makeFilter("Territory", territory)
    const ind = makeFilter("Industry", industry)
    const p = makeFilter("Product", product)
    const s = makeFilter("Sales Stage", stage)
    if (t) f.push(t)
    if (ind) f.push(ind)
    if (p) f.push(p)
    if (s) f.push(s)
    return f
  }, [territory, industry, product, stage])

  const filterArr = localFilters.length > 0 ? localFilters : undefined

  // Cascade: Territory (root)
  const territories = useDistinctValues(engine, "v_opportunities", "Territory")

  // Cascade: Industry filtered by Territory
  const industries = useDistinctValues(
    engine, "v_opportunities", "Industry",
    territory ? [{ column: "Territory", op: "eq", values: [territory] }] : undefined,
  )

  // Cascade: Product filtered by Territory + Industry
  const products = useDistinctValues(
    engine, "v_opportunities", "Product",
    localFilters.filter((f) => f.column !== "Product" && f.column !== "Sales Stage").length > 0
      ? localFilters.filter((f) => f.column !== "Product" && f.column !== "Sales Stage")
      : undefined,
  )

  // Cascade: Sales Stage filtered by Territory + Industry + Product
  const stages = useDistinctValues(
    engine, "v_opportunities", "Sales Stage",
    localFilters.filter((f) => f.column !== "Sales Stage").length > 0
      ? localFilters.filter((f) => f.column !== "Sales Stage")
      : undefined,
  )

  // Dynamic KPIs
  const totalRevenue = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Value", fn: "sum", alias: "val" }],
    filters: filterArr,
  })

  const totalDeals = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "OpportunitySeq", fn: "count", alias: "val" }],
    filters: filterArr,
  })

  const avgDealSize = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Value", fn: "avg", alias: "val" }],
    filters: filterArr,
  })

  const avgDiscount = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Discount", fn: "avg", alias: "val" }],
    filters: filterArr,
  })

  const maxDiscount = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Discount", fn: "max", alias: "val" }],
    filters: filterArr,
  })

  // Table data — real-time filtered
  const tableData = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Product", "Sales Stage", "Territory"],
    measures: [
      { column: "Value", fn: "sum", alias: "revenue" },
      { column: "OpportunitySeq", fn: "count", alias: "cnt" },
    ],
    filters: filterArr,
    orderBy: [{ column: "revenue", dir: "desc" }],
    limit: 100,
  })

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* == Cascading Filter Row == */}
      <div className="col-span-12 flex items-center gap-4 flex-wrap bg-white rounded-lg border border-[#E2E8F0] p-4 shadow-sm">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6B7280] block mb-1">
            Territory
          </label>
          <select
            value={territory ?? ""}
            onChange={(e) => {
              setTerritory(e.target.value || null)
              setIndustry(null)
              setProduct(null)
              setStage(null)
            }}
            className="border border-[#E2E8F0] rounded-md px-3 py-1.5 text-sm bg-white text-[#1F2937] w-40"
          >
            <option value="">All Territories</option>
            {(territories.data ?? []).map((t: string) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6B7280] block mb-1">
            Industry
          </label>
          <select
            value={industry ?? ""}
            onChange={(e) => {
              setIndustry(e.target.value || null)
              setProduct(null)
              setStage(null)
            }}
            className="border border-[#E2E8F0] rounded-md px-3 py-1.5 text-sm bg-white text-[#1F2937] w-40"
          >
            <option value="">All Industries</option>
            {(industries.data ?? []).map((ind: string) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6B7280] block mb-1">
            Product
          </label>
          <select
            value={product ?? ""}
            onChange={(e) => {
              setProduct(e.target.value || null)
              setStage(null)
            }}
            className="border border-[#E2E8F0] rounded-md px-3 py-1.5 text-sm bg-white text-[#1F2937] w-40"
          >
            <option value="">All Products</option>
            {(products.data ?? []).map((p: string) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6B7280] block mb-1">
            Sales Stage
          </label>
          <select
            value={stage ?? ""}
            onChange={(e) => setStage(e.target.value || null)}
            className="border border-[#E2E8F0] rounded-md px-3 py-1.5 text-sm bg-white text-[#1F2937] w-40"
          >
            <option value="">All Stages</option>
            {(stages.data ?? []).map((s: string) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Clear all */}
        {(territory || industry || product || stage) && (
          <button
            onClick={() => { setTerritory(null); setIndustry(null); setProduct(null); setStage(null) }}
            className="self-end text-[11px] text-[#B91C1C] underline hover:no-underline pb-1.5"
          >
            Clear all
          </button>
        )}
      </div>

      {/* == Dynamic KPIs == */}
      <div className={`${cardClass} col-span-4`}>
        <p className={kpiLabelClass}>Revenue</p>
        <p className={kpiValueClass}>{fmtCurrency(totalRevenue.data?.[0]?.val as number | null)}</p>
      </div>
      <div className={`${cardClass} col-span-4`}>
        <p className={kpiLabelClass}>Total Deals</p>
        <p className={kpiValueClass}>{fmtNum(totalDeals.data?.[0]?.val as number | null)}</p>
      </div>
      <div className={`${cardClass} col-span-4`}>
        <p className={kpiLabelClass}>Avg Deal Size</p>
        <p className={kpiValueClass}>{fmtCurrency(avgDealSize.data?.[0]?.val as number | null)}</p>
      </div>
      <div className={`${cardClass} col-span-4`}>
        <p className={kpiLabelClass}>Avg Discount</p>
        <p className={kpiValueClass}>{fmtPct(avgDiscount.data?.[0]?.val as number | null)}</p>
      </div>
      <div className={`${cardClass} col-span-4`}>
        <p className={kpiLabelClass}>Max Discount</p>
        <p className={kpiValueClass}>{fmtPct(maxDiscount.data?.[0]?.val as number | null)}</p>
      </div>
      <div className={`${cardClass} col-span-4`}>
        <p className={kpiLabelClass}>Filter Level</p>
        <p className={`${kpiValueClass} text-[#1F2937] text-[1.2rem]`}>
          {filterArr?.length ?? 0 > 0
            ? `${(filterArr?.length ?? 0)} filter${(filterArr?.length ?? 0) !== 1 ? "s" : ""} active`
            : "No filters"}
        </p>
      </div>

      {/* == Real-time Table == */}
      <div className={`${cardClass} col-span-12`}>
        <p className={sectionLabelClass}>Opportunity Data</p>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-white">
              <tr>
                <th className={tableHeaderClass}>Product</th>
                <th className={tableHeaderClass}>Sales Stage</th>
                <th className={tableHeaderClass}>Territory</th>
                <th className={tableHeaderClass}>Revenue</th>
                <th className={tableHeaderClass}>Deals</th>
              </tr>
            </thead>
            <tbody>
              {(tableData.data ?? []).map((row: any, i: number) => (
                <tr key={i} className="hover:bg-[#F1F5F9] transition-colors">
                  <td className={tableCellClass}>{row.Product}</td>
                  <td className={tableCellClass}>{row["Sales Stage"]}</td>
                  <td className={tableCellClass}>{row.Territory}</td>
                  <td className={tableCellClass}>{fmtCurrency(row.revenue)}</td>
                  <td className={tableCellClass}>{fmtNum(row.cnt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
