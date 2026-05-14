import React from "react"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { QueryEngine, type AggregateParams } from "../data/QueryEngine"
import { useAggregation } from "../hooks/useQuery"
import { formatCompact } from "../utils/formatters"
import { theme } from "./theme"

interface GaugeVisualProps {
  table: string
  measure: { column: string; agg: string; label?: string }
  target?: number
  engine: QueryEngine | null
  filters?: AggregateParams["filters"]
  className?: string
}

export function GaugeVisual({
  table, measure, target = 100, engine, filters, className = "",
}: GaugeVisualProps) {
  const { data, loading, error } = useAggregation(engine, {
    table,
    measures: [{ column: measure.column, fn: measure.agg as any, alias: "val" }],
    filters,
  })

  const value = data?.[0]?.val as number | undefined
  const percentage = value !== undefined ? Math.min(value / target, 1) : 0
  const angle = percentage * 180
  const gaugeData = [
    { name: "Value", value: angle === 0 ? 0.1 : angle },
    { name: "Remaining", value: 180 - angle },
  ]

  if (loading) return <div className="h-40 bg-gray-100 animate-pulse rounded-lg" />
  if (error || value === undefined) {
    return (
      <div className="h-40 flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-lg">
        {error ? "Error" : "—"}
      </div>
    )
  }

  return (
    <div className={`relative h-40 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={gaugeData}
            cx="50%"
            cy="80%"
            startAngle={180}
            endAngle={0}
            innerRadius={50}
            outerRadius={70}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={percentage > 0.8 ? theme.semantic.success : percentage > 0.5 ? theme.semantic.warning : theme.semantic.danger} />
            <Cell fill="#e5e7eb" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center mt-6">
        <div className="text-center">
          <div className="text-xl font-bold text-gray-800">
            {formatCompact(value)}
          </div>
          <div className="text-xs text-gray-500">
            {measure.label ?? measure.column}
          </div>
        </div>
      </div>
    </div>
  )
}
