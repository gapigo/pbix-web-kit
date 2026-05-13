import { useAggregation, theme, formatCurrency, formatCompact, dateAxisFormatter, currencyTooltipFormatter } from "@pbix/runtime"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart,
} from "recharts"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

// ── Inline KPI card ──────────────────────────────────────
function KpiCard({
  label,
  value,
  subtitle,
  color,
  loading,
}: {
  label: string
  value: string
  subtitle?: string
  color: string
  loading: boolean
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: theme.radius.card,
        padding: theme.spacing.card,
        border: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
      }}
    >
      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: theme.semantic.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </span>
      <span style={{ fontSize: "1.75rem", fontWeight: 700, color }}>
        {loading ? "—" : value}
      </span>
      {subtitle && (
        <span style={{ fontSize: "0.75rem", color: theme.semantic.muted }}>{subtitle}</span>
      )}
    </div>
  )
}

// ── Reusable chart wrapper ───────────────────────────────
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: theme.radius.card,
        padding: theme.spacing.card,
        border: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{title}</span>
      {children}
    </div>
  )
}

// ── Custom tooltip (shared) ──────────────────────────────
function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean
  payload?: any[]
  label?: string
  formatter?: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  const fmt = formatter ?? formatCurrency
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #d1d5db",
        borderRadius: "0.375rem",
        padding: "0.5rem 0.75rem",
        fontSize: "0.8rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{label}</div>
      {payload.map((entry: any, i: number) => (
        <div key={i} style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" ? fmt(entry.value) : entry.value}
        </div>
      ))}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────
