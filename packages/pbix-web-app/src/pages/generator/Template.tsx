import { useAggregation, theme, formatCurrency, formatCompact, formatPercent, PBI_PALETTE } from "@pbix/runtime"
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
  PieChart,
  Pie,
  Cell,
} from "recharts"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

// ═══════════════════════════════════════════════════════════
// Generator Mode — reference template page
//
// ── Sections ──────────────────────────────────────────────
// 1. KPI row   — 4 aggregated metrics from Opportunities
// 2. Chart row — bar chart + pie chart side-by-side
// 3. Table row — detailed breakdown with sortable columns
//
// ── Patterns shown ───────────────────────────────────────
// • useAggregation with groupBy, measures, filters, orderBy
// • Inline KpiCard + ChartCard + data table helpers
// • Recharts: BarChart, PieChart, ComposedChart
// • theme, formatters, PBI_PALETTE
// ═══════════════════════════════════════════════════════════

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

// ── Helpers ───────────────────────────────────────────────

/** Format a date string to short month label (e.g. "Jan 25"). */
function monthLabel(raw: string | null | undefined): string {
  if (!raw || raw.length < 10) return String(raw ?? "")
  return new Date(raw + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  })
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
      <span
        style={{
          fontSize: "0.75rem",
          fontWeight: 600,
          color: theme.semantic.muted,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: "1.75rem", fontWeight: 700, color }}>
        {loading ? "—" : value}
      </span>
      {subtitle && (
        <span style={{ fontSize: "0.75rem", color: theme.semantic.muted }}>
          {subtitle}
        </span>
      )}
    </div>
  )
}

// ── Reusable chart wrapper ───────────────────────────────
function ChartCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
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
        gap: "0.75rem",
      }}
    >
      <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{title}</span>
      {children}
    </div>
  )
}

// ── Custom tooltip (supports custom formatter) ───────────
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

