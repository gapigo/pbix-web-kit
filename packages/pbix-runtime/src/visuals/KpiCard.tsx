import React from "react"
import { QueryEngine, type AggregateParams } from "../data/QueryEngine"
import { useAggregation } from "../hooks/useQuery"
import { formatCurrency, formatCompact, formatNumber, formatPercent } from "../utils/formatters"
import { theme } from "./theme"
import { Card, CardContent } from "../components/ui/card"

type FormatType = "number" | "currency" | "percent" | "compact"

interface KpiCardProps {
  measure: { table: string; column: string; agg: string }
  label: string
  engine: QueryEngine | null
  filters?: AggregateParams["filters"]
  format?: FormatType
  color?: string
  className?: string
}

const FORMATTERS: Record<FormatType, (n: number | null | undefined) => string> = {
  number: formatNumber,
  currency: formatCurrency,
  percent: formatPercent,
  compact: formatCompact,
}

export function KpiCard({
  measure,
  label,
  engine,
  filters,
  format = "compact",
  color = theme.colors[0],
  className = "",
}: KpiCardProps) {
  const { data, loading, error } = useAggregation(engine, {
    table: measure.table,
    measures: [{ column: measure.column, fn: measure.agg as any, alias: "val" }],
    filters,
  })

  const value = data?.[0]?.val as number | undefined
  const formatted = value !== undefined ? FORMATTERS[format](value) : "—"

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 truncate">
          {label}
        </div>
        <div className="text-2xl font-bold" style={{ color }}>
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
          ) : error ? (
            <span className="text-red-400 text-sm">Error</span>
          ) : (
            formatted
          )}
        </div>
      </CardContent>
    </Card>
  )
}
