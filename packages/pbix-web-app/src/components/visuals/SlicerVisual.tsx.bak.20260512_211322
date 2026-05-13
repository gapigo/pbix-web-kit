import { useState, useMemo } from "react"
import type { Visual } from "./types"

interface SlicerVisualProps {
  visual: Visual
  data: Record<string, any[]>
  onFilter?: (field: string, values: string[]) => void
  activeFilters?: Record<string, string[]>
}

export function SlicerVisual({ visual, data, onFilter, activeFilters }: SlicerVisualProps) {
  const valuesField = visual.fields.find(f => f.role === "Values")
  if (!valuesField) return <div className="text-muted-foreground text-xs p-4">No field</div>

  const tableData = data[valuesField.table]
  if (!tableData || tableData.length === 0) {
    return <div className="text-muted-foreground text-xs p-4">No data</div>
  }

  // Try to find the column — fallback to first string column
  let col = valuesField.column
  if (!(col in tableData[0])) {
    // Try other columns in the table
    for (const [k, v] of Object.entries(tableData[0])) {
      if (typeof v === "string") { col = k; break }
    }
  }

  if (!(col in tableData[0])) {
    return <div className="text-muted-foreground text-xs p-4">No data</div>
  }

  // Get unique values
  const uniqueValues = useMemo(() => {
    const vals = new Set<string>()
    for (const row of tableData) {
      const v = row[col]
      if (v != null && v !== "") vals.add(String(v))
    }
    return Array.from(vals).sort()
  }, [tableData, col])

  const fieldKey = `${valuesField.table}.${valuesField.column}`
  const selected = activeFilters?.[fieldKey] || []
  const [search, setSearch] = useState("")

  const filtered = uniqueValues.filter(v =>
    v.toLowerCase().includes(search.toLowerCase())
  )

  const toggleValue = (val: string) => {
    const newVals = selected.includes(val)
      ? selected.filter(v => v !== val)
      : [...selected, val]
    onFilter?.(fieldKey, newVals)
  }

  return (
    <div className="w-full h-full flex flex-col p-1 overflow-hidden">
      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="text-xs border rounded px-2 py-1 mb-1"
      />
      <div className="flex-1 overflow-y-auto">
        {filtered.slice(0, 100).map(val => (
          <label key={val} className="flex items-center gap-1 text-xs py-0.5 cursor-pointer hover:bg-muted rounded px-1">
            <input
              type="checkbox"
              checked={selected.includes(val)}
              onChange={() => toggleValue(val)}
              className="size-3"
            />
            <span className="truncate">{val}</span>
          </label>
        ))}
        {filtered.length > 100 && (
          <div className="text-xs text-muted-foreground px-1">+{filtered.length - 100} more</div>
        )}
      </div>
    </div>
  )
}
