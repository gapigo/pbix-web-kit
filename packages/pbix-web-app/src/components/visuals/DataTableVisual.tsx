import { useState, useMemo } from "react"
import type { Visual } from "./types"

interface DataTableVisualProps {
  visual: Visual
  data: Record<string, any[]>
}

export function DataTableVisual({ visual, data }: DataTableVisualProps) {
  const rowFields = visual.fields.filter(f => f.role === "Rows")
  const valueFields = visual.fields.filter(f => f.role === "Values")

  // Try to find data table
  const allTables = [...new Set(visual.fields.map(f => f.table))]
  const firstTable = allTables[0]
  const tableData = data[firstTable]

  if (!tableData || tableData.length === 0) {
    return <div className="text-muted-foreground text-xs p-4">No data available</div>
  }

  // Build columns from fields
  const displayCols = [...rowFields.map(f => f.column), ...valueFields.map(f => f.column)]

  // Aggregate values group by row fields
  const aggregated = useMemo(() => {
    const groups: Record<string, Record<string, number>> = {}
    for (const row of tableData) {
      const key = rowFields.map(f => String(row[f.column] ?? "")).join("|")
      if (!groups[key]) {
        groups[key] = {}
      }
      for (const vf of valueFields) {
        const val = Number(row[vf.column] ?? 0)
        groups[key][vf.column] = (groups[key][vf.column] ?? 0) + val
      }
    }
    return Object.entries(groups).map(([key, vals]) => {
      const parts = key.split("|")
      const result: Record<string, any> = {}
      rowFields.forEach((f, i) => { result[f.column] = parts[i] || "" })
      Object.entries(vals).forEach(([col, val]) => { result[col] = formatNum(val) })
      return result
    })
  }, [tableData, rowFields, valueFields])

  const [sortCol, setSortCol] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const sorted = useMemo(() => {
    if (!sortCol) return aggregated
    return [...aggregated].sort((a, b) => {
      const va = a[sortCol]
      const vb = b[sortCol]
      if (typeof va === "number" && typeof vb === "number") {
        return sortDir === "asc" ? va - vb : vb - va
      }
      return sortDir === "asc"
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va))
    })
  }, [aggregated, sortCol, sortDir])

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(d => d === "asc" ? "desc" : "asc")
    } else {
      setSortCol(col)
      setSortDir("asc")
    }
  }

  return (
    <div className="w-full h-full overflow-auto p-1">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b">
            {displayCols.map(col => (
              <th
                key={col}
                className="text-left p-1 font-medium cursor-pointer hover:bg-muted sticky top-0 bg-background"
                onClick={() => handleSort(col)}
              >
                {col}
                {sortCol === col && (sortDir === "asc" ? " ▲" : " ▼")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.slice(0, 100).map((row, i) => (
            <tr key={i} className="border-b hover:bg-muted/50">
              {displayCols.map(col => (
                <td key={col} className="p-1 whitespace-nowrap">
                  {row[col] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatNum(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 })
}
