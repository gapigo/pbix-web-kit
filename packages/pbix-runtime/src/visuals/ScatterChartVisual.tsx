import React from "react"
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ZAxis,
} from "recharts"
import { QueryEngine, type AggregateParams } from "../data/QueryEngine"
import { useAggregation } from "../hooks/useQuery"
import { theme } from "./theme"

interface ScatterChartVisualProps {
  table: string
  x: { column: string; agg: string; label?: string }
  y: { column: string; agg: string; label?: string }
  category?: { column: string }
  engine: QueryEngine | null
  filters?: AggregateParams["filters"]
  className?: string
}

export function ScatterChartVisual({
  table, x, y, category, engine, filters, className = "",
}: ScatterChartVisualProps) {
  const groupBy: string[] = category ? [category.column] : []
  const { data, loading, error } = useAggregation(engine, {
    table,
    groupBy,
    measures: [
      { column: x.column, fn: x.agg as any, alias: x.label ?? x.column },
      { column: y.column, fn: y.agg as any, alias: y.label ?? y.column },
    ],
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

  const xKey = x.label ?? x.column
  const yKey = y.label ?? y.column

  return (
    <div style={{ width: '100%', height: 256 }} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={xKey} name={xKey} tick={{ fontSize: 11 }} />
          <YAxis dataKey={yKey} name={yKey} tick={{ fontSize: 11 }} />
          <ZAxis range={[60, 60]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Legend />
          <Scatter
            data={data}
            fill={theme.colors[0]}
            opacity={0.7}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
