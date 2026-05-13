import React from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { QueryEngine, type AggregateParams } from "../data/QueryEngine"
import { useAggregation } from "../hooks/useQuery"
import { theme } from "./theme"

interface LineChartVisualProps {
  table: string
  category: { column: string }
  values: Array<{ column: string; agg: string; label?: string; color?: string }>
  engine: QueryEngine | null
  filters?: AggregateParams["filters"]
  className?: string
}

export function LineChartVisual({
  table,
  category,
  values,
  engine,
  filters,
  className = "",
}: LineChartVisualProps) {
  const { data, loading, error } = useAggregation(engine, {
    table,
    groupBy: [category.column],
    measures: values.map((v) => ({
      column: v.column,
      fn: v.agg as any,
      alias: v.label ?? v.column,
    })),
    filters,
    orderBy: [{ column: category.column, dir: "asc" }],
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

  const valCols = values.map((v) => v.label ?? v.column)

  return (
    <div className={`h-64 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={category.column} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          {valCols.length > 1 && <Legend />}
          {valCols.map((col, i) => (
            <Line
              key={col}
              type="monotone"
              dataKey={col}
              stroke={values[i]?.color ?? theme.colors[i % theme.colors.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
