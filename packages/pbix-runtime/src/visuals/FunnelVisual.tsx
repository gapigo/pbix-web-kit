import React from "react"
import { FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer } from "recharts"
import { QueryEngine, type AggregateParams } from "../data/QueryEngine"
import { useAggregation } from "../hooks/useQuery"
import { theme } from "./theme"

interface FunnelVisualProps {
  table: string
  category: { column: string }
  value: { column: string; agg: string; label?: string }
  engine: QueryEngine | null
  filters?: AggregateParams["filters"]
  className?: string
}

export function FunnelVisual({
  table, category, value, engine, filters, className = "",
}: FunnelVisualProps) {
  const valKey = value.label ?? value.column
  const { data, loading, error } = useAggregation(engine, {
    table,
    groupBy: [category.column],
    measures: [{ column: value.column, fn: value.agg as any, alias: valKey }],
    filters,
    orderBy: [{ column: valKey, dir: "desc" }],
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
    <div style={{ width: '100%', height: 256 }} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <FunnelChart>
          <Tooltip />
          <Funnel
            dataKey={valKey}
            data={data}
            nameKey={category.column}
            isAnimationActive={false}
          >
            {data.map((_, i) => (
              <rect key={i} fill={theme.colors[i % theme.colors.length]} stroke="none" />
            ))}
            <LabelList
              dataKey={category.column}
              position="right"
              fill="#374151"
              fontSize={11}
            />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </div>
  )
}
