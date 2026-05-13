import React from "react"
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { QueryEngine, type AggregateParams } from "../data/QueryEngine"
import { useAggregation } from "../hooks/useQuery"
import { theme } from "./theme"

interface ComboChartVisualProps {
  table: string
  category: { column: string }
  bars: Array<{ column: string; agg: string; label?: string; color?: string }>
  lines: Array<{ column: string; agg: string; label?: string; color?: string }>
  engine: QueryEngine | null
  filters?: AggregateParams["filters"]
  className?: string
}

export function ComboChartVisual({
  table, category, bars, lines, engine, filters, className = "",
}: ComboChartVisualProps) {
  const allMeasures = [
    ...bars.map((b) => ({ column: b.column, fn: b.agg as any, alias: b.label ?? b.column })),
    ...lines.map((l) => ({ column: l.column, fn: l.agg as any, alias: l.label ?? l.column })),
  ]

  const { data, loading, error } = useAggregation(engine, {
    table,
    groupBy: [category.column],
    measures: allMeasures,
    filters,
  })

  if (loading) return <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
  if (error || !data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-lg">
        {error ? "Error" : "—"}
      </div>
    )
  }

  return (
    <div className={`h-64 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={category.column} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          {bars.map((b, i) => (
            <Bar
              key={b.label ?? b.column}
              dataKey={b.label ?? b.column}
              fill={b.color ?? theme.colors[i % theme.colors.length]}
              radius={[2, 2, 0, 0]}
            />
          ))}
          {lines.map((l, i) => (
            <Line
              key={l.label ?? l.column}
              type="monotone"
              dataKey={l.label ?? l.column}
              stroke={l.color ?? theme.colors[(bars.length + i) % theme.colors.length]}
              strokeWidth={2}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
