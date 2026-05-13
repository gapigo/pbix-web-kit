import React from "react"
import { Treemap, ResponsiveContainer, Tooltip } from "recharts"
import { QueryEngine, type AggregateParams } from "../data/QueryEngine"
import { useAggregation } from "../hooks/useQuery"
import { theme } from "./theme"

interface TreemapVisualProps {
  table: string
  category: { column: string }
  value: { column: string; agg: string; label?: string }
  engine: QueryEngine | null
  filters?: AggregateParams["filters"]
  className?: string
}

const CustomizedContent = (props: any) => {
  const { root, depth, x, y, width, height, index, name, value } = props
  const fontSize = Math.min(width / (name?.length || 1) * 2, 14)

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={theme.colors[index % theme.colors.length]}
        stroke="#fff"
        strokeWidth={2}
        fillOpacity={depth === 1 ? 0.85 : 0.7}
      />
      {width > 30 && height > 20 && (
        <>
          <text x={x + width / 2} y={y + height / 2 - 5} textAnchor="middle" fill="#fff" fontSize={fontSize}>
            {name}
          </text>
          <text x={x + width / 2} y={y + height / 2 + 12} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize={10}>
            {value?.toLocaleString()}
          </text>
        </>
      )}
    </g>
  )
}

export function TreemapVisual({
  table, category, value, engine, filters, className = "",
}: TreemapVisualProps) {
  const valKey = value.label ?? value.column
  const { data, loading, error } = useAggregation(engine, {
    table,
    groupBy: [category.column],
    measures: [{ column: value.column, fn: value.agg as any, alias: valKey }],
    filters,
    orderBy: [{ column: valKey, dir: "desc" }],
    limit: 30,
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
        <Treemap
          data={data}
          dataKey={valKey}
          nameKey={category.column}
          stroke="#fff"
          fill={theme.colors[0]}
          content={<CustomizedContent />}
        >
          <Tooltip />
        </Treemap>
      </ResponsiveContainer>
    </div>
  )
}
