import { useState, useMemo } from "react"
import type { Visual } from "./types"
import { evaluateField, buildMeasureMap } from "@/lib/measureEvaluator"
import { getTable, resolveColumn } from "@/lib/tableLookup"
import irData from "@/data/ir.json"
import { useFilteredData } from "@/components/layout/FilterContext"

interface DataTableVisualProps {
  visual: Visual
  data: Record<string, any[]>
}

export function DataTableVisual({ visual, data }: DataTableVisualProps) {
  const rowFields = visual.fields.filter(f => f.role === "Rows")
  const valueFields = visual.fields.filter(f => f.role === "Values")

  // Find data table with tolerant lookup
  const allTables = [...new Set(visual.fields.map(f => f.table))]
  const firstTable = allTables[0]
  const tableData = getTable(data, firstTable)
  const filteredData = useFilteredData(tableData)

  if (!tableData || tableData.length === 0) {
    return <div className="text-muted-foreground text-xs p-4">No data available</div>
  }

  // Build columns from fields
  const displayCols = [...rowFields.map(f => f.column), ...valueFields.map(f => f.column)]

  // Build measure map for evaluation
  const measureMap = useMemo(() => buildMeasureMap((irData as any).measures || []), [])

  // Aggregate values group by row fields (or list rows if no grouping)
  const aggregated = useMemo(() => {
    // CASE A: No rowFields = list, not aggregation. Show each row individually.
    if (rowFields.length === 0) {
      return filteredData.slice(0, 200).map(row => {
        const result: Record<string, any> = {}
        for (const vf of valueFields) {
          const realCol = resolveColumn(row, vf.column)
          const raw = realCol ? row[realCol] : undefined
          if (typeof raw === "number") {
            result[vf.column] = formatNum(raw)
          } else {
            result[vf.column] = raw == null ? "" : String(raw)
          }
        }
        return result
      })
    }

    // CASE B: Grouped aggregation
    const groups: Record<string, Record<string, number | string>> = {}
    for (const row of filteredData) {
      const key = rowFields.map(f => {
        const realCol = resolveColumn(row, f.column)
        return String(realCol ? row[realCol] ?? "" : "")
      }).join("|")
      if (!groups[key]) {
        groups[key] = {}
      }
      for (const vf of valueFields) {
        const measureKey = `${vf.table}.${vf.column}`
        const isMeasure = measureMap.has(measureKey)
        if (isMeasure) {
          if (groups[key] && groups[key][vf.column] !== undefined) continue
          // Build row context filter from row fields
          const rowFilters: Record<string, string[]> = {}
          for (const rf of rowFields) {
            const realCol = resolveColumn(row, rf.column)
            const val = String(realCol ? row[realCol] ?? "" : "")
            if (val) rowFilters[rf.column] = [val]
          }
          const evalVal = evaluateField(vf, data, rowFilters, measureMap)
          if (evalVal !== null) {
            groups[key][vf.column] = evalVal
          } else {
            // Fallback: sum raw column with tolerant lookup
            const realCol = resolveColumn(row, vf.column)
            const val = realCol ? Number(row[realCol] ?? 0) : 0
            groups[key][vf.column] = ((groups[key][vf.column] as number) ?? 0) + (Number.isFinite(val) ? val : 0)
          }
        } else {
          // Raw column. Decide by data type, not by column name.
          const realCol = resolveColumn(row, vf.column)
          const raw = realCol ? row[realCol] : undefined
          if (typeof raw === "number" && Number.isFinite(raw)) {
            // Numeric: sum
            groups[key][vf.column] = ((groups[key][vf.column] as number) ?? 0) + raw
          } else if (typeof raw === "string" && raw.trim() !== "" && !Number.isFinite(Number(raw))) {
            // Pure text: keep first value
            if (groups[key][vf.column] === undefined) {
              groups[key][vf.column] = raw
            }
          } else {
            // Numeric-as-string or other: try to sum
            const asNum = Number(raw)
            if (Number.isFinite(asNum)) {
              groups[key][vf.column] = ((groups[key][vf.column] as number) ?? 0) + asNum
            } else if (groups[key][vf.column] === undefined) {
              groups[key][vf.column] = raw == null ? "" : String(raw)
            }
          }
        }
      }
    }
    return Object.entries(groups).map(([key, vals]) => {
      const parts = key.split("|")
      const result: Record<string, any> = {}
      rowFields.forEach((f, i) => { result[f.column] = parts[i] || "" })
      Object.entries(vals).forEach(([col, val]) => {
        result[col] = typeof val === "number" ? formatNum(val) : String(val ?? "")
      })
      return result
    })
  }, [filteredData, rowFields, valueFields, data, measureMap])

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
