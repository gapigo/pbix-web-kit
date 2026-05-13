import {
  useAggregation,
  theme,
  formatCurrency,
  formatCompact,
  currencyTooltipFormatter,
} from "@pbix/runtime"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

/** Aggregate pipeline revenue by Sales Stage — open deals only. */
function usePipelineByStage(engine: QueryEngine | null) {
  return useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Sales Stage"],
    measures: [
      { column: "Value", fn: "sum", alias: "revenue" },
      { column: "Value", fn: "count", alias: "count" },
      { column: "Value", fn: "avg", alias: "avgDeal" },
    ],
    filters: [{ column: "Status", op: "eq", values: ["Open"] }],
    orderBy: [{ column: "Value", dir: "desc" }],
  })
}

/** Aggregate pipeline revenue over time (by CloseDate truncated to month). */
function usePipelineTrend(engine: QueryEngine | null) {
  return useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["CloseDate"],
    measures: [
      { column: "Value", fn: "sum", alias: "revenue" },
      { column: "Value", fn: "count", alias: "count" },
    ],
    filters: [{ column: "Status", op: "eq", values: ["Open"] }],
    orderBy: [{ column: "CloseDate", dir: "asc" }],
  })
}

/** Aggregate pipeline by Sales Stage. */
function usePipelineBySalesStage(engine: QueryEngine | null) {
  return useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Sales Stage"],
    measures: [
      { column: "Value", fn: "sum", alias: "revenue" },
      { column: "Value", fn: "count", alias: "count" },
    ],
    filters: [{ column: "Status", op: "eq", values: ["Open"] }],
    orderBy: [{ column: "Value", dir: "desc" }],
  })
}

/** Aggregate pipeline details for the table. */
function usePipelineDetails(engine: QueryEngine | null) {
  return useAggregation(engine, {
    table: "v_opportunities",
    groupBy: ["Sales Stage", "Owner", "Territory"],
    measures: [
      { column: "Value", fn: "sum", alias: "revenue" },
      { column: "Value", fn: "count", alias: "count" },
      { column: "Value", fn: "avg", alias: "avgDeal" },
    ],
    filters: [{ column: "Status", op: "eq", values: ["Open"] }],
    orderBy: [{ column: "Value", dir: "desc" }],
    limit: 50,
  })
}

/** Format a date string (YYYY-MM-DD) to a short month label. */
function monthLabel(dateStr: string): string {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  )
}

