import { useAggregation, theme, formatCurrency, formatPercent, formatCompact } from "@pbix/runtime"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

/* ─── helpers ─── */

function winRate(won: number, total: number): number {
  if (total === 0) return 0
  return won / total
}

function mergeGrouped<T extends Record<string, any>>(
  keys: string,
  totals: T[] | undefined,
  wons: T[] | undefined,
): (T & { closeRate: number })[] {
  const wonMap = new Map((wons ?? []).map((r) => [r[keys], r]))
  return (totals ?? []).map((row) => {
    const won = wonMap.get(row[keys])
    return {
      ...row,
      won: won?.won ?? 0,
      closeRate: winRate(won?.won ?? 0, row.total ?? 0),
    }
  })
}

/* ─── custom tooltips ─── */

function PercentTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${theme.semantic.muted}22`,
        borderRadius: theme.radius.card,
        padding: "0.5rem 0.75rem",
        fontSize: 13,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((entry: any, i: number) => (
        <div key={i} style={{ color: entry.color, marginBottom: 2 }}>
          {entry.name}: {formatPercent(entry.value)}
        </div>
      ))}
    </div>
  )
}

/* ─── KPI card ─── */

function KpiCard({
  label,
  value,
  subtitle,
  color,
}: {
  label: string
  value: string
  subtitle?: string
  color?: string
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${theme.semantic.muted}22`,
        borderRadius: theme.radius.card,
        padding: "1rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <span style={{ fontSize: 13, color: theme.semantic.muted }}>{label}</span>
      <span style={{ fontSize: 28, fontWeight: 700, color: color ?? "#333" }}>{value}</span>
      {subtitle && (
        <span style={{ fontSize: 12, color: theme.semantic.muted }}>{subtitle}</span>
      )}
    </div>
  )
}

