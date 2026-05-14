import { useAggregation, useDistinctValues, useFilter, useFilters } from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
} from "recharts"
import {
  colors, cardClass, kpiValueClass, kpiLabelClass, sectionLabelClass,
  tableHeaderClass, tableCellClass,
  fmtCurrency, fmtNum, fmtPct,
  CustomTooltip, CHART_HEIGHT, axisStyle, gridStyle, pctTick, currencyTick,
} from "@/lib/designTokens"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

export default function SalesDiscountingInsights({ engine, store }: Props) {
  const [territoryFilter, setTerritoryFilter] = useFilter(store, "v_opportunities.Territory")
  const [ownerFilter, setOwnerFilter] = useFilter(store, "v_opportunities.Owner")
  const allFilters = useFilters(store)
  const filterArr = Object.values(allFilters).flat()

  const activeTerritory = territoryFilter?.values?.[0] ?? null
  const activeOwner = ownerFilter?.values?.[0] ?? null

  // Distinct values for selects
  const territories = useDistinctValues(engine, "v_opportunities", "Territory")
  const owners = useDistinctValues(engine, "v_opportunities", "Owner")

  // KPI: Avg Discount %
  const avgDiscount = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Discount", fn: "avg", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
  })

  // KPI: Max Discount
  const maxDiscount = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Discount", fn: "max", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
  })

  // KPI: Revenue at Risk (Value sum where Discount > 0)
  const revAtRisk = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Value", fn: "sum", alias: "val" }],
    filters: [...filterArr, { column: "Discount", op: "gte", values: [0.01] }],
  })

  // KPI: Deals with Discount (count where Discount > 0)
  const dealsWithDiscount = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "OpportunitySeq", fn: "count", alias: "val" }],
    filters: [...filterArr, { column: "Discount", op: "gte", values: [0.01] }],
  })

  // Bar: Avg Discount by Territory (horizontal)
  const territoryBar = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Territory"],
    measures: [{ column: "Discount", fn: "avg", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "val", dir: "desc" }],
    limit: 12,
  })

  // Bar: Avg Discount by Owner/Manager
  const ownerBar = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Owner"],
    measures: [{ column: "Discount", fn: "avg", alias: "val" }],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "val", dir: "desc" }],
    limit: 15,
  })

  // Table: Territory × Avg Discount × Revenue × Count
  const tableData = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Territory"],
    measures: [
      { column: "Discount", fn: "avg", alias: "avgDisc" },
      { column: "Value", fn: "sum", alias: "revenue" },
      { column: "OpportunitySeq", fn: "count", alias: "cnt" },
    ],
    filters: filterArr.length > 0 ? filterArr : undefined,
    orderBy: [{ column: "avgDisc", dir: "desc" }],
    limit: 20,
  })

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* == FILTERS == */}
      <div className="col-span-12 flex items-center gap-4 flex-wrap">
        {/* Territory select */}
        <select
          value={activeTerritory ?? ""}
          onChange={(e) =>
            setTerritoryFilter(
              e.target.value
                ? { column: "v_opportunities.Territory", op: "eq", values: [e.target.value] }
                : null
            )
          }
          className="border border-[#E2E8F0] rounded-md px-3 py-1.5 text-sm bg-white text-[#1F2937]"
        >
          <option value="">All Territories</option>
          {(territories.data ?? []).map((t: string) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* Owner select */}
        <select
          value={activeOwner ?? ""}
          onChange={(e) =>
            setOwnerFilter(
              e.target.value
                ? { column: "v_opportunities.Owner", op: "eq", values: [e.target.value] }
                : null
            )
          }
          className="border border-[#E2E8F0] rounded-md px-3 py-1.5 text-sm bg-white text-[#1F2937]"
        >
          <option value="">All Owners</option>
          {(owners.data ?? []).map((o: string) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      {/* == KPIs == */}
      <div className={`${cardClass} col-span-3`}>
        <p className={kpiLabelClass}>Avg Discount %</p>
        <p className={kpiValueClass}>{fmtPct(avgDiscount.data?.[0]?.val as number | null)}</p>
      </div>
      <div className={`${cardClass} col-span-3`}>
        <p className={kpiLabelClass}>Max Discount</p>
        <p className={kpiValueClass}>{fmtPct(maxDiscount.data?.[0]?.val as number | null)}</p>
      </div>
      <div className={`${cardClass} col-span-3`}>
        <p className={kpiLabelClass}>Revenue at Risk</p>
        <p className={kpiValueClass}>{fmtCurrency(revAtRisk.data?.[0]?.val as number | null)}</p>
      </div>
      <div className={`${cardClass} col-span-3`}>
        <p className={kpiLabelClass}>Deals with Discount</p>
        <p className={kpiValueClass}>{fmtNum(dealsWithDiscount.data?.[0]?.val as number | null)}</p>
      </div>

      {/* == Bar: Avg Discount by Territory == */}
      <div className={`${cardClass} col-span-6`}>
        <p className={sectionLabelClass}>Avg Discount by Territory</p>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT.large}>
          <BarChart data={territoryBar.data ?? []} layout="vertical" margin={{ left: 20, right: 20 }}>
            <CartesianGrid {...gridStyle} />
            <XAxis type="number" tick={pctTick} {...axisStyle} domain={[0, 1]} />
            <YAxis type="category" dataKey="Territory" width={100} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip formatter={(v: number) => fmtPct(v)} />} />
            <Bar dataKey="val" fill={colors.warning} radius={[0, 4, 4, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* == Bar: Avg Discount by Owner == */}
      <div className={`${cardClass} col-span-6`}>
        <p className={sectionLabelClass}>Avg Discount by Owner</p>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT.large}>
          <BarChart data={ownerBar.data ?? []} layout="vertical" margin={{ left: 20, right: 20 }}>
            <CartesianGrid {...gridStyle} />
            <XAxis type="number" tick={pctTick} {...axisStyle} domain={[0, 1]} />
            <YAxis type="category" dataKey="Owner" width={120} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip formatter={(v: number) => fmtPct(v)} />} />
            <Bar dataKey="val" fill={colors.electric} radius={[0, 4, 4, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* == Table: Territory breakdown == */}
      <div className={`${cardClass} col-span-12`}>
        <p className={sectionLabelClass}>Discounting by Territory</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className={tableHeaderClass}>Territory</th>
                <th className={tableHeaderClass}>Avg Discount</th>
                <th className={tableHeaderClass}>Revenue</th>
                <th className={tableHeaderClass}>Deals</th>
              </tr>
            </thead>
            <tbody>
              {(tableData.data ?? []).map((row: any, i: number) => (
                <tr key={i} className="hover:bg-[#F1F5F9] transition-colors">
                  <td className={tableCellClass}>{row.Territory}</td>
                  <td className={tableCellClass}>{fmtPct(row.avgDisc)}</td>
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
