import React from "react"
import { Filter, QueryEngine } from "../data/QueryEngine"
import { useDistinctValues } from "../hooks/useQuery"
import { Card, CardContent } from "../components/ui/card"

interface SlicerVisualProps {
  table: string
  column: string
  label: string
  engine: QueryEngine | null
  filters?: Filter[]
  mode?: "single" | "multi"
  value?: string[]
  onChange?: (values: string[]) => void
  className?: string
}

export function SlicerVisual({
  table,
  column,
  label,
  engine,
  filters,
  mode = "multi",
  value = [],
  onChange,
  className = "",
}: SlicerVisualProps) {
  const { data: distinctValues, loading, error } = useDistinctValues(
    engine,
    table,
    column,
    filters
  )

  const toggleValue = (val: string) => {
    if (!onChange) return
    if (mode === "single") {
      onChange(value.includes(val) ? [] : [val])
      return
    }
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val))
    } else {
      onChange([...value, val])
    }
  }

  if (loading) {
    return (
      <div className="h-32 bg-gray-100 animate-pulse rounded-lg" />
    )
  }

  if (error || !distinctValues || distinctValues.length === 0) {
    return (
      <div className="h-16 flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-lg">
        {error ? "Error" : "—"}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-3">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          {label}
        </div>
        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
          {distinctValues.map((val) => {
            const isActive = value.includes(val)
            return (
              <button
                key={val}
                onClick={() => toggleValue(val)}
                className={`
                  px-2 py-0.5 text-xs rounded-full border transition-colors
                  ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                  }
                `}
              >
                {val}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
