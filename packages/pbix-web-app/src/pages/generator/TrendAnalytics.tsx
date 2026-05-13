import { useAggregation, theme, formatCurrency, formatCompact, autoFormat, currencyTooltipFormatter, dateAxisFormatter } from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import React from "react"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

/* ── helpers ── */
const C = theme.colors

/* ── KPI card ── */
function KpiCard({
  label, value, loading, error, color = C[0],
}: {
  label: string
  value: string
  loading?: boolean
  error?: boolean
  color?: string
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 truncate">
        {label}
      </div>
      <div className="text-2xl font-bold" style={{ color }}>
        {loading ? (
          <div className="h-8 w-28 bg-gray-200 animate-pulse rounded" />
        ) : error ? (
          <span className="text-red-400 text-sm">Error</span>
        ) : (
          value
        )}
      </div>
    </div>
  )
}

/* ── Section wrapper ── */
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

/* ── Dollar formatter for chart ticks ── */
function dollarTick(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

/** Parse a CloseDate value to YYYY-MM label (handles SQL date and string forms). */
function monthLabel(d: unknown): string {
  if (!d) return ""
  const s = String(d)
  const date = s.length >= 10 ? new Date(s.slice(0, 10)) : new Date(s)
  if (isNaN(date.getTime())) return s.slice(0, 7) // fallback raw substring
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
}

/* ── Page ── */
export default function TrendAnalytics({ engine, store }: Props) {
  /* ────────── KPI queries ────────── */
  const totalRevenue = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Value", fn: "sum", alias: "val" }],
  })
  const avgDeal = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Value", fn: "avg", alias: "val" }],
  })
  const openPipeline = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Value", fn: "sum", alias: "val" }],
    filters: [{ column: "Status", op: "ne", values: ["Closed"] }],
  })
  const totalCount = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Value", fn: "count", alias: "val" }],
  })

  const kpiLoad = totalRevenue.loading || avgDeal.loading || openPipeline.loading || totalCount.loading
  const kpiErr = totalRevenue.error || avgDeal.error || openPipeline.error || totalCount.error

  const totalRev = totalRevenue.data?.[0]?.val as number | undefined
  const avgVal = avgDeal.data?.[0]?.val as number | undefined
  const pipeVal = openPipeline.data?.[0]?.val as number | undefined
  const oppsCount = totalCount.data?.[0]?.val as number | undefined

  /* ────────── Monthly revenue trend (ComposedChart: bars + line) ────────── */
  const monthlyTrend = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["CloseDate"],
    measures: [
      { column: "Value", fn: "sum", alias: "revenue" },
      { column: "Value", fn: "count", alias: "deals" },
    ],
    orderBy: [{ column: "CloseDate", dir: "asc" }],
  })

  // Aggregate monthly from daily data
  const trendBuckets: Record<string, { month: string; revenue: number; deals: number }> = {}
  for (const row of monthlyTrend.data ?? []) {
    const key = monthLabel(row.CloseDate)
    if (!key) continue
    if (!trendBuckets[key]) trendBuckets[key] = { month: key, revenue: 0, deals: 0 }
    trendBuckets[key].revenue += Number(row.revenue) || 0
    trendBuckets[key].deals += Number(row.deals) || 0
  }
  const trendChart = Object.values(trendBuckets).sort((a, b) => {
    // Parse months like "Jan 24" → sortable key
    const da = new Date(a.month)
    const db = new Date(b.month)
    return da.getTime() - db.getTime()
  })

  /* ────────── Revenue by Product LOB ────────── */
  const byLob = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Product LOB"],
    measures: [
      { column: "Value", fn: "sum", alias: "revenue" },
      { column: "Value", fn: "count", alias: "deals" },
    ],
    orderBy: [{ column: "revenue", dir: "desc" }],
  })

  /* ────────── Revenue by Territory ────────── */
  const byTerritory = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Territory"],
    measures: [{ column: "Value", fn: "sum", alias: "revenue" }],
    orderBy: [{ column: "revenue", dir: "desc" }],
  })

  /* ────────── Revenue by Sales Stage ────────── */
  const byStage = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Sales Stage"],
    measures: [
      { column: "Value", fn: "sum", alias: "revenue" },
      { column: "Value", fn: "count", alias: "deals" },
    ],
    orderBy: [{ column: "revenue", dir: "desc" }],
  })

  /* ────────── Revenue by Region ────────── */
  const byRegion = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Region"],
    measures: [{ column: "Value", fn: "sum", alias: "revenue" }],
    orderBy: [{ column: "revenue", dir: "desc" }],
  })

  /* ────────── Top deals detail ────────── */
  const topDeals = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Account Name", "Product", "Status", "Sales Stage", "CloseDate", "Owner"],
    measures: [{ column: "Value", fn: "sum", alias: "revenue" }],
    orderBy: [{ column: "revenue", dir: "desc" }],
    limit: 20,
  })

  /* ══════════════ RENDER ══════════════ */
  return (
    <div className="flex flex-col gap-5 p-5 max-w-[1400px] mx-auto">
      {/* ───── KPI row ───── */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Total Revenue"
          value={totalRev !== undefined ? formatCurrency(totalRev) : "—"}
          loading={kpiLoad}
          error={kpiErr}
          color={C[0]}
        />
        <KpiCard
          label="Avg Deal Size"
          value={avgVal !== undefined ? formatCurrency(avgVal) : "—"}
          loading={kpiLoad}
          error={kpiErr}
          color={C[1]}
        />
        <KpiCard
          label="Open Pipeline"
          value={pipeVal !== undefined ? formatCompact(pipeVal) : "—"}
          loading={kpiLoad}
          error={kpiErr}
          color={C[2]}
        />
        <KpiCard
          label="Total Opportunities"
          value={oppsCount !== undefined ? formatCompact(oppsCount) : "—"}
          loading={kpiLoad}
          error={kpiErr}
          color={C[3]}
        />
      </div>

      {/* ───── Monthly Revenue Trend (ComposedChart) ───── */}
      <Section title="Revenue Trend" subtitle="Monthly revenue (bars) and deal count (line) over time">
        {monthlyTrend.loading ? (
          <div className="h-72 bg-gray-100 animate-pulse rounded-lg" />
        ) : monthlyTrend.error || !trendChart.length ? (
          <div className="h-72 flex items-center justify-center text-gray-400 text-sm">—</div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendChart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={dollarTick} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number, name: string) =>
                    name === "Revenue" ? formatCurrency(v) : formatCompact(v)
                  }
                />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill={C[0]} radius={[3, 3, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="deals"
                  name="Deals"
                  stroke={C[2]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: C[2] }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </Section>

      {/* ───── Revenue by Product LOB (combo chart) ───── */}
      <Section title="Revenue by Product LOB" subtitle="Revenue (bars) vs deal count (line)">
        {byLob.loading ? (
          <div className="h-72 bg-gray-100 animate-pulse rounded-lg" />
        ) : byLob.error || !byLob.data?.length ? (
          <div className="h-72 flex items-center justify-center text-gray-400 text-sm">—</div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={byLob.data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="Product LOB" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={dollarTick} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number, name: string) =>
                  name === "revenue" ? formatCurrency(v) : formatCompact(v)
                } />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill={C[0]} radius={[3, 3, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="deals" name="Deals" stroke={C[2]} strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </Section>

      {/* ───── Revenue by Territory + Region side-by-side ───── */}
      <div className="grid grid-cols-2 gap-5">
        <Section title="Revenue by Territory">
          {byTerritory.loading ? (
            <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
          ) : byTerritory.error || !byTerritory.data?.length ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">—</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={byTerritory.data} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={dollarTick} />
                  <YAxis type="category" dataKey="Territory" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="revenue" name="Revenue" fill={C[1]} radius={[0, 3, 3, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>

        <Section title="Revenue by Region">
          {byRegion.loading ? (
            <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
          ) : byRegion.error || !byRegion.data?.length ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">—</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={byRegion.data} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={dollarTick} />
                  <YAxis type="category" dataKey="Region" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="revenue" name="Revenue" fill={C[3]} radius={[0, 3, 3, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>
      </div>

      {/* ───── Revenue by Sales Stage ───── */}
      <Section title="Revenue by Sales Stage" subtitle="Revenue value and deal count by sales stage">
        {byStage.loading ? (
          <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
        ) : byStage.error || !byStage.data?.length ? (
          <div className="h-64 flex items-center justify-center text-gray-400 text-sm">—</div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={byStage.data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="Sales Stage" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={dollarTick} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number, name: string) =>
                  name === "revenue" ? formatCurrency(v) : formatCompact(v)
                } />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill={C[1]} radius={[3, 3, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="deals" name="Deals" stroke={C[3]} strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </Section>

      {/* ───── Top Deals Detail Table ───── */}
      <Section title="Top Opportunities" subtitle="Largest 20 opportunities by value">
        {topDeals.loading ? (
          <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />
        ) : topDeals.error ? (
          <div className="h-24 flex items-center justify-center text-red-400 text-sm">Error loading data</div>
        ) : !topDeals.data?.length ? (
          <div className="h-24 flex items-center justify-center text-gray-400 text-sm">—</div>
        ) : (
          <div className="overflow-auto max-h-96 border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {["Account Name", "Value", "Product", "Status", "Sales Stage", "Owner", "Close Date"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-gray-600 text-xs uppercase tracking-wider border-b whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topDeals.data.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                    <td className="px-3 py-2 text-gray-700 font-medium">{row["Account Name"] ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                      {row.revenue != null ? formatCurrency(Number(row.revenue)) : "—"}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{row.Product ?? "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        String(row.Status ?? "").toLowerCase() === "won"
                          ? "bg-green-100 text-green-700"
                          : String(row.Status ?? "").toLowerCase() === "lost"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {row.Status ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-600">{row["Sales Stage"] ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-600">{row.Owner ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                      {row.CloseDate ? autoFormat(row.CloseDate, "CloseDate") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  )
}
