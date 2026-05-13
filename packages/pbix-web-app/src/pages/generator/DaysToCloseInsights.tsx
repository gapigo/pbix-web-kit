import { useAggregation, useQuery, theme, formatCurrency, formatCompact } from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, ZAxis,
} from "recharts"
import React from "react"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

/* ── helpers ── */
const C = theme.colors

function wonFilter() {
  return { column: "Status" as const, op: "eq" as const, values: ["Won"] }
}

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

/* ── Custom tooltips ── */
function DaysTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number"
            ? String(entry.name).toLowerCase().includes("value") || String(entry.name).toLowerCase().includes("revenue")
              ? formatCurrency(entry.value)
              : `${Math.round(entry.value)}d`
            : entry.value
          }
        </p>
      ))}
    </div>
  )
}

function ScatterTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg text-xs">
      <p className="font-semibold mb-1">{row.Product}</p>
      <p>Avg Days: {Math.round(row.avgDays)}</p>
      <p>Revenue: {formatCurrency(row.revenue)}</p>
      <p>Deals: {formatCompact(row.count)}</p>
    </div>
  )
}

/* ── Main page ── */
export default function DaysToCloseInsights({ engine }: Props) {
  /* ── KPI queries ── */
  const avgDays = useAggregation(engine, {
    table: "Opportunities",
    measures: [{ column: "DaysToClose", fn: "avg", alias: "avg" }],
    filters: [wonFilter()],
  })

  const maxDaysAgg = useAggregation(engine, {
    table: "Opportunities",
    measures: [{ column: "DaysToClose", fn: "max", alias: "max" }],
    filters: [wonFilter()],
  })

  const wonCountAgg = useAggregation(engine, {
    table: "Opportunities",
    measures: [{ column: "Value", fn: "count", alias: "count" }],
    filters: [wonFilter()],
  })

  const wonRevenueAgg = useAggregation(engine, {
    table: "Opportunities",
    measures: [{ column: "Value", fn: "sum", alias: "revenue" }],
    filters: [wonFilter()],
  })

  /* ── Chart queries ── */
  const daysByProduct = useAggregation(engine, {
    table: "Opportunities",
    groupBy: ["Product"],
    measures: [
      { column: "DaysToClose", fn: "avg", alias: "avgDays" },
      { column: "Value", fn: "sum", alias: "revenue" },
      { column: "Value", fn: "count", alias: "count" },
    ],
    filters: [wonFilter()],
    orderBy: [{ column: "avgDays", dir: "desc" }],
    limit: 12,
  })

  const daysByTerritory = useAggregation(engine, {
    table: "Opportunities",
    groupBy: ["Territory"],
    measures: [
      { column: "DaysToClose", fn: "avg", alias: "avgDays" },
      { column: "Value", fn: "sum", alias: "revenue" },
      { column: "Value", fn: "count", alias: "count" },
    ],
    filters: [wonFilter()],
    orderBy: [{ column: "avgDays", dir: "desc" }],
    limit: 10,
  })

  /* ── Scatter query: avg days vs revenue by product ── */
  const scatterData = useAggregation(engine, {
    table: "Opportunities",
    groupBy: ["Product"],
    measures: [
      { column: "DaysToClose", fn: "avg", alias: "avgDays" },
      { column: "Value", fn: "sum", alias: "revenue" },
      { column: "Value", fn: "count", alias: "count" },
    ],
    filters: [wonFilter()],
    orderBy: [{ column: "revenue", dir: "desc" }],
    limit: 20,
  })

  /* ── Detail table: won deals sorted by days to close ── */
  const detailRows = useQuery({
    engine,
    sql: `
      SELECT "Account", "Product", "Territory", "Owner",
             "DaysToClose", "Value",
             strftime("CloseDate", '%Y-%m-%d') AS CloseDate
      FROM "Opportunities"
      WHERE LOWER("Status") = 'won'
      ORDER BY "DaysToClose" DESC
      LIMIT 50
    `,
  })

  /* ── Derived ── */
  const avgVal = avgDays.data?.[0]?.avg as number | undefined
  const maxVal = maxDaysAgg.data?.[0]?.max as number | undefined
  const wonCount = wonCountAgg.data?.[0]?.count as number | undefined
  const wonRev = wonRevenueAgg.data?.[0]?.revenue as number | undefined

  const loading =
    avgDays.loading || maxDaysAgg.loading || wonCountAgg.loading ||
    wonRevenueAgg.loading || daysByProduct.loading || daysByTerritory.loading ||
    scatterData.loading
  const errorState =
    avgDays.error || maxDaysAgg.error || wonCountAgg.error ||
    wonRevenueAgg.error || daysByProduct.error || daysByTerritory.error ||
    scatterData.error

  /* ══════════════ RENDER ══════════════ */
  return (
    <div className="flex flex-col gap-5 p-5 max-w-[1400px] mx-auto">
      {/* ── KPI row ── */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Avg Days to Close"
          value={avgVal !== undefined ? `${Math.round(avgVal)} days` : "—"}
          loading={loading}
          error={errorState}
          color={C[0]}
        />
        <KpiCard
          label="Max Days to Close"
          value={maxVal !== undefined ? `${Math.round(maxVal)} days` : "—"}
          loading={loading}
          error={errorState}
          color={C[1]}
        />
        <KpiCard
          label="Total Won Deals"
          value={wonCount !== undefined ? formatCompact(wonCount) : "—"}
          loading={loading}
          error={errorState}
          color={C[2]}
        />
        <KpiCard
          label="Won Revenue"
          value={wonRev !== undefined ? formatCurrency(wonRev) : "—"}
          loading={loading}
          error={errorState}
          color={C[3]}
        />
      </div>

      {/* ── Avg Days by Product ── */}
      <Section title="Days to Close by Product" subtitle="Average days to close and total revenue per product">
        {daysByProduct.loading ? (
          <div className="h-72 bg-gray-100 animate-pulse rounded-lg" />
        ) : daysByProduct.error || !daysByProduct.data?.length ? (
          <div className="h-72 flex items-center justify-center text-gray-400 text-sm">—</div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daysByProduct.data} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${Math.round(v)}d`} />
                <YAxis type="category" dataKey="Product" tick={{ fontSize: 11 }} width={120} />
                <Tooltip content={<DaysTooltip />} />
                <Bar dataKey="avgDays" name="Avg Days" fill={C[0]} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Section>

      {/* ── Avg Days by Territory ── */}
      <Section title="Days to Close by Territory" subtitle="Average days to close and total revenue per territory">
        {daysByTerritory.loading ? (
          <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
        ) : daysByTerritory.error || !daysByTerritory.data?.length ? (
          <div className="h-64 flex items-center justify-center text-gray-400 text-sm">—</div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daysByTerritory.data} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${Math.round(v)}d`} />
                <YAxis type="category" dataKey="Territory" tick={{ fontSize: 11 }} width={120} />
                <Tooltip content={<DaysTooltip />} />
                <Bar dataKey="avgDays" name="Avg Days" fill={C[3]} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Section>

      {/* ── Scatter: Days vs Revenue ── */}
      <Section title="Days to Close vs Revenue" subtitle="Avg days to close vs total revenue by product (bubble = deal count)">
        {scatterData.loading ? (
          <div className="h-72 bg-gray-100 animate-pulse rounded-lg" />
        ) : scatterData.error || !scatterData.data?.length ? (
          <div className="h-72 flex items-center justify-center text-gray-400 text-sm">—</div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ left: 8, right: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  dataKey="avgDays"
                  name="Avg Days"
                  tickFormatter={(v: number) => `${Math.round(v)}d`}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="revenue"
                  name="Revenue"
                  tickFormatter={(v: number) => formatCompact(v)}
                  tick={{ fontSize: 11 }}
                />
                <ZAxis type="number" dataKey="count" range={[40, 500]} />
                <Tooltip content={<ScatterTooltip />} />
                <Scatter data={scatterData.data} fill={C[0]}>
                  {scatterData.data.map((_: any, i: number) => (
                    <Cell key={i} fill={C[i % C.length]} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </Section>

      {/* ── Detail Table ── */}
      <Section title="Deal Detail" subtitle="Top 50 won deals by days to close (longest first)">
        {detailRows.loading ? (
          <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />
        ) : detailRows.error ? (
          <div className="h-24 flex items-center justify-center text-red-400 text-sm">Error loading data</div>
        ) : !detailRows.data?.length ? (
          <div className="h-24 flex items-center justify-center text-gray-400 text-sm">—</div>
        ) : (
          <div className="overflow-auto max-h-96 border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {["Account", "Product", "Territory", "Owner", "Days to Close", "Value", "Close Date"].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left font-medium text-gray-600 text-xs uppercase tracking-wider border-b whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detailRows.data.map((row, i) => {
                  const days = Number(row.DaysToClose ?? 0)
                  return (
                    <tr key={i} className="hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                      <td className="px-3 py-2 text-gray-700 font-medium">{row.Account ?? "—"}</td>
                      <td className="px-3 py-2 text-gray-600">{row.Product ?? "—"}</td>
                      <td className="px-3 py-2 text-gray-600">{row.Territory ?? "—"}</td>
                      <td className="px-3 py-2 text-gray-600">{row.Owner ?? "—"}</td>
                      <td className="px-3 py-2 text-gray-700 whitespace-nowrap font-medium">
                        {Math.round(days)} days
                      </td>
                      <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                        {formatCurrency(Number(row.Value ?? 0))}
                      </td>
                      <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{row.CloseDate ?? "—"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  )
}
