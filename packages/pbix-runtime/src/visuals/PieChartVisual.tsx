import React from "react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { QueryEngine, type AggregateParams } from "../data/QueryEngine"
import { useAggregation } from "../hooks/useQuery"
import { theme } from "./theme"

interface PieChartVisualProps {
  table: string
  category: { column: string }
  value: { column: string; agg: string; label?: string }
  engine: QueryEngine | null
  filters?: AggregateParams["filters"]
  maxSlices?: number
  className?: string
}

export function PieChartVisual({
  table,
  category,
  value,
  engine,
  filters,
  maxSlices = 10,
  className = "",
}: PieChartVisualProps) {
  const { data, loading, error } = useAggregation(engine, {
    table,
    groupBy: [category.column],
    measures: [{ column: value.column, fn: value.agg as any, alias: value.label ?? value.column }],
    filters,
    orderBy: [{ column: value.label ?? value.column, dir: "desc" }],
    limit: maxSlices,
  })

  if (loading) {
    return <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
  }

  if (error || !data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-lg">
        {error ? "Error loading data" : "—"}
      </div>
    )
  }

  const valKey = value.label ?? value.column
  const catKey = category.column

  return (
    <div style={{ width: '100%', height: 256 }} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey={valKey}
            nameKey={catKey}
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={30}
            label={({ name, percent }) =>
              `${name} (${(percent * 100).toFixed(1)}%)`
            }
          >
            {data.map((_, i) => (
              <Cell key={i} fill={theme.colors[i % theme.colors.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
