import { useAggregation, theme, formatCurrency, formatCompact, formatPercent, PBI_PALETTE } from "@pbix/runtime"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ScatterChart, Scatter, ZAxis,
  PieChart, Pie, Cell,
} from "recharts"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

const wonFilter = [{ column: "Status", op: "eq" as const, values: ["Won"] }]

function KpiCard({ label, value, format }: { label: string; value: string | number; format?: "currency" | "compact" | "percent" }) {
  const display = format === "currency" ? formatCurrency(Number(value))
    : format === "compact" ? formatCompact(Number(value))
    : format === "percent" ? formatPercent(Number(value))
    : value
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-white p-4 shadow-sm">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
      <span className="text-2xl font-bold" style={{ color: theme.colors[0] }}>{display}</span>
    </div>
  )
}

function CustomTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload) return null
  return (
    <div className="rounded-lg border bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-gray-700">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {formatter ? formatter(p.value) : formatCompact(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function IndustriesOverview({ engine }: Props) {
  // KPI queries
  const { data: totalRevenue } = useAggregation(engine, {
    table: "Opportunities",
    measures: [{ column: "Value", fn: "sum", alias: "revenue" }],
    filters: wonFilter,
  })
  const { data: dealCount } = useAggregation(engine, {
    table: "Opportunities",
    measures: [{ column: "Value", fn: "count", alias: "deals" }],
    filters: wonFilter,
  })
  const { data: avgDeal } = useAggregation(engine, {
    table: "Opportunities",
    measures: [{ column: "Value", fn: "avg", alias: "avgDeal" }],
    filters: wonFilter,
  })
  const { data: industryCount } = useAggregation(engine, {
    table: "Opportunities",
    groupBy: ["Industry"],
    measures: [{ column: "Industry", fn: "distinctCount", alias: "count" }],
    filters: wonFilter,
  })

  // Revenue by Industry (bar chart)
  const { data: revenueByIndustry } = useAggregation(engine, {
    table: "Opportunities",
    groupBy: ["Industry"],
    measures: [{ column: "Value", fn: "sum", alias: "revenue" }],
    filters: wonFilter,
    orderBy: [{ column: "revenue", dir: "desc" }],
  })

  // Deal metrics by Industry (scatter + table)
  const { data: industryMetrics } = useAggregation(engine, {
    table: "Opportunities",
    groupBy: ["Industry"],
    measures: [
      { column: "Value", fn: "sum", alias: "revenue" },
      { column: "Value", fn: "count", alias: "deals" },
      { column: "Value", fn: "avg", alias: "avgDeal" },
    ],
    filters: wonFilter,
    orderBy: [{ column: "revenue", dir: "desc" }],
  })

  // Won vs Total by Industry (for win rate)
  const { data: totalByIndustry } = useAggregation(engine, {
    table: "Opportunities",
    groupBy: ["Industry"],
    measures: [{ column: "Value", fn: "count", alias: "totalDeals" }],
    orderBy: [{ column: "totalDeals", dir: "desc" }],
  })

  const revenue = totalRevenue?.[0]?.revenue ?? 0
  const deals = dealCount?.[0]?.deals ?? 0
  const avg = avgDeal?.[0]?.avgDeal ?? 0
  const industries = industryCount?.length ?? 0

  // Merge win rate data
  const mergedMetrics = (industryMetrics ?? []).map((row) => {
    const totalRow = (totalByIndustry ?? []).find((t) => t.Industry === row.Industry)
    const totalDeals = totalRow?.totalDeals ?? 0
    return {
      ...row,
      totalDeals,
      winRate: totalDeals > 0 ? Number(row.deals) / totalDeals : 0,
    }
  })

  const topIndustries = (revenueByIndustry ?? []).slice(0, 10)

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Won Revenue" value={revenue} format="currency" />
        <KpiCard label="Deals Closed" value={deals} format="compact" />
        <KpiCard label="Avg Deal Size" value={avg} format="currency" />
        <KpiCard label="Industries Active" value={industries} format="compact" />
      </div>

      {/* Bar Chart - Revenue by Industry */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">Revenue by Industry (Top 10)</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={topIndustries} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="Industry" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" height={60} />
            <YAxis tickFormatter={(v: number) => formatCompact(v)} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip formatter={(v: number) => formatCurrency(v)} />} />
            <Bar dataKey="revenue" name="Revenue Won" fill={theme.colors[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Scatter Chart + Pie Chart row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Scatter - Revenue vs Deal Count by Industry */}
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">Revenue vs Deal Count by Industry</h3>
          <ResponsiveContainer width="100%" height={340}>
            <ScatterChart margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="deals"
                name="Deal Count"
                tickFormatter={(v: number) => formatCompact(v)}
                tick={{ fontSize: 12 }}
                label={{ value: "Deal Count", position: "bottom", offset: -4, fontSize: 12 }}
              />
              <YAxis
                dataKey="revenue"
                name="Revenue Won"
                tickFormatter={(v: number) => formatCompact(v)}
                tick={{ fontSize: 12 }}
                label={{ value: "Revenue Won", angle: -90, position: "left", offset: 0, fontSize: 12 }}
              />
              <ZAxis dataKey="winRate" range={[60, 400]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null
                  const d = payload[0].payload
                  return (
                    <div className="rounded-lg border bg-white px-3 py-2 text-sm shadow-md">
                      <p className="font-medium text-gray-700">{d.Industry}</p>
                      <p style={{ color: theme.colors[0] }}>Revenue: {formatCurrency(d.revenue)}</p>
                      <p style={{ color: theme.colors[2] }}>Deals: {formatCompact(d.deals)}</p>
                      <p>Win Rate: {formatPercent(d.winRate)}</p>
                      <p>Avg Deal: {formatCurrency(d.avgDeal)}</p>
                    </div>
                  )
                }}
              />
              <Scatter data={mergedMetrics} fill={theme.colors[0]} fillOpacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Pie - Revenue Distribution */}
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">Revenue Distribution by Industry</h3>
          <ResponsiveContainer width="100%" height={340}>
            <PieChart>
              <Pie
                data={topIndustries}
                cx="50%"
                cy="50%"
                outerRadius={120}
                innerRadius={50}
                dataKey="revenue"
                nameKey="Industry"
                label={({ Industry, percent }) => `${Industry} ${(percent * 100).toFixed(0)}%`}
                labelLine
              >
                {topIndustries.map((_, i) => (
                  <Cell key={i} fill={theme.colors[i % theme.colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detail Table */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">Industry Performance Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="py-2 pr-4">Industry</th>
                <th className="py-2 pr-4 text-right">Revenue Won</th>
                <th className="py-2 pr-4 text-right">Deal Count</th>
                <th className="py-2 pr-4 text-right">Avg Deal Size</th>
                <th className="py-2 pr-4 text-right">Total Deals</th>
                <th className="py-2 pr-4 text-right">Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {mergedMetrics.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 transition-colors hover:bg-gray-50">
                  <td className="py-2 pr-4 font-medium text-gray-800">{row.Industry}</td>
                  <td className="py-2 pr-4 text-right tabular-nums text-gray-700">{formatCurrency(row.revenue)}</td>
                  <td className="py-2 pr-4 text-right tabular-nums text-gray-700">{formatCompact(row.deals)}</td>
                  <td className="py-2 pr-4 text-right tabular-nums text-gray-700">{formatCurrency(row.avgDeal)}</td>
                  <td className="py-2 pr-4 text-right tabular-nums text-gray-700">{formatCompact(row.totalDeals)}</td>
                  <td className="py-2 pr-4 text-right tabular-nums text-gray-700">{formatPercent(row.winRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
