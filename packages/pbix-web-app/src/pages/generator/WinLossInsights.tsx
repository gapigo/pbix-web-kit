import { useAggregation, theme, formatCurrency, formatPercent, formatCompact } from "@pbix/runtime"
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ScatterChart, Scatter, ZAxis,
} from "recharts"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

/* ── helpers ── */

function winFilter() {
  return { table: "v_opportunities" as const, column: "Status" as const, op: "eq" as const, values: ["Won"] }
}

function sumValue(alias: string) {
  return { column: "Value" as const, fn: "sum" as const, alias }
}

function countOpps(alias: string) {
  return { column: "Value" as const, fn: "count" as const, alias }
}

/* ── custom tooltips ── */

function PercentTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" ? formatPercent(entry.value) : entry.value}
        </p>
      ))}
    </div>
  )
}

function ValueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" ? formatCurrency(entry.value) : entry.value}
        </p>
      ))}
    </div>
  )
}

function CountTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {formatCompact(entry.value)}
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
      <p className="font-semibold mb-1">{row.name}</p>
      <p>Win Rate: {formatPercent(row.winRate)}</p>
      <p>Total Value: {formatCurrency(row.totalValue)}</p>
      <p>Opps: {formatCompact(row.count)}</p>
    </div>
  )
}

/* ── merge helper ── */

function mergeWinRate(
  total: Record<string, any>[] | undefined,
  won: Record<string, any>[] | undefined,
  key: string,
) {
  const wonMap = new Map((won ?? []).map((r: any) => [r[key], r]))
  return (total ?? [])
    .map((r: any) => {
      const w = wonMap.get(r[key])
      const totalCount = r.count ?? 0
      const totalValue = r.totalValue ?? 0
      const wonCount = w?.count ?? 0
      const wonValue = w?.totalValue ?? 0
      return {
        ...r,
        wonCount,
        wonValue,
        winRate: totalCount > 0 ? wonCount / totalCount : 0,
        winRateByValue: totalValue > 0 ? wonValue / totalValue : 0,
      }
    })
    .filter((r: any) => r.count > 0)
}

/* ── main component ── */

