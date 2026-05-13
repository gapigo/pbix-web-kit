import { useAggregation, useQuery, theme, formatCurrency, formatCompact, formatPercent } from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import React, { useState } from "react"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

/* ── helpers ── */
const C = theme.colors
type ChartDim = "Product" | "Territory" | "Industry" | "PipelineStep" | "Product LOB"

const DIMENSIONS: { key: ChartDim; label: string }[] = [
  { key: "Product", label: "Product" },
  { key: "Territory", label: "Territory" },
  { key: "Industry", label: "Industry" },
  { key: "PipelineStep", label: "Pipeline Step" },
  { key: "Product LOB", label: "Product LOB" },
]

const CHART_TYPES = ["bar", "pie", "line"] as const
type ChartType = (typeof CHART_TYPES)[number]

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

/* ── Chart wrapper ── */
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

/* ── Dollar tick formatter ── */
function dollarTick(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

/* ══════════════ PAGE ══════════════ */
export default function QAQuery({ engine, store }: Props) {
  // ── Chart dimension & type toggles ──
  const [dim, setDim] = useState<ChartDim>("Product")
  const [chartType, setChartType] = useState<ChartType>("bar")

  /* ────────── KPI queries ────────── */
  const totalRevenue = useAggregation(engine, {
    table: "Opportunities",
    measures: [{ column: "Value", fn: "sum", alias: "val" }],
  })
  const avgDeal = useAggregation(engine, {
    table: "Opportunities",
    measures: [{ column: "Value", fn: "avg", alias: "val" }],
  })
  const dealCount = useAggregation(engine, {
    table: "Opportunities",
    measures: [{ column: "Value", fn: "count", alias: "val" }],
  })
  const winRateData = useQuery({
    engine,
    sql: `
      SELECT
        COUNT(*) AS total,
        COUNT(CASE WHEN LOWER(Status) = 'won' THEN 1 END) AS won
      FROM "Opportunities"
    `,
  })

  const kpiLoad = totalRevenue.loading || avgDeal.loading || dealCount.loading || winRateData.loading
  const kpiErr = totalRevenue.error || avgDeal.error || dealCount.error || winRateData.error

  const totalRev = totalRevenue.data?.[0]?.val as number | undefined
  const avgVal = avgDeal.data?.[0]?.val as number | undefined
  const totalDeals = dealCount.data?.[0]?.val as number | undefined
  const totalOpps = winRateData.data?.[0]?.total as number | undefined
  const wonOpps = winRateData.data?.[0]?.won as number | undefined
  const winRate = totalOpps && wonOpps != null ? wonOpps / totalOpps : undefined

  /* ────────── Exploratory chart query ────────── */
  const chartQuery = useAggregation(engine, {
    table: "Opportunities",
    groupBy: [dim],
    measures: [
      { column: "Value", fn: "sum", alias: "revenue" },
      { column: "Value", fn: "count", alias: "deals" },
    ],
    orderBy: [{ column: "revenue", dir: "desc" }],
    limit: 15,
  })

  /* ────────── Large detail table ────────── */
  const detailData = useQuery({
    engine,
    sql: `
      SELECT
        "Account", "Value", "Status", "Product", "Product LOB",
        "Territory", "Owner", "Manager", "Industry",
        strftime("CloseDate", '%Y-%m-%d') AS CloseDate,
        "PipelineStep", "Sales Stage", "Discount"
      FROM "Opportunities"
      ORDER BY "Value" DESC
      LIMIT 100
    `,
  })

  const DETAIL_COLS = [
    { key: "Account", label: "Account" },
    { key: "Value", label: "Value", fmt: (v: any) => formatCurrency(Number(v)) },
    { key: "Status", label: "Status" },
    { key: "Product", label: "Product" },
    { key: "Territory", label: "Territory" },
    { key: "Industry", label: "Industry" },
    { key: "PipelineStep", label: "Pipeline Step" },
    { key: "Sales Stage", label: "Sales Stage" },
    { key: "Owner", label: "Owner" },
    { key: "CloseDate", label: "Close Date" },
  ]

  /* ────────── Render chart by type ────────── */
  function renderChart() {
    if (chartQuery.loading) {
      return <div className="h-72 bg-gray-100 animate-pulse rounded-lg" />
    }
    if (chartQuery.error || !chartQuery.data?.length) {
      return <div className="h-72 flex items-center justify-center text-gray-400 text-sm">—</div>
    }

    const data = chartQuery.data
    const labelKey = dim

    if (chartType === "pie") {
      return (
        <div className="h-72 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="revenue"
                nameKey={labelKey}
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ [labelKey]: name, revenue }: any) => `${name}`}
                labelLine
              >
                {data.map((_: any, i: number) => (
                  <Cell key={i} fill={C[i % C.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )
    }

    if (chartType === "line") {
      return (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey={labelKey} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={dollarTick} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} labelStyle={{ fontWeight: 600 }} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke={C[0]}
                strokeWidth={2.5}
                dot={{ r: 3, fill: C[0] }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )
    }

    // default: bar chart (horizontal)
    return (
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 80, right: 16, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={dollarTick} />
            <YAxis type="category" dataKey={labelKey} tick={{ fontSize: 11 }} width={120} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Bar dataKey="revenue" name="Revenue" fill={C[0]} radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

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
          label="Total Deals"
          value={totalDeals !== undefined ? formatCompact(totalDeals) : "—"}
          loading={kpiLoad}
          error={kpiErr}
          color={C[2]}
        />
        <KpiCard
          label="Win Rate"
          value={winRate !== undefined ? `${(winRate * 100).toFixed(1)}%` : "—"}
          loading={kpiLoad}
          error={kpiErr}
          color={C[3]}
        />
      </div>

      {/* ───── Exploratory chart with toggles ───── */}
      <Section title="Explore Data" subtitle={`Revenue by ${dim}`}>
        {/* Dimension toggle */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs font-medium text-gray-500 self-center mr-1">Group by:</span>
          {DIMENSIONS.map((d) => (
            <button
              key={d.key}
              onClick={() => setDim(d.key)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                dim === d.key
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Chart type toggle */}
        <div className="flex gap-2 mb-4">
          <span className="text-xs font-medium text-gray-500 self-center mr-1">Chart:</span>
          {CHART_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setChartType(t)}
              className={`px-3 py-1 text-xs font-medium rounded border transition-colors capitalize ${
                chartType === t
                  ? "bg-gray-800 text-white border-gray-800"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Chart */}
        {renderChart()}
      </Section>

      {/* ───── Detail table ───── */}
      <Section title="Opportunity Details" subtitle="Top 100 opportunities with all key fields">
        {detailData.loading ? (
          <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />
        ) : detailData.error ? (
          <div className="h-24 flex items-center justify-center text-red-400 text-sm">Error loading data</div>
        ) : !detailData.data?.length ? (
          <div className="h-24 flex items-center justify-center text-gray-400 text-sm">—</div>
        ) : (
          <div className="overflow-auto max-h-[600px] border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {DETAIL_COLS.map((col) => (
                    <th
                      key={col.key}
                      className="px-3 py-2 text-left font-medium text-gray-600 text-xs uppercase tracking-wider border-b whitespace-nowrap"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detailData.data.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                    {DETAIL_COLS.map((col) => {
                      const raw = row[col.key]
                      const display = col.fmt ? col.fmt(raw) : raw ?? "—"
                      // Status badge styling
                      if (col.key === "Status") {
                        const status = String(raw ?? "").toLowerCase()
                        const badgeClass =
                          status === "won"
                            ? "bg-green-100 text-green-700"
                            : status === "lost"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                        return (
                          <td key={col.key} className="px-3 py-2">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
                              {display}
                            </span>
                          </td>
                        )
                      }
                      const isCurrency = col.key === "Value"
                      return (
                        <td
                          key={col.key}
                          className={`px-3 py-2 text-gray-700 whitespace-nowrap ${isCurrency ? "font-medium tabular-nums" : ""}`}
                        >
                          {display}
                        </td>
                      )
                    })}
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