export default function SalesOverview({ engine, store }: Props) {
  // ── KPI queries ──────────────────────────────────────
  const totalRevenue = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Value", fn: "sum", alias: "revenue" }],
  })
  const avgDealSize = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Value", fn: "avg", alias: "avg" }],
  })
  const totalDeals = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Value", fn: "count", alias: "count" }],
  })
  const wonDeals = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Value", fn: "count", alias: "count" }],
    filters: [{ column: "Status", op: "eq", values: ["Won"] }],
  })

  // ── Chart queries ────────────────────────────────────
  const revenueByProduct = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Product"],
    measures: [{ column: "Value", fn: "sum", alias: "revenue" }],
    orderBy: [{ column: "revenue", dir: "desc" }],
    limit: 10,
  })

  const revenueByTerritory = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Territory"],
    measures: [{ column: "Value", fn: "sum", alias: "revenue" }],
    orderBy: [{ column: "revenue", dir: "desc" }],
  })

  const monthlyData = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["CloseDate"],
    measures: [
      { column: "Value", fn: "sum", alias: "revenue" },
      { column: "Value", fn: "count", alias: "deals" },
    ],
    orderBy: [{ column: "CloseDate", dir: "asc" }],
  })

  const funnelStages = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Sales Stage"],
    measures: [{ column: "Value", fn: "count", alias: "count" }],
    orderBy: [{ column: "count", dir: "desc" }],
  })

  const topDeals = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Account Name"],
    measures: [{ column: "Value", fn: "sum", alias: "value" }],
    orderBy: [{ column: "value", dir: "desc" }],
    limit: 10,
  })

  const dealsByIndustry = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Industry"],
    measures: [
      { column: "Value", fn: "sum", alias: "revenue" },
      { column: "Value", fn: "count", alias: "deals" },
    ],
    orderBy: [{ column: "revenue", dir: "desc" }],
    limit: 8,
  })

  // ── Derived KPIs ─────────────────────────────────────
  const rev = totalRevenue.data?.[0]?.revenue ?? 0
  const avg = avgDealSize.data?.[0]?.avg ?? 0
  const total = totalDeals.data?.[0]?.count ?? 0
  const won = wonDeals.data?.[0]?.count ?? 0
  const winRate = total > 0 ? ((won / total) * 100).toFixed(1) : "0.0"

  // ── Format monthly data for chart ────────────────────
  const monthlyChart =
    monthlyData.data?.map((d) => {
      const raw = d.CloseDate
      // DuckDB returns ISO date strings; extract YYYY-MM
      const label =
        typeof raw === "string" && raw.length >= 7 ? raw.slice(0, 7) : String(raw ?? "")
      return { month: label, revenue: d.revenue ?? 0, deals: d.deals ?? 0 }
    }) ?? []

  // ── Funnel data: normalised to percentage of max ─────
  const funnelMax = Math.max(
    ...(funnelStages.data?.map((d) => (d as any).count ?? 0) ?? [0])
  )

  // ── Loading state ────────────────────────────────────
  const kpiLoading = totalRevenue.loading || avgDealSize.loading || totalDeals.loading || wonDeals.loading

  const sectionStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: theme.spacing.gap,
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing.gap,
        padding: theme.spacing.page,
        fontFamily: theme.fontFamily.sans,
      }}
    >
      {/* ── Row 1: KPI Cards ───────────────────────────────── */}
      <div style={sectionStyle}>
        <KpiCard
          label="Total Revenue"
          value={formatCurrency(rev)}
          subtitle={`${formatCompact(total)} deals`}
          color={theme.colors[0]}
          loading={kpiLoading}
        />
        <KpiCard
          label="Avg Deal Size"
          value={formatCurrency(avg)}
          color={theme.colors[1]}
          loading={kpiLoading}
        />
        <KpiCard
          label="Total Deals"
          value={formatCompact(total)}
          subtitle={`${formatCompact(won)} won`}
          color={theme.colors[2]}
          loading={kpiLoading}
        />
        <KpiCard
          label="Win Rate"
          value={`${winRate}%`}
          color={theme.semantic.success}
          loading={kpiLoading}
        />
      </div>

      {/* ── Row 2: Revenue by Product + Revenue by Territory ── */}
      <div style={sectionStyle}>
        <ChartCard title="Revenue by Product (Top 10)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={revenueByProduct.data ?? []}
              layout="vertical"
              margin={{ left: 20, right: 20, top: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tickFormatter={(v: number) => formatCompact(v)} fontSize={11} />
              <YAxis type="category" dataKey="Product" width={100} fontSize={11} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="revenue" fill={theme.colors[0]} radius={[0, 4, 4, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue by Territory">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={revenueByTerritory.data ?? []}
              layout="vertical"
              margin={{ left: 20, right: 20, top: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tickFormatter={(v: number) => formatCompact(v)} fontSize={11} />
              <YAxis type="category" dataKey="Territory" width={100} fontSize={11} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="revenue" fill={theme.colors[3]} radius={[0, 4, 4, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Row 3: Monthly Revenue & Deals (Combo) ────────── */}
      <div style={{ ...sectionStyle, gridTemplateColumns: "1fr" }}>
        <ChartCard title="Monthly Revenue & Deals">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={monthlyChart} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" fontSize={11} />
              <YAxis
                yAxisId="revenue"
                tickFormatter={(v: number) => formatCompact(v)}
                fontSize={11}
              />
              <YAxis yAxisId="deals" orientation="right" fontSize={11} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Bar
                yAxisId="revenue"
                dataKey="revenue"
                fill={theme.colors[0]}
                radius={[4, 4, 0, 0]}
                name="Revenue"
                barSize={24}
              />
              <Line
                yAxisId="deals"
                dataKey="deals"
                stroke={theme.colors[2]}
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Deals"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Row 4: Funnel + Top Deals + Industry ──────────── */}
      <div style={sectionStyle}>
        <ChartCard title="Pipeline Funnel">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "0.5rem 0" }}>
            {funnelStages.data?.map((d: any, i: number) => {
              const count = d.count ?? 0
              const pct = funnelMax > 0 ? (count / funnelMax) * 100 : 0
              return (
                <div key={d["Sales Stage"] ?? i} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span
                    style={{
                      width: "7rem",
                      fontSize: "0.8rem",
                      fontWeight: 500,
                      textAlign: "right",
                      flexShrink: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {d["Sales Stage"]}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: "1.5rem",
                      background: "#f3f4f6",
                      borderRadius: "0.25rem",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: theme.colors[i % theme.colors.length],
                        borderRadius: "0.25rem",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                  <span style={{ width: "4rem", fontSize: "0.8rem", fontWeight: 600, textAlign: "right" }}>
                    {formatCompact(count)}
                  </span>
                </div>
              )
            })}
          </div>
        </ChartCard>

        <ChartCard title="Top Deals by Account">
          <div style={{ fontSize: "0.8rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                  <th style={{ textAlign: "left", padding: "0.375rem 0.5rem", fontWeight: 600, color: theme.semantic.muted }}>
                    Account
                  </th>
                  <th style={{ textAlign: "right", padding: "0.375rem 0.5rem", fontWeight: 600, color: theme.semantic.muted }}>
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {topDeals.data?.map((d: any, i: number) => (
                  <tr
                    key={d["Account Name"] ?? i}
                    style={{ borderBottom: "1px solid #f3f4f6" }}
                  >
                    <td style={{ padding: "0.375rem 0.5rem" }}>{d["Account Name"]}</td>
                    <td style={{ padding: "0.375rem 0.5rem", textAlign: "right", fontWeight: 500 }}>
                      {formatCurrency(d.value ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>

        <ChartCard title="Revenue by Industry">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={dealsByIndustry.data ?? []}
              layout="vertical"
              margin={{ left: 20, right: 20, top: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tickFormatter={(v: number) => formatCompact(v)} fontSize={11} />
              <YAxis type="category" dataKey="Industry" width={100} fontSize={11} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="revenue" fill={theme.colors[4]} radius={[0, 4, 4, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