export default function WinLossInsights({ engine, store }: Props) {
  /* ───────────────────── summary KPI hooks ───────────────────── */

  const wonAgg = useAggregation(engine, {
    table: "v_opportunities",
    measures: [sumValue("totalValue"), countOpps("count")],
    filters: [winFilter()],
  })

  const lostAgg = useAggregation(engine, {
    table: "v_opportunities",
    measures: [sumValue("totalValue"), countOpps("count")],
    filters: [{ table: "v_opportunities", column: "Status", op: "eq", values: ["Lost"] }],
  })

  const totalOpps = useAggregation(engine, {
    table: "v_opportunities",
    measures: [countOpps("count")],
  })

  /* ── pie chart: status breakdown ── */

  const statusCounts = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Status"],
    measures: [countOpps("count")],
    filters: [
      { table: "v_opportunities", column: "Status", op: "in", values: ["Won", "Lost"] },
    ],
  })

  const statusValues = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Status"],
    measures: [sumValue("totalValue")],
    filters: [
      { table: "v_opportunities", column: "Status", op: "in", values: ["Won", "Lost"] },
    ],
  })

  /* ── by dimension: total + won queries ── */

  const totalByProduct = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Product"],
    measures: [sumValue("totalValue"), countOpps("count")],
    orderBy: [{ column: "count", dir: "desc" }],
    limit: 12,
  })

  const wonByProduct = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Product"],
    measures: [sumValue("totalValue"), countOpps("count")],
    filters: [winFilter()],
    orderBy: [{ column: "count", dir: "desc" }],
    limit: 12,
  })

  const totalByIndustry = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Industry"],
    measures: [sumValue("totalValue"), countOpps("count")],
    orderBy: [{ column: "count", dir: "desc" }],
    limit: 12,
  })

  const wonByIndustry = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Industry"],
    measures: [sumValue("totalValue"), countOpps("count")],
    filters: [winFilter()],
    orderBy: [{ column: "count", dir: "desc" }],
    limit: 12,
  })

  const totalByTerritory = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Territory"],
    measures: [sumValue("totalValue"), countOpps("count")],
    orderBy: [{ column: "count", dir: "desc" }],
    limit: 10,
  })

  const wonByTerritory = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Territory"],
    measures: [sumValue("totalValue"), countOpps("count")],
    filters: [winFilter()],
    orderBy: [{ column: "count", dir: "desc" }],
    limit: 10,
  })

  /* ── scatter: win rate × deal value by product ── */

  const scatterTotal = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Product"],
    measures: [sumValue("totalValue"), countOpps("count")],
    orderBy: [{ column: "count", dir: "desc" }],
    limit: 20,
  })

  const scatterWon = useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Product"],
    measures: [sumValue("totalValue"), countOpps("count")],
    filters: [winFilter()],
    orderBy: [{ column: "count", dir: "desc" }],
    limit: 20,
  })

  /* ───────────────────── derived ───────────────────── */

  const won = wonAgg.data?.[0]
  const lost = lostAgg.data?.[0]
  const total = totalOpps.data?.[0]
  const winRate = won && total ? won.count / total.count : 0

  const totalWonValue = won?.totalValue ?? 0
  const totalLostValue = lost?.totalValue ?? 0

  const pieCountData = (statusCounts.data ?? []).map((r: any) => ({
    name: r.Status,
    value: r.count,
  }))

  const pieValueData = (statusValues.data ?? []).map((r: any) => ({
    name: r.Status,
    value: r.totalValue,
  }))

  const productData = mergeWinRate(totalByProduct.data, wonByProduct.data, "Product")
  const industryData = mergeWinRate(totalByIndustry.data, wonByIndustry.data, "Industry")
  const territoryData = mergeWinRate(totalByTerritory.data, wonByTerritory.data, "Territory")

  const scatterRows = mergeWinRate(scatterTotal.data, scatterWon.data, "Product")

  const loading =
    wonAgg.loading || lostAgg.loading || totalOpps.loading ||
    statusCounts.loading || statusValues.loading ||
    totalByProduct.loading || wonByProduct.loading ||
    totalByIndustry.loading || wonByIndustry.loading ||
    totalByTerritory.loading || wonByTerritory.loading ||
    scatterTotal.loading || scatterWon.loading

  /* ───────────────────── render ───────────────────── */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted">
        <span>Loading win/loss insights...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6" style={{ fontFamily: theme.fontFamily.sans }}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: theme.colors[1] }}>
          Win / Loss Insights
        </h1>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Win Rate" value={formatPercent(winRate)} color={theme.semantic.success} />
        <KpiCard label="Won Value" value={formatCurrency(totalWonValue)} color={theme.colors[0]} />
        <KpiCard label="Lost Value" value={formatCurrency(totalLostValue)} color={theme.semantic.danger} />
        <KpiCard label="Total Opportunities" value={formatCompact(total?.count ?? 0)} color={theme.colors[3]} />
      </div>

      {/* ── Pie charts row ── */}
      <div className="grid grid-cols-2 gap-4">
        <Card title="Opps Won / Lost (by Count)">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieCountData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {pieCountData.map((_: any, i: number) => (
                  <Cell key={i} fill={i === 0 ? theme.semantic.success : theme.semantic.danger} />
                ))}
              </Pie>
              <Tooltip content={<CountTooltip />} />
              <Legend
                verticalAlign="bottom"
                formatter={(v: string) => <span className="text-xs">{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Opps Won / Lost (by Value)">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieValueData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {pieValueData.map((_: any, i: number) => (
                  <Cell key={i} fill={i === 0 ? theme.semantic.success : theme.semantic.danger} />
                ))}
              </Pie>
              <Tooltip content={<ValueTooltip />} />
              <Legend
                verticalAlign="bottom"
                formatter={(v: string) => <span className="text-xs">{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Win rate by dimension ── */}
      <div className="grid grid-cols-2 gap-4">
        <Card title="Win Rate by Product">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productData} layout="vertical" margin={{ left: 80, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis type="number" tickFormatter={(v: number) => formatPercent(v)} domain={[0, 1]} fontSize={11} />
              <YAxis type="category" dataKey="Product" width={140} tick={{ fontSize: 11 }} />
              <Tooltip content={<PercentTooltip />} />
              <Bar dataKey="winRate" fill={theme.colors[2]} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Win Rate by Industry">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={industryData} layout="vertical" margin={{ left: 80, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis type="number" tickFormatter={(v: number) => formatPercent(v)} domain={[0, 1]} fontSize={11} />
              <YAxis type="category" dataKey="Industry" width={140} tick={{ fontSize: 11 }} />
              <Tooltip content={<PercentTooltip />} />
              <Bar dataKey="winRate" fill={theme.colors[4]} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card title="Win Rate by Territory">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={territoryData} layout="vertical" margin={{ left: 80, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis type="number" tickFormatter={(v: number) => formatPercent(v)} domain={[0, 1]} fontSize={11} />
              <YAxis type="category" dataKey="Territory" width={140} tick={{ fontSize: 11 }} />
              <Tooltip content={<PercentTooltip />} />
              <Bar dataKey="winRate" fill={theme.colors[0]} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Scatter: win rate vs total value ── */}
      <Card title="Win Rate vs Deal Value by Product">
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ left: 16, right: 16, bottom: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              type="number"
              dataKey="totalValue"
              name="Total Value"
              tickFormatter={(v: number) => formatCompact(v)}
              fontSize={11}
            />
            <YAxis
              type="number"
              dataKey="winRate"
              name="Win Rate"
              tickFormatter={(v: number) => formatPercent(v)}
              domain={[0, 1]}
              fontSize={11}
            />
            <ZAxis type="number" dataKey="count" range={[40, 400]} />
            <Tooltip content={<ScatterTooltip />} />
            <Scatter data={scatterRows} fill={theme.colors[0]}>
              {scatterRows.map((_: any, i: number) => (
                <Cell key={i} fill={theme.colors[i % theme.colors.length]} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}

/* ── sub-components ── */

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="flex flex-col gap-1 rounded-lg border p-4 shadow-sm"
      style={{ borderRadius: theme.radius.card }}
    >
      <span className="text-xs font-medium" style={{ color: theme.semantic.muted }}>{label}</span>
      <span className="text-2xl font-bold" style={{ color }}>{value}</span>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col gap-3 rounded-lg border bg-white p-4 shadow-sm"
      style={{ borderRadius: theme.radius.card }}
    >
      <h3 className="text-sm font-semibold" style={{ color: theme.semantic.muted }}>{title}</h3>
      {children}
    </div>
  )
}
