import React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { QueryEngine, type AggregateParams, type Filter } from "../data/QueryEngine"
import { useAggregation, useQueryHook } from "../hooks/useQuery"
import { formatCompact, formatCurrency, formatPercent } from "../utils/formatters"

interface ColumnDef {
  column: string
  agg?: string
  role: "row" | "value"
  format?: "number" | "currency" | "percent" | "compact"
  label?: string
}

interface DataTableVisualProps {
  table: string
  columns: ColumnDef[]
  engine: QueryEngine | null
  filters?: Filter[]
  pageSize?: number
  virtualized?: boolean
  className?: string
}

function formatCell(val: any, format?: string): string {
  if (val === null || val === undefined) return "—"
  const n = Number(val)
  if (Number.isNaN(n)) return String(val)
  switch (format) {
    case "currency": return formatCurrency(n)
    case "percent": return formatPercent(n)
    case "compact": return formatCompact(n)
    default: return String(n)
  }
}

export function DataTableVisual({
  table,
  columns,
  engine,
  filters,
  pageSize = 50,
  virtualized = true,
  className = "",
}: DataTableVisualProps) {
  const valueCols = columns.filter((c) => c.role === "value")
  const rowCols = columns.filter((c) => c.role === "row")

  // Build aggregate query if there are values to aggregate
  const hasAggregation = valueCols.some((c) => c.agg)

  if (hasAggregation) {
    const aggParams: AggregateParams = {
      table,
      groupBy: rowCols.map((c) => c.column),
      measures: valueCols.map((c) => ({
        column: c.column,
        fn: (c.agg as any) ?? "sum",
        alias: c.label ?? c.column,
      })),
      filters,
      limit: pageSize ? pageSize * 2 : undefined,
    }

    return <AggregateTable {...{ aggParams, columns, engine, rowCols, virtualized, pageSize, className }} />
  }

  // Raw data table (no aggregation)
  return <RawTable {...{ table, columns, engine, filters, rowCols, virtualized, pageSize, className }} />
}

function AggregateTable({
  aggParams, columns, engine, virtualized, pageSize, className,
}: any) {
  const { data, loading, error } = useAggregation(engine, aggParams)
  return renderTable(data, loading, error, columns, virtualized, pageSize, className)
}

function RawTable({
  table, columns, engine, filters, virtualized, pageSize, className,
}: any) {
  const sql = `SELECT * FROM "${table}"`
  const { data, loading, error } = useQueryHook({ engine, sql })
  return renderTable(data, loading, error, columns, virtualized, pageSize, className)
}

function renderTable(
  data: Record<string, any>[] | undefined,
  loading: boolean,
  error: Error | null,
  columns: ColumnDef[],
  virtualized: boolean,
  pageSize: number,
  className: string,
) {
  const parentRef = React.useRef<HTMLDivElement>(null)
  const displayData = data ?? []

  const virtualizer = useVirtualizer({
    count: displayData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 10,
  })

  if (loading) {
    return <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />
  }

  if (error || displayData.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-lg">
        {error ? "Error loading data" : "—"}
      </div>
    )
  }

  const cols = columns.map((c) => c.label ?? c.column)

  return (
    <div className={`overflow-hidden border border-gray-200 rounded-lg ${className}`}>
      <div className="overflow-auto max-h-96" ref={parentRef}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {cols.map((col) => (
                <th key={col} className="px-3 py-2 text-left font-medium text-gray-600 text-xs uppercase tracking-wider border-b">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {virtualized ? (
              <>
                {virtualizer.getVirtualItems().map((virtualRow) => (
                  <tr
                    key={virtualRow.key}
                    style={{
                      height: virtualRow.size,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="absolute w-full hover:bg-gray-50"
                  >
                    {columns.map((col, ci) => (
                      <td key={ci} className="px-3 py-1.5 border-b border-gray-100 text-gray-700 whitespace-nowrap">
                        {formatCell(displayData[virtualRow.index]?.[col.label ?? col.column], col.format)}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Spacer element to make the table fill the virtualizer height */}
                <tr style={{ height: virtualizer.getTotalSize() }} />
              </>
            ) : (
              displayData.slice(0, pageSize).map((row, ri) => (
                <tr key={ri} className="hover:bg-gray-50">
                  {columns.map((col, ci) => (
                    <td key={ci} className="px-3 py-1.5 border-b border-gray-100 text-gray-700 whitespace-nowrap">
                      {formatCell(row[col.label ?? col.column], col.format)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