// ── Data table helper ────────────────────────────────────
function DataTable({
  columns,
  rows,
  formatters = {},
}: {
  columns: { key: string; label: string; align?: "left" | "right" }[]
  rows: Record<string, any>[]
  formatters?: Record<string, (v: any) => string>
}) {
  if (!rows.length) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "2rem",
          color: theme.semantic.muted,
          fontSize: "0.85rem",
        }}
      >
        No data available
      </div>
    )
  }
  return (
    <div style={{ overflowX: "auto", fontSize: "0.8rem" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: col.align ?? "left",
                  padding: "0.5rem 0.625rem",
                  fontWeight: 600,
                  color: theme.semantic.muted,
                  whiteSpace: "nowrap",
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.__key ?? i}
              style={{ borderBottom: "1px solid #f3f4f6" }}
            >
              {columns.map((col) => {
                const raw = row[col.key]
                const fmt = formatters[col.key]
                const display = fmt ? fmt(raw) : (raw ?? "—")
                return (
                  <td
                    key={col.key}
                    style={{
                      padding: "0.5rem 0.625rem",
                      textAlign: col.align ?? "left",
                      fontWeight: col.align === "right" ? 500 : 400,
                    }}
                  >
                    {String(display)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Page component
// ═══════════════════════════════════════════════════════════

export default function Template({ engine }: Props) {
  // ── 1. KPI queries ─────────────────────────────────────
  const totalRevenue = useAggregation(engine, {
    table: "Opportunities",
    measures: [{ column: "Value", fn: "sum", alias: "revenue" }],
  })

  const avgDealSize = useAggregation(engine, {
    table: "Opportunities",
    measures: [{ column: "Value", fn: "avg", alias: "avg" }],
  })

  const totalDeals = useAggregation(engine, {
    table: "Opportunities",
    measures: [{ column: "Value", fn: "count", alias: "count" }],
  })

  const wonDeals = useAggregation(engine, {
    table: "Opportunities",
    measures: [{ column: "Value", fn: "count", alias: "count" }],
    filters: [{ column: "Status", op: "eq", values: ["Won"] }],
  })

  // ── 2. Chart queries ───────────────────────────────────
  const revenueByProduct = useAggregation(engine, {
    table: "Opportunities",
    groupBy: ["Product"],
    measures: [{ column: "Value", fn: "sum", alias: "revenue" }],
    orderBy: [{ column: "revenue", dir: "desc" }],
    limit: 10,
  })

  const dealsByStatus = useAggregation(engine, {
    table: "Opportunities",
    groupBy: ["Status"],
    measures: [{ column: "Value", fn: "count", alias: "count" }],
    orderBy: [{ column: "count", dir: "desc" }],
  })

  const monthlyTrend = useAggregation(engine, {
    table: "Opportunities",
    groupBy: ["CloseDate"],
    measures: [
      { column: "Value", fn: "sum", alias: "revenue" },
      { column: "Value", fn: "count", alias: "deals" },
    ],
    orderBy: [{ column: "CloseDate", dir: "asc" }],
  })

  // ── 3. Table query ─────────────────────────────────────
  const detailRows = useAggregation(engine, {
    table: "Opportunities",
    groupBy: ["Product", "Territory", "Owner"],
    measures: [
      { column: "Value", fn: "sum", alias: "revenue" },
      { column: "Value", fn: "count", alias: "deals" },
      { column: "Value", fn: "avg", alias: "avgDeal" },
    ],
    orderBy: [{ column: "revenue", dir: "desc" }],
    limit: 50,
  })

  // ── Derived KPI values ─────────────────────────────────
  const rev = totalRevenue.data?.[0]?.revenue ?? 0
  const avg = avgDealSize.data?.[0]?.avg ?? 0
  const total = totalDeals.data?.[0]?.count ?? 0
  const won = wonDeals.data?.[0]?.count ?? 0
  const winRate = total > 0 ? ((won / total) * 100).toFixed(1) : "0.0"

  // ── Prepare chart data ─────────────────────────────────
  const trendData =
    monthlyTrend.data?.map((r) => ({
      month: monthLabel(r.CloseDate),
      revenue: Number(r.revenue) ?? 0,
      deals: Number(r.deals) ?? 0,
    })) ?? []

  // ── Loading state ──────────────────────────────────────
  const loading =
    totalRevenue.loading ||
    avgDealSize.loading ||
    totalDeals.loading ||
    wonDeals.loading ||
    revenueByProduct.loading ||
    dealsByStatus.loading ||
    monthlyTrend.loading ||
    detailRows.loading

  // ── Grid helpers ───────────────────────────────────────
  const twoCol: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: theme.spacing.gap,
  }

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
      {/* ════════════════════════════════════════════════════
          SECTION 1: KPI Cards
          ════════════════════════════════════════════════════ */}
      <div style={sectionStyle}>
        <KpiCard
          label="Total Revenue"
          value={formatCurrency(rev)}
          subtitle={`${formatCompact(total)} deals`}
          color={PBI_PALETTE[0]}
          loading={loading}
        />
        <KpiCard
          label="Avg Deal Size"
          value={formatCurrency(avg)}
          color={PBI_PALETTE[1]}
          loading={loading}
        />
        <KpiCard
          label="Total Deals"
          value={formatCompact(total)}
          subtitle={`${formatCompact(won)} won`}
          color={PBI_PALETTE[2]}
          loading={loading}
        />
        <KpiCard
          label="Win Rate"
          value={`${winRate}%`}
          color={theme.semantic.success}
          loading={loading}
        />
      </div>

      {/* ════════════════════════════════════════════════════
          SECTION 2: Charts — Product bar chart + Status pie
          ════════════════════════════════════════════════════ */}
      <div style={twoCol}>
        {/* ── Horizontal bar: Revenue by Product ───────── */}
        <ChartCard title="Revenue by Product (Top 10)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={revenueByProduct.data ?? []}
              layout="vertical"
              margin={{ left: 20, right: 20, top: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                tickFormatter={(v: number) => formatCompact(v)}
                fontSize={11}
              />
              <YAxis
                type="category"
                dataKey="Product"
                width={100}
                fontSize={11}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="revenue"
                fill={PBI_PALETTE[0]}
                radius={[0, 4, 4, 0]}
                name="Revenue"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ── Pie: Deals by Status ─────────────────────── */}
        <ChartCard title="Deals by Status">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={dealsByStatus.data ?? []}
                dataKey="count"
                nameKey="Status"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={40}
                paddingAngle={2}
              >
                {(dealsByStatus.data ?? []).map((_: any, i: number) => (
                  <Cell
                    key={i}
                    fill={PBI_PALETTE[i % PBI_PALETTE.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip formatter={formatCompact} />} />
              <Legend
                formatter={(value: string) => (
                  <span style={{ fontSize: "0.8rem" }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ════════════════════════════════════════════════════
          SECTION 3: Monthly trend — Composed chart
          ════════════════════════════════════════════════════ */}
      <div style={{ ...sectionStyle, gridTemplateColumns: "1fr" }}>
        <ChartCard title="Monthly Revenue & Deals Trend">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart
              data={trendData}
              margin={{ left: 8, right: 8, top: 4, bottom: 4 }}
            >
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
                fill={PBI_PALETTE[0]}
                radius={[4, 4, 0, 0]}
                name="Revenue"
                barSize={24}
              />
              <Line
                yAxisId="deals"
                dataKey="deals"
                stroke={PBI_PALETTE[2]}
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Deals"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ════════════════════════════════════════════════════
          SECTION 4: Data table — detail breakdown
          ════════════════════════════════════════════════════ */}
      <ChartCard title="Opportunity Detail Breakdown">
        <DataTable
          columns={[
            { key: "Product", label: "Product" },
            { key: "Territory", label: "Territory" },
            { key: "Owner", label: "Owner" },
            { key: "revenue", label: "Revenue", align: "right" },
            { key: "deals", label: "Deals", align: "right" },
            { key: "avgDeal", label: "Avg Deal", align: "right" },
          ]}
          rows={(detailRows.data ?? []).map((r, i) => ({
            ...r,
            __key: i,
            revenue: Number(r.revenue) ?? 0,
            deals: Number(r.deals) ?? 0,
            avgDeal: Number(r.avgDeal) ?? 0,
          }))}
          formatters={{
            revenue: (v: number) => formatCurrency(v),
            deals: (v: number) => formatCompact(v),
            avgDeal: (v: number) => formatCurrency(v),
          }}
        />
      </ChartCard>
    </div>
  )
}