/* ─── card wrapper ─── */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${theme.semantic.muted}22`,
        borderRadius: theme.radius.card,
        padding: "1rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#333" }}>{title}</h3>
      {children}
    </div>
  )
}

/* ─── main page ─── */

export default function WinLossOverview({ engine }: Props) {
  /* ── KPI queries ── */

  const totalOpps = useAggregation(engine, {
    table: "Opportunities",
    measures: [{ column: "Value", fn: "count", alias: "count" }],
  })

  const wonData = useAggregation(engine, {
    table: "Opportunities",
    measures: [
      { column: "Value", fn: "count", alias: "won_count" },
      { column: "Value", fn: "sum", alias: "won_value" },
    ],
    filters: [{ column: "Status", op: "eq", values: ["Won"] }],
  })

  const totalValue = useAggregation(engine, {
    table: "Opportunities",
    measures: [{ column: "Value", fn: "sum", alias: "total_value" }],
  })

  const avgDeal = useAggregation(engine, {
    table: "Opportunities",
    measures: [{ column: "Value", fn: "avg", alias: "avg_value" }],
    filters: [{ column: "Status", op: "eq", values: ["Won"] }],
  })

  /* ── grouped queries (total + won, merged client-side) ── */

  // Close % by Product
  const prodTotal = useAggregation(engine, {
    table: "Opportunities",
    groupBy: ["Product"],
    measures: [{ column: "Value", fn: "count", alias: "total" }],
  })
  const prodWon = useAggregation(engine, {
    table: "Opportunities",
    groupBy: ["Product"],
    measures: [{ column: "Value", fn: "count", alias: "won" }],
    filters: [{ column: "Status", op: "eq", values: ["Won"] }],
  })

  // Close % by Manager
  const mgrTotal = useAggregation(engine, {
    table: "Opportunities",
    groupBy: ["Manager"],
    measures: [{ column: "Value", fn: "count", alias: "total" }],
  })
  const mgrWon = useAggregation(engine, {
    table: "Opportunities",
    groupBy: ["Manager"],
    measures: [{ column: "Value", fn: "count", alias: "won" }],
    filters: [{ column: "Status", op: "eq", values: ["Won"] }],
  })

  // Monthly trend
  const moTotal = useAggregation(engine, {
    table: "Opportunities",
    groupBy: ["CloseDate"],
    measures: [{ column: "Value", fn: "count", alias: "total" }],
  })
  const moWon = useAggregation(engine, {
    table: "Opportunities",
    groupBy: ["CloseDate"],
    measures: [{ column: "Value", fn: "count", alias: "won" }],
    filters: [{ column: "Status", op: "eq", values: ["Won"] }],
  })

  // Detail table
  const detail = useAggregation(engine, {
    table: "Opportunities",
    groupBy: ["Product", "Status", "Manager"],
    measures: [
      { column: "Value", fn: "count", alias: "count" },
      { column: "Value", fn: "sum", alias: "amount" },
    ],
    orderBy: [{ column: "Value", dir: "desc" }],
  })

  /* ── derived KPIs ── */

  const loading = totalOpps.loading || wonData.loading || totalValue.loading || avgDeal.loading

  const totalCount = totalOpps.data?.[0]?.count ?? 0
  const wonCount = wonData.data?.[0]?.won_count ?? 0
  const wonAmount = wonData.data?.[0]?.won_value ?? 0
  const totalAmount = totalValue.data?.[0]?.total_value ?? 0
  const avgSize = avgDeal.data?.[0]?.avg_value ?? 0

  const countWinRate = winRate(wonCount, totalCount)
  const weightedWinRate = totalAmount > 0 ? wonAmount / totalAmount : 0

  /* ── merge grouped results ── */

  const productChart = mergeGrouped("Product", prodTotal.data, prodWon.data)
    .sort((a, b) => b.closeRate - a.closeRate)

  const managerChart = mergeGrouped("Manager", mgrTotal.data, mgrWon.data)
    .sort((a, b) => b.closeRate - a.closeRate)

  // Monthly trend: merge, then aggregate by YYYY-MM
  const mergedMonthly = mergeGrouped("CloseDate", moTotal.data, moWon.data)
  const monthBuckets: Record<string, { month: string; won: number; total: number }> = {}
  for (const row of mergedMonthly) {
    if (!row.CloseDate) continue
    const raw = String(row.CloseDate)
    const monthKey = raw.length >= 7 ? raw.slice(0, 7) : raw
    if (!monthBuckets[monthKey]) monthBuckets[monthKey] = { month: monthKey, won: 0, total: 0 }
    monthBuckets[monthKey].won += row.won ?? 0
    monthBuckets[monthKey].total += row.total ?? 0
  }
  const trendChart = Object.values(monthBuckets)
    .map((b) => ({ ...b, closeRate: winRate(b.won, b.total) }))
    .sort((a, b) => a.month.localeCompare(b.month))

  /* ── render ── */

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.gap, padding: theme.spacing.page }}>
      {/* ── 4 KPI cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: theme.spacing.gap,
        }}
      >
        <KpiCard
          label="Total Opportunities"
          value={formatCompact(totalCount)}
          subtitle={`${totalCount.toLocaleString()} deals`}
          color={theme.colors[0]}
        />
        <KpiCard
          label="Won Amount"
          value={formatCurrency(wonAmount)}
          subtitle={`of ${formatCurrency(totalAmount)} pipeline`}
          color={theme.semantic.success}
        />
        <KpiCard
          label="Win Rate"
          value={formatPercent(countWinRate)}
          subtitle={`${formatCompact(wonCount)} won / ${formatCompact(totalCount)} total`}
          color={theme.colors[2]}
        />
        <KpiCard
          label="Avg Deal Size (Won)"
          value={formatCurrency(avgSize)}
          subtitle={loading ? "Loading\u2026" : undefined}
          color={theme.colors[4]}
        />
      </div>

      {/* ── Weighted Win Rate callout ── */}
      <div
        style={{
          background: "#F5F8FF",
          border: `1px solid ${theme.colors[0]}33`,
          borderRadius: theme.radius.card,
          padding: "0.5rem 1rem",
          fontSize: 13,
          color: theme.semantic.muted,
        }}
      >
        <strong>Weighted Win Rate:</strong>{" "}
        {formatPercent(weightedWinRate)} (by value) vs{" "}
        {formatPercent(countWinRate)} (by count){" \u2014 "}
        {weightedWinRate > countWinRate
          ? "won deals skew larger"
          : weightedWinRate < countWinRate
            ? "won deals skew smaller"
            : "even distribution"}
      </div>

      {/* ── bar charts row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: theme.spacing.gap }}>
        <Card title="Close % by Product">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={productChart} layout="vertical" margin={{ left: 20, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis type="number" tickFormatter={(v: number) => formatPercent(v)} fontSize={11} />
              <YAxis type="category" dataKey="Product" width={120} fontSize={11} tick={{ fill: "#666" }} />
              <Tooltip content={<PercentTooltip />} />
              <Bar dataKey="closeRate" name="Close %" fill={theme.colors[0]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Close % by Manager">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={managerChart} layout="vertical" margin={{ left: 20, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis type="number" tickFormatter={(v: number) => formatPercent(v)} fontSize={11} />
              <YAxis type="category" dataKey="Manager" width={120} fontSize={11} tick={{ fill: "#666" }} />
              <Tooltip content={<PercentTooltip />} />
              <Bar dataKey="closeRate" name="Close %" fill={theme.colors[1]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── trend line chart ── */}
      <Card title="Win Rate Trend">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trendChart} margin={{ left: 20, right: 20, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="month" fontSize={11} tick={{ fill: "#666" }} />
            <YAxis
              domain={[0, 1]}
              tickFormatter={(v: number) => formatPercent(v)}
              fontSize={11}
              tick={{ fill: "#666" }}
            />
            <Tooltip content={<PercentTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="closeRate"
              name="Win Rate"
              stroke={theme.colors[0]}
              strokeWidth={2}
              dot={{ r: 3, fill: theme.colors[0] }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* ── data table ── */}
      <Card title="Win / Loss Detail">
        <div style={{ overflowX: "auto", fontSize: 13 }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead>
              <tr style={{ borderBottom: `2px solid #eee` }}>
                <th style={{ padding: "0.5rem 0.75rem", fontWeight: 600, color: theme.semantic.muted }}>Product</th>
                <th style={{ padding: "0.5rem 0.75rem", fontWeight: 600, color: theme.semantic.muted }}>Status</th>
                <th style={{ padding: "0.5rem 0.75rem", fontWeight: 600, color: theme.semantic.muted }}>Manager</th>
                <th style={{ padding: "0.5rem 0.75rem", fontWeight: 600, color: theme.semantic.muted, textAlign: "right" }}>Deals</th>
                <th style={{ padding: "0.5rem 0.75rem", fontWeight: 600, color: theme.semantic.muted, textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(detail.data ?? []).length === 0 && !detail.loading && (
                <tr>
                  <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: theme.semantic.muted }}>
                    No data available
                  </td>
                </tr>
              )}
              {(detail.data ?? []).map((row: any, i: number) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    background:
                      row.Status === "Won" ? "#F0FFF4" : row.Status === "Lost" ? "#FFF5F5" : undefined,
                  }}
                >
                  <td style={{ padding: "0.5rem 0.75rem" }}>{row.Product ?? "\u2014"}</td>
                  <td style={{ padding: "0.5rem 0.75rem" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.1rem 0.5rem",
                        borderRadius: theme.radius.chip,
                        fontSize: 12,
                        fontWeight: 600,
                        background:
                          row.Status === "Won"
                            ? "#E6F4EA"
                            : row.Status === "Lost"
                              ? "#FCE8E6"
                              : "#F3F3F3",
                        color:
                          row.Status === "Won"
                            ? theme.semantic.success
                            : row.Status === "Lost"
                              ? theme.semantic.danger
                              : theme.semantic.muted,
                      }}
                    >
                      {row.Status ?? "\u2014"}
                    </span>
                  </td>
                  <td style={{ padding: "0.5rem 0.75rem" }}>{row.Manager ?? "\u2014"}</td>
                  <td style={{ padding: "0.5rem 0.75rem", textAlign: "right" }}>
                    {formatCompact(row.count ?? 0)}
                  </td>
                  <td style={{ padding: "0.5rem 0.75rem", textAlign: "right" }}>
                    {row.amount == null ? "\u2014" : formatCurrency(row.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
