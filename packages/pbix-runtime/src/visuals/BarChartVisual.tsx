import React from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { QueryEngine, type AggregateParams } from "../data/QueryEngine"
import { useAggregation } from "../hooks/useQuery"
import { theme } from "./theme"

interface BarChartVisualProps {
  table: string
  category: { column: string; maxItems?: number }
  values: Array<{ column: string; agg: string; label?: string; color?: string }>
  engine: QueryEngine | null
  filters?: AggregateParams["filters"]
  orientation?: "vertical" | "horizontal"
  className?: string
}

const truncate = (n: number) => (s: any) => {
  const str = String(s ?? "")
  return str.length > n ? str.slice(0, n) + "…" : str
}

export function BarChartVisual({
  table,
  category,
  values,
  engine,
  filters,
  orientation = "vertical",
  className = "",
}: BarChartVisualProps) {
  const aggParams: AggregateParams = {
    table,
    groupBy: [category.column],
    measures: values.map((v) => ({
      column: v.column,
      fn: v.agg as any,
      alias: v.label ?? v.column,
    })),
    filters,
    orderBy: values.length > 0
      ? [{ column: values[0].label ?? values[0].column, dir: "desc" }]
      : undefined,
    limit: category.maxItems ?? 20,
  }

  const { data, loading, error } = useAggregation(engine, aggParams)

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

  const catCol = category.column
  const valCols = values.map((v) => v.label ?? v.column)

  const isHorizontal = orientation === "horizontal"

  return (
    <div style={{ width: '100%', height: 256 }} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={isHorizontal ? "vertical" : "horizontal"}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          {isHorizontal ? (
            <>
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey={catCol}
                tick={{ fontSize: 11 }}
                tickFormatter={truncate(20)}
                width={120}
              />
            </>
          ) : (
            <>
              <XAxis dataKey={catCol} tick={{ fontSize: 11 }} tickFormatter={truncate(15)} />
              <YAxis tick={{ fontSize: 11 }} />
            </>
          )}
          <Tooltip />
          {valCols.length > 1 && <Legend />}
          {valCols.map((col, i) => (
            <Bar
              key={col}
              dataKey={col}
              fill={values[i]?.color ?? theme.colors[i % theme.colors.length]}
              radius={[2, 2, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