export default function PipelineTrends({ engine }: Props) {
  const byStage = usePipelineByStage(engine)
  const trend = usePipelineTrend(engine)
  const bySalesStage = usePipelineBySalesStage(engine)
  const details = usePipelineDetails(engine)

  const loading = byStage.loading || trend.loading || bySalesStage.loading || details.loading

  // Compute KPIs from aggregated data
  const totalPipelineRevenue =
    byStage.data?.reduce((sum, r) => sum + (Number(r.revenue) || 0), 0) ?? 0
  const totalCount =
    byStage.data?.reduce((sum, r) => sum + (Number(r.count) || 0), 0) ?? 0
  const avgDealSize = totalCount > 0 ? totalPipelineRevenue / totalCount : 0
  const weightedPipeline =
    byStage.data?.reduce((sum, r) => {
      const stageOrder = [
        "Prospecting",
        "Qualification",
        "Needs Analysis",
        "Proposal",
        "Negotiation",
        "Closed",
      ]
      const idx = stageOrder.indexOf(r["Sales Stage"] ?? "")
      const weight = idx >= 0 ? (idx + 1) / stageOrder.length : 0.5
      return sum + (Number(r.revenue) || 0) * weight
    }, 0) ?? 0

  // Prepare trend chart data — parse CloseDate as month label
  const trendData =
    trend.data?.map((r) => ({
      month: monthLabel(r.CloseDate),
      revenue: Number(r.revenue) || 0,
      count: Number(r.count) || 0,
    })) ?? []

  // Prepare stage bar data — limit to top 8 stages, group rest as "Other"
  const byStageWithPct =
    byStage.data?.map((r) => ({
      name: r["Sales Stage"] ?? "Unknown",
      revenue: Number(r.revenue) || 0,
      count: Number(r.count) || 0,
      avgDeal: Number(r.avgDeal) || 0,
    })) ?? []
  const sortedStages = byStageWithPct.sort((a, b) => b.revenue - a.revenue)
  const topStages = sortedStages.slice(0, 8)
  const otherRevenue = sortedStages.slice(8).reduce((s, r) => s + r.revenue, 0)
  const otherCount = sortedStages.slice(8).reduce((s, r) => s + r.count, 0)
  if (otherRevenue > 0) {
    topStages.push({ name: "Other", revenue: otherRevenue, count: otherCount, avgDeal: 0 })
  }

  // Prepare sales stage data
  const stageData =
    bySalesStage.data?.map((r, i) => ({
      name: r["Sales Stage"] ?? "Unknown",
      revenue: Number(r.revenue) || 0,
      fill: theme.colors[i % theme.colors.length],
    })) ?? []

  // Prepare detail rows
  const detailRows =
    details.data?.map((r, i) => ({
      id: i,
      stage: r["Sales Stage"] ?? "",
      owner: r.Owner ?? "",
      territory: r.Territory ?? "",
      revenue: Number(r.revenue) || 0,
      count: Number(r.count) || 0,
      avgDeal: Number(r.avgDeal) || 0,
    })) ?? []

  if (loading) {
    return (
      <div className="grid grid-cols-12 gap-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="col-span-3 h-28 bg-gray-200 rounded-lg" />
        ))}
        <div className="col-span-7 h-72 bg-gray-200 rounded-lg" />
        <div className="col-span-5 h-72 bg-gray-200 rounded-lg" />
        <div className="col-span-12 h-64 bg-gray-200 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Pipeline Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="text-2xl font-bold"
                style={{ color: theme.colors[0] }}
              >
                {formatCurrency(totalPipelineRevenue)}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {formatCompact(totalCount)} open opportunities
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="col-span-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Open Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="text-2xl font-bold"
                style={{ color: theme.colors[1] }}
              >
                {formatCompact(totalCount)}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {formatCurrency(avgDealSize)} avg deal size
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="col-span-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Avg Deal Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="text-2xl font-bold"
                style={{ color: theme.colors[2] }}
              >
                {formatCurrency(avgDealSize)}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                weighted pipeline {formatCurrency(weightedPipeline)}
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="col-span-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Weighted Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="text-2xl font-bold"
                style={{ color: theme.colors[3] }}
              >
                {formatCurrency(weightedPipeline)}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                stage-probability adjusted
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Trend + Stage side-by-side */}
      <div className="grid grid-cols-12 gap-4">
        {/* Pipeline Revenue Trend */}
        <div className="col-span-7">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Pipeline Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickFormatter={(v: number) => formatCompact(v)}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    width={70}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke={theme.colors[0]}
                    strokeWidth={2}
                    dot={{ r: 3, fill: theme.colors[0] }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline by Stage (Bar) */}
        <div className="col-span-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Pipeline by Stage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topStages} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tickFormatter={(v: number) => formatCompact(v)}
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    width={100}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === "revenue") return [formatCurrency(value), "Revenue"]
                      if (name === "count") return [formatCompact(value), "Count"]
                      return [value, name]
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill={theme.colors[0]}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pipeline by Sales Stage + Details side-by-side */}
      <div className="grid grid-cols-12 gap-4">
        {/* Sales Stage Horizontal Bar */}
        <div className="col-span-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Pipeline by Sales Stage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stageData} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tickFormatter={(v: number) => formatCompact(v)}
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    width={110}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]}>
                    {stageData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Stage Details Table */}
        <div className="col-span-7">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Pipeline Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wider">
                        Stage
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wider">
                        Owner
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wider">
                        Territory
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wider">
                        Deals
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wider">
                        Avg Deal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-8 text-gray-400"
                        >
                          No data available
                        </td>
                      </tr>
                    )}
                    {detailRows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-2.5 text-gray-900">
                          {row.stage || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">
                          {row.owner || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">
                          {row.territory || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium">
                          {formatCurrency(row.revenue)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-600">
                          {formatCompact(row.count)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-600">
                          {formatCurrency(row.avgDeal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
