import { useAggregation, theme, formatCurrency, formatCompact, formatPercent, PBI_PALETTE } from "@pbix/runtime"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, PieChart, Pie, Cell,
} from "recharts"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

const TABLE = "v_opportunities"

const wonFilter = [{ column: "Status", op: "eq" as const, values: ["Won"] }]

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
export default function IndustriesOverview({ engine }: Props) {
  // ── KPI queries ──────────────────────────────────────
  const totalRevenue = useAggregation(engine, {
    table: TABLE,
    measures: [{ column: "Value", fn: "sum", alias: "revenue" }],
    filters: wonFilter,
  })
  const avgDealSize = useAggregation(engine, {
    table: TABLE,
    measures: [{ column: "Value", fn: "avg", alias: "avg" }],
    filters: wonFilter,
  })
  const wonDeals = useAggregation(engine, {
    table: TABLE,
    measures: [{ column: "Value", fn: "count", alias: "count" }],
    filters: wonFilter,
  })
  const industryCount = useAggregation(engine, {
    table: TABLE,
    groupBy: ["Industry"],
    measures: [{ column: "Industry", fn: "distinctCount", alias: "count" }],
    filters: wonFilter,
  })

  // ── Revenue by Industry (bar chart) ───────────────────
  const revenueByIndustry = useAggregation(engine, {
    table: TABLE,
    groupBy: ["Industry"],
    measures: [{ column: "Value", fn: "sum", alias: "revenue" }],
    filters: wonFilter,
    orderBy: [{ column: "revenue", dir: "desc" }],
    limit: 10,
  })

  // ── Scatter data: revenue vs deals by Industry ────────
  const scatterData = useAggregation(engine, {
    table: TABLE,
    groupBy: ["Industry"],
    measures: [
      { column: "Value", fn: "sum", alias: "revenue" },
      { column: "Value", fn: "count", alias: "deals" },
      { column: "Value", fn: "avg", alias: "avgDeal" },
    ],
    filters: wonFilter,
    orderBy: [{ column: "revenue", dir: "desc" }],
  })

  // ── Total deals by Industry (for win rate) ────────────
  const totalByIndustry = useAggregation(engine, {
    table: TABLE,
    groupBy: ["Industry"],
    measures: [{ column: "Value", fn: "count", alias: "totalDeals" }],
    orderBy: [{ column: "totalDeals", dir: "desc" }],
  })

  // ── Revenue distribution by Region ────────────────────
  const revenueByRegion = useAggregation(engine, {
    table: TABLE,
    groupBy: ["Region"],
    measures: [{ column: "Value", fn: "sum", alias: "revenue" }],
    filters: wonFilter,
    orderBy: [{ column: "revenue", dir: "desc" }],
  })

  // ── Derived values ────────────────────────────────────
  const rev = totalRevenue.data?.[0]?.revenue ?? 0
  const avg = avgDealSize.data?.[0]?.avg ?? 0
  const deals = wonDeals.data?.[0]?.count ?? 0
  const industries = industryCount.data?.length ?? 0
  const kpiLoading = totalRevenue.loading || avgDealSize.loading || wonDeals.loading || industryCount.loading

  // ── Merge win rate into scatter data ──────────────────
  const industryPerformance = (scatterData.data ?? []).map((row) => {
    const totalRow = (totalByIndustry.data ?? []).find((t) => t.Industry === row.Industry)
    const totalDealsCount = totalRow?.totalDeals ?? 0
    return {
      ...row,
      totalDeals: totalDealsCount,
      winRate: totalDealsCount > 0 ? Number(row.deals) / totalDealsCount : 0,
    }
  })

  const topIndustries = (revenueByIndustry.data ?? []).slice(0, 10)

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
          label="Won Revenue"
          value={formatCurrency(rev)}
          subtitle={`${formatCompact(deals)} deals closed`}
          color={PBI_PALETTE[0]}
          loading={kpiLoading}
        />
        <KpiCard
          label="Avg Deal Size"
          value={formatCurrency(avg)}
          color={PBI_PALETTE[1]}
          loading={kpiLoading}
        />
        <KpiCard
          label="Deals Closed"
          value={formatCompact(deals)}
          color={PBI_PALETTE[2]}
          loading={kpiLoading}
        />
        <KpiCard
          label="Industries Active"
          value={String(industries)}
          color={PBI_PALETTE[3]}
          loading={kpiLoading}
        />
      </div>

      {/* ── Row 2: Revenue by Industry + Revenue by Region ── */}
      <div style={sectionStyle}>
        <ChartCard title="Revenue by Industry (Top 10)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topIndustries} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="Industry" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={60} />
              <YAxis tickFormatter={(v: number) => formatCompact(v)} tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="revenue" fill={PBI_PALETTE[0]} radius={[4, 4, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue by Region">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByRegion.data ?? []} layout="vertical" margin={{ left: 20, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tickFormatter={(v: number) => formatCompact(v)} fontSize={11} />
              <YAxis type="category" dataKey="Region" width={90} fontSize={11} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="revenue" fill={PBI_PALETTE[2]} radius={[0, 4, 4, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Row 3: Scatter + Donut ───────────────────────── */}
      <div style={sectionStyle}>
        <ChartCard title="Revenue vs Deal Count by Industry">
          <ResponsiveContainer width="100%" height={340}>
            <ScatterChart margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="deals"
                name="Deal Count"
                tickFormatter={(v: number) => formatCompact(v)}
                tick={{ fontSize: 11 }}
                label={{ value: "Deal Count", position: "bottom", offset: -4, fontSize: 11 }}
              />
              <YAxis
                dataKey="revenue"
                name="Revenue Won"
                tickFormatter={(v: number) => formatCompact(v)}
                tick={{ fontSize: 11 }}
                label={{ value: "Revenue", angle: -90, position: "left", offset: 0, fontSize: 11 }}
              />
              <ZAxis dataKey="winRate" range={[60, 400]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null
                  const d = payload[0].payload
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
                      <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{d.Industry}</div>
                      <div style={{ color: PBI_PALETTE[0] }}>Revenue: {formatCurrency(d.revenue)}</div>
                      <div style={{ color: PBI_PALETTE[2] }}>Deals: {formatCompact(d.deals)}</div>
                      <div>Win Rate: {formatPercent(d.winRate)}</div>
                      <div>Avg Deal: {formatCurrency(d.avgDeal)}</div>
                    </div>
                  )
                }}
              />
              <Scatter data={industryPerformance} fill={PBI_PALETTE[0]} fillOpacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue Distribution by Industry">
          <ResponsiveContainer width="100%" height={340}>
            <PieChart>
              <Pie
                data={topIndustries}
                cx="50%"
                cy="50%"
                outerRadius={110}
                innerRadius={45}
                dataKey="revenue"
                nameKey="Industry"
                label={({ Industry, percent }) => `${Industry} ${(percent * 100).toFixed(0)}%`}
                labelLine
              >
                {topIndustries.map((_, i) => (
                  <Cell key={i} fill={PBI_PALETTE[i % PBI_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Row 4: Industry Performance Table ─────────────── */}
      <ChartCard title="Industry Performance Details">
        <div style={{ fontSize: "0.8rem", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", fontWeight: 600, color: theme.semantic.muted, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.05em" }}>Industry</th>
                <th style={{ textAlign: "right", padding: "0.5rem 0.75rem", fontWeight: 600, color: theme.semantic.muted, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.05em" }}>Revenue Won</th>
                <th style={{ textAlign: "right", padding: "0.5rem 0.75rem", fontWeight: 600, color: theme.semantic.muted, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.05em" }}>Deal Count</th>
                <th style={{ textAlign: "right", padding: "0.5rem 0.75rem", fontWeight: 600, color: theme.semantic.muted, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.05em" }}>Avg Deal</th>
                <th style={{ textAlign: "right", padding: "0.5rem 0.75rem", fontWeight: 600, color: theme.semantic.muted, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.05em" }}>Total Deals</th>
                <th style={{ textAlign: "right", padding: "0.5rem 0.75rem", fontWeight: 600, color: theme.semantic.muted, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.05em" }}>Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {industryPerformance.map((row, i) => (
                <tr
                  key={row.Industry ?? i}
                  style={{ borderBottom: "1px solid #f3f4f6", transition: "background 0.15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f9fafb" }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "" }}
                >
                  <td style={{ padding: "0.5rem 0.75rem", fontWeight: 500 }}>{row.Industry}</td>
                  <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{formatCurrency(row.revenue)}</td>
                  <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatCompact(row.deals)}</td>
                  <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatCurrency(row.avgDeal)}</td>
                  <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatCompact(row.totalDeals)}</td>
                  <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatPercent(row.winRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  )
}
