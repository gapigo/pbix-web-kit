import { useAggregation, theme, formatCurrency, formatPercent, formatCompact, PBI_PALETTE } from "@pbix/runtime"
import { GaugeVisual } from "@pbix/runtime"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
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

// ── Custom percent tooltip ───────────────────────────────
function PercentTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
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
          {entry.name}: {typeof entry.value === "number" ? formatPercent(entry.value / 100) : entry.value}
        </div>
      ))}
    </div>
  )
}

// ── Detail row component ─────────────────────────────────
function DetailRow({ label, discountPct, frequency }: { label: string; discountPct: number; frequency: number }) {
  return (
    <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
      <td style={{ padding: "0.375rem 0.5rem" }}>{label}</td>
      <td style={{ padding: "0.375rem 0.5rem", textAlign: "right", fontWeight: 500 }}>
        {formatPercent(discountPct)}
      </td>
      <td style={{ padding: "0.375rem 0.5rem", textAlign: "right" }}>
        {formatCompact(frequency)}
      </td>
    </tr>
  )
}

// ── Main page ────────────────────────────────────────────
export default function SalesDiscountingInsights({ engine }: Props) {
  // ── KPI queries ──────────────────────────────────────
  const avgDiscount = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Discount", fn: "avg", alias: "avgDiscount" }],
  })
  const totalDiscounted = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Value", fn: "count", alias: "count" }],
    filters: [{ column: "Discount", op: "gt", values: [0] }],
  })
  const totalValue = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Value", fn: "sum", alias: "value" }],
  })
  const discountedValue = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Value", fn: "sum", alias: "value" }],
    filters: [{ column: "Discount", op: "gt", values: [0] }],
  })
  const totalDeals = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Value", fn: "count", alias: "count" }],
  })
  const zeroDiscount = useAggregation(engine, {
    table: "v_opportunities",
    measures: [{ column: "Value", fn: "count", alias: "count" }],
    filters: [{ column: "Discount", op: "eq", values: [0] }],
  })

  // ── Chart queries ────────────────────────────────────
  const discountByProduct = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Product"],
    measures: [
      { column: "Discount", fn: "avg", alias: "avgDiscount" },
      { column: "Value", fn: "count", alias: "deals" },
    ],
    orderBy: [{ column: "avgDiscount", dir: "desc" }],
    limit: 10,
  })

  const discountByTerritory = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Territory"],
    measures: [
      { column: "Discount", fn: "avg", alias: "avgDiscount" },
      { column: "Value", fn: "count", alias: "deals" },
    ],
    orderBy: [{ column: "avgDiscount", dir: "desc" }],
  })

  const discountBrackets = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Sales Stage"],
    measures: [
      { column: "Discount", fn: "avg", alias: "avgDiscount" },
      { column: "Value", fn: "count", alias: "deals" },
    ],
    orderBy: [{ column: "avgDiscount", dir: "desc" }],
  })

  const detailData = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Product", "Territory"],
    measures: [
      { column: "Discount", fn: "avg", alias: "avgDiscount" },
      { column: "Value", fn: "count", alias: "deals" },
      { column: "Value", fn: "sum", alias: "totalValue" },
    ],
    orderBy: [{ column: "avgDiscount", dir: "desc" }],
    limit: 50,
  })

  // ── Derived KPIs ─────────────────────────────────────
  const avgDiscPct = (avgDiscount.data?.[0]?.avgDiscount ?? 0) / 100
  const discCount = totalDiscounted.data?.[0]?.count ?? 0
  const totalVal = totalValue.data?.[0]?.value ?? 0
  const discVal = discountedValue.data?.[0]?.value ?? 0
  const totalDealCount = totalDeals.data?.[0]?.count ?? 0
  const zeroCount = zeroDiscount.data?.[0]?.count ?? 0
  const discRate = totalDealCount > 0 ? (discCount / totalDealCount) * 100 : 0
  const discValuePct = totalVal > 0 ? ((discVal / totalVal) * 100).toFixed(1) : "0.0"

  // ── Loading state ────────────────────────────────────
  const kpiLoading = avgDiscount.loading || totalDiscounted.loading || totalValue.loading || totalDeals.loading

  // ── Format chart data: discount as decimal → percent ──
  const productChart =
    discountByProduct.data?.map((d) => ({
      ...d,
      avgDiscountPct: (d.avgDiscount ?? 0) / 100,
    })) ?? []

  const territoryChart =
    discountByTerritory.data?.map((d) => ({
      ...d,
      avgDiscountPct: (d.avgDiscount ?? 0) / 100,
    })) ?? []

  const pipelineChart =
    discountBrackets.data?.map((d) => ({
      ...d,
      stage: d["Sales Stage"],
      avgDiscountPct: (d.avgDiscount ?? 0) / 100,
    })) ?? []

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
          label="Avg Discount"
          value={formatPercent(avgDiscPct)}
          subtitle={`across ${formatCompact(totalDealCount)} deals`}
          color={PBI_PALETTE[0]}
          loading={kpiLoading}
        />
        <KpiCard
          label="Deals with Discount"
          value={formatCompact(discCount)}
          subtitle={`${discRate.toFixed(1)}% of all deals`}
          color={PBI_PALETTE[1]}
          loading={kpiLoading}
        />
        <KpiCard
          label="Discounted Value"
          value={formatCurrency(discVal)}
          subtitle={`${discValuePct}% of total value`}
          color={PBI_PALETTE[2]}
          loading={kpiLoading}
        />
        <KpiCard
          label="Full-Price Deals"
          value={formatCompact(zeroCount)}
          subtitle="no discount applied"
          color={theme.semantic.muted}
          loading={zeroDiscount.loading}
        />
      </div>

      {/* ── Row 2: Avg Discount Gauge + Pipeline Step ──────── */}
      <div style={sectionStyle}>
        <ChartCard title="Overall Discount Gauge">
          <GaugeVisual
            table="v_opportunities"
            measure="Discount"
            target={30}
            engine={engine}
            className=""
          />
        </ChartCard>

        <ChartCard title="Discount by Pipeline Step">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={pipelineChart}
              layout="vertical"
              margin={{ left: 20, right: 20, top: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                fontSize={11}
              />
              <YAxis type="category" dataKey="stage" width={120} fontSize={11} />
              <Tooltip content={<PercentTooltip />} />
              <Bar dataKey="avgDiscountPct" fill={PBI_PALETTE[3]} radius={[0, 4, 4, 0]} name="Avg Discount" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Row 3: Discount by Product + Discount by Territory ── */}
      <div style={sectionStyle}>
        <ChartCard title="Avg Discount by Product (Top 10)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={productChart}
              layout="vertical"
              margin={{ left: 20, right: 20, top: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                fontSize={11}
              />
              <YAxis type="category" dataKey="Product" width={100} fontSize={11} />
              <Tooltip content={<PercentTooltip />} />
              <Bar dataKey="avgDiscountPct" fill={PBI_PALETTE[0]} radius={[0, 4, 4, 0]} name="Avg Discount" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Avg Discount by Territory">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={territoryChart}
              layout="vertical"
              margin={{ left: 20, right: 20, top: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                fontSize={11}
              />
              <YAxis type="category" dataKey="Territory" width={100} fontSize={11} />
              <Tooltip content={<PercentTooltip />} />
              <Bar dataKey="avgDiscountPct" fill={PBI_PALETTE[4]} radius={[0, 4, 4, 0]} name="Avg Discount" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Row 4: Detail Table ────────────────────────────── */}
      <div style={{ ...sectionStyle, gridTemplateColumns: "1fr" }}>
        <ChartCard title="Discount Detail by Product & Territory">
          <div style={{ fontSize: "0.8rem", maxHeight: "400px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb", position: "sticky", top: 0, background: "#fff" }}>
                  <th style={{ textAlign: "left", padding: "0.375rem 0.5rem", fontWeight: 600, color: theme.semantic.muted }}>Product</th>
                  <th style={{ textAlign: "left", padding: "0.375rem 0.5rem", fontWeight: 600, color: theme.semantic.muted }}>Territory</th>
                  <th style={{ textAlign: "right", padding: "0.375rem 0.5rem", fontWeight: 600, color: theme.semantic.muted }}>Avg Discount</th>
                  <th style={{ textAlign: "right", padding: "0.375rem 0.5rem", fontWeight: 600, color: theme.semantic.muted }}>Deals</th>
                  <th style={{ textAlign: "right", padding: "0.375rem 0.5rem", fontWeight: 600, color: theme.semantic.muted }}>Total Value</th>
                </tr>
              </thead>
              <tbody>
                {detailData.data?.map((d: any, i: number) => (
                  <tr key={`${d.Product}-${d.Territory}-${i}`} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "0.375rem 0.5rem" }}>{d.Product ?? "—"}</td>
                    <td style={{ padding: "0.375rem 0.5rem" }}>{d.Territory ?? "—"}</td>
                    <td style={{ padding: "0.375rem 0.5rem", textAlign: "right", fontWeight: 500 }}>
                      {formatPercent((d.avgDiscount ?? 0) / 100)}
                    </td>
                    <td style={{ padding: "0.375rem 0.5rem", textAlign: "right" }}>
                      {formatCompact(d.deals ?? 0)}
                    </td>
                    <td style={{ padding: "0.375rem 0.5rem", textAlign: "right" }}>
                      {formatCurrency(d.totalValue ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
