import { useAggregation, theme, formatCurrency, formatCompact } from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

import {
  BarChart, Bar, PieChart, Pie, Cell, Treemap,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
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

/* ── Page ── */
export default function RevenueSourceBreakdown({ engine }: Props) {
  /* ────────── KPI queries ────────── */
  const totalRevenue = useAggregation(engine, {
    table: "Opportunities",
    measures: [{ column: "Value", fn: "sum", alias: "val" }],
  })
  const totalDeals = useAggregation(engine, {
    table: "Opportunities",
    measures: [{ column: "Value", fn: "count", alias: "cnt" }],
  })
  const avgDeal = useAggregation(engine, {
    table: "Opportunities",
    measures: [{ column: "Value", fn: "avg", alias: "val" }],
  })
  const maxDeal = useAggregation(engine, {
    table: "Opportunities",
    measures: [{ column: "Value", fn: "max", alias: "val" }],
  })
  const wonRevenue = useAggregation(engine, {
    table: "Opportunities",
    measures: [{ column: "Value", fn: "sum", alias: "val" }],
    filters: [{ column: "Status", op: "eq", values: ["Won"] }],
  })
  const lostRevenue = useAggregation(engine, {
    table: "Opportunities",
    measures: [{ column: "Value", fn: "sum", alias: "val" }],
    filters: [{ column: "Status", op: "eq", values: ["Lost"] }],
  })

  const kpiLoad = totalRevenue.loading || totalDeals.loading || avgDeal.loading || maxDeal.loading
  const kpiErr = totalRevenue.error || totalDeals.error || avgDeal.error || maxDeal.error

  const rev = totalRevenue.data?.[0]?.val as number | undefined
  const cnt = totalDeals.data?.[0]?.cnt as number | undefined
  const avg = avgDeal.data?.[0]?.val as number | undefined
  const max = maxDeal.data?.[0]?.val as number | undefined
  const wonVal = wonRevenue.data?.[0]?.val as number | undefined
  const lostVal = lostRevenue.data?.[0]?.val as number | undefined
  const totalWonLost = wonVal != null && lostVal != null ? wonVal + lostVal : undefined
  const winRatePct =
    wonVal != null && totalWonLost != null && totalWonLost > 0
      ? (wonVal / totalWonLost) * 100
      : undefined

  /* ────────── Revenue by Product ────────── */
  const byProduct = useAggregation(engine, {
    table: "Opportunities",
    groupBy: ["Product"],
    measures: [{ column: "Value", fn: "sum", alias: "revenue" }],
    orderBy: [{ column: "revenue", dir: "desc" }],
  })

  /* ────────── Revenue by Product LOB ────────── */
  const byLob = useAggregation(engine, {
    table: "Opportunities",
    groupBy: ["Product LOB"],
    measures: [
      { column: "Value", fn: "sum", alias: "revenue" },
      { column: "Value", fn: "count", alias: "deals" },
    ],
    orderBy: [{ column: "revenue", dir: "desc" }],
  })

  /* ────────── Revenue by Territory ────────── */
  const byTerritory = useAggregation(engine, {
    table: "Opportunities",
    groupBy: ["Territory"],
    measures: [{ column: "Value", fn: "sum", alias: "revenue" }],
    orderBy: [{ column: "revenue", dir: "desc" }],
  })

  /* ────────── Revenue by Industry ────────── */
  const byIndustry = useAggregation(engine, {
    table: "Opportunities",
    groupBy: ["Industry"],
    measures: [{ column: "Value", fn: "sum", alias: "revenue" }],
    orderBy: [{ column: "revenue", dir: "desc" }],
  })

  /* ────────── Revenue by Owner ────────── */
  const byOwner = useAggregation(engine, {
    table: "Opportunities",
    groupBy: ["Owner"],
    measures: [
      { column: "Value", fn: "sum", alias: "revenue" },
      { column: "Value", fn: "count", alias: "deals" },
    ],
    orderBy: [{ column: "revenue", dir: "desc" }],
  })

  /* ────────── Revenue by Sales Stage ────────── */
  const byStage = useAggregation(engine, {
    table: "Opportunities",
    groupBy: ["Sales Stage"],
    measures: [
      { column: "Value", fn: "sum", alias: "revenue" },
      { column: "Value", fn: "count", alias: "deals" },
    ],
    orderBy: [{ column: "revenue", dir: "desc" }],
  })

  /* ────────── Top accounts ────────── */
  const byAccount = useAggregation(engine, {
    table: "Opportunities",
    groupBy: ["Account"],
    measures: [{ column: "Value", fn: "sum", alias: "revenue" }],
    orderBy: [{ column: "revenue", dir: "desc" }],
    topN: 10,
  })

  /* ── Treemap data helpers ── */
  function toTreemap(rows: Record<string, any>[] | undefined, nameKey: string) {
    return (rows ?? []).map((r, i) => ({
      name: String(r[nameKey] ?? `#${i + 1}`),
      size: Number(r.revenue) || 0,
    }))
  }

  function toPie(rows: Record<string, any>[] | undefined, nameKey: string) {
    return (rows ?? []).map((r, i) => ({
      name: String(r[nameKey] ?? `#${i + 1}`),
      value: Number(r.revenue) || 0,
    }))
  }

  /* ══════════════ RENDER ══════════════ */
  return (
    <div className="flex flex-col gap-5 p-5 max-w-[1400px] mx-auto">
      {/* ───── KPI row ───── */}
      <div className="grid grid-cols-5 gap-4">
        <KpiCard
          label="Total Revenue"
          value={rev !== undefined ? formatCurrency(rev) : "—"}
          loading={kpiLoad}
          error={kpiErr}
          color={C[0]}
        />
        <KpiCard
          label="Total Deals"
          value={cnt !== undefined ? formatCompact(cnt) : "—"}
          loading={kpiLoad}
          error={kpiErr}
          color={C[1]}
        />
        <KpiCard
          label="Avg Deal Size"
          value={avg !== undefined ? formatCurrency(avg) : "—"}
          loading={kpiLoad}
          error={kpiErr}
          color={C[2]}
        />
        <KpiCard
          label="Largest Deal"
          value={max !== undefined ? formatCurrency(max) : "—"}
          loading={kpiLoad}
          error={kpiErr}
          color={C[3]}
        />
        <KpiCard
          label="Win Rate (by Value)"
          value={winRatePct !== undefined ? `${winRatePct.toFixed(1)}%` : "—"}
          loading={kpiLoad}
          error={kpiErr}
          color={winRatePct !== undefined ? (winRatePct >= 50 ? C[4] : C[5]) : C[0]}
        />
      </div>

      {/* ───── Treemap: Revenue by Product ───── */}
      <Section title="Revenue by Product" subtitle="Treemap showing revenue distribution across products">
        {byProduct.loading ? (
          <div className="h-72 bg-gray-100 animate-pulse rounded-lg" />
        ) : byProduct.error || !byProduct.data?.length ? (
          <div className="h-72 flex items-center justify-center text-gray-400 text-sm">—</div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={toTreemap(byProduct.data, "Product")}
                dataKey="size"
                nameKey="name"
                stroke="#fff"
                fill={C[0]}
                aspectRatio={16 / 9}
              >
                <Tooltip content={
                  // eslint-disable-next-line react/no-unstable-nested-components
                  ({ active, payload }: any) => {
                    if (!active || !payload?.length) return null
                    const row = payload[0].payload
                    return (
                      <div className="bg-white border border-gray-200 shadow-md rounded px-3 py-2 text-sm">
                        <div className="font-semibold text-gray-800">{row.name}</div>
                        <div className="text-gray-600">{formatCurrency(row.size)}</div>
                      </div>
                    )
                  }
                } />
              </Treemap>
            </ResponsiveContainer>
          </div>
        )}
      </Section>

      {/* ───── Pie: Revenue by Product LOB ───── */}
      <Section title="Revenue by Product LOB" subtitle="Distribution of revenue across product lines">
        {byLob.loading ? (
          <div className="h-72 bg-gray-100 animate-pulse rounded-lg" />
        ) : byLob.error || !byLob.data?.length ? (
          <div className="h-72 flex items-center justify-center text-gray-400 text-sm">—</div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={toPie(byLob.data, "Product LOB")}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
                  paddingAngle={2}
                >
                  {toPie(byLob.data, "Product LOB").map((_, i) => (
                    <Cell key={i} fill={C[i % C.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend
                  formatter={(value: string) => (
                    <span className="text-xs text-gray-700">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </Section>

      {/* ───── Horizontal bar: Revenue by Territory ───── */}
      <Section title="Revenue by Territory" subtitle="Total revenue by territory">
        {byTerritory.loading ? (
          <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
        ) : byTerritory.error || !byTerritory.data?.length ? (
          <div className="h-64 flex items-center justify-center text-gray-400 text-sm">—</div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byTerritory.data} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={dollarTick} />
                <YAxis type="category" dataKey="Territory" tick={{ fontSize: 11 }} width={100} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="revenue" name="Revenue" fill={C[0]} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Section>

      {/* ───── Industry breakdown ───── */}
      <Section title="Revenue by Industry" subtitle="Distribution of revenue across industries (top)">
        {byIndustry.loading ? (
          <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
        ) : byIndustry.error || !byIndustry.data?.length ? (
          <div className="h-64 flex items-center justify-center text-gray-400 text-sm">—</div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={toPie(byIndustry.data, "Industry")}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
                  paddingAngle={2}
                >
                  {toPie(byIndustry.data, "Industry").map((_, i) => (
                    <Cell key={i} fill={C[i % C.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend
                  formatter={(value: string) => (
                    <span className="text-xs text-gray-700">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </Section>

      {/* ───── Sales Stage bar ───── */}
      <Section title="Revenue by Sales Stage" subtitle="Revenue and deal count across sales stages">
        {byStage.loading ? (
          <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
        ) : byStage.error || !byStage.data?.length ? (
          <div className="h-64 flex items-center justify-center text-gray-400 text-sm">—</div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byStage.data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="Sales Stage" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={dollarTick} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number, name: string) =>
                  name === "revenue" ? formatCurrency(v) : formatCompact(v)
                } />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill={C[0]} radius={[3, 3, 0, 0]} />
                <Bar yAxisId="right" dataKey="deals" name="Deals" fill={C[2]} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Section>

      {/* ───── Owner bar chart ───── */}
      <Section title="Top Owners by Revenue" subtitle="Top-performing sales owners (top 10)">
        {byOwner.loading ? (
          <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
        ) : byOwner.error || !byOwner.data?.length ? (
          <div className="h-64 flex items-center justify-center text-gray-400 text-sm">—</div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byOwner.data} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={dollarTick} />
                <YAxis type="category" dataKey="Owner" tick={{ fontSize: 11 }} width={140} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="revenue" name="Revenue" fill={C[1]} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Section>

      {/* ───── Top accounts table ───── */}
      <Section title="Top Accounts" subtitle="Top 10 accounts by total revenue">
        {byAccount.loading ? (
          <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />
        ) : byAccount.error ? (
          <div className="h-24 flex items-center justify-center text-red-400 text-sm">Error loading data</div>
        ) : !byAccount.data?.length ? (
          <div className="h-24 flex items-center justify-center text-gray-400 text-sm">—</div>
        ) : (
          <div className="overflow-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 text-xs uppercase tracking-wider border-b">Rank</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 text-xs uppercase tracking-wider border-b">Account</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 text-xs uppercase tracking-wider border-b">Revenue</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 text-xs uppercase tracking-wider border-b">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {byAccount.data.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                    <td className="px-3 py-2 text-gray-500 text-xs font-medium w-8">{i + 1}</td>
                    <td className="px-3 py-2 text-gray-700 font-medium">{row.Account ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                      {row.revenue != null ? formatCurrency(Number(row.revenue)) : "—"}
                    </td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                      {rev && row.revenue != null ? `${((Number(row.revenue) / rev) * 100).toFixed(1)}%` : "—"}
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
