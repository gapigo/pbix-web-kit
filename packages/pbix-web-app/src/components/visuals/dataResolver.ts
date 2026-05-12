import type { Visual } from "./types"

/** Fuzzy-match a table name from the IR to available data keys. */
function findTable(name: string, data: Record<string, any[]>): [string, any[]] | null {
  if (data[name]) return [name, data[name]]
  // Try case-insensitive
  const lower = name.toLowerCase()
  for (const key of Object.keys(data)) {
    if (key.toLowerCase() === lower) return [key, data[key]]
    // Partial match: "Opportunity Forecast Adjustment" vs "Opportunity_Forecast_Adjustment"
    if (lower.includes(key.toLowerCase().replace(/_/g, " ").replace(/-/g, " ")) ||
        key.toLowerCase().replace(/_/g, " ").replace(/-/g, " ").includes(lower)) {
      return [key, data[key]]
    }
  }
  return null
}

/** Find a column in a data row with fuzzy matching. */
function findColumn(colName: string, sampleRow: any): string | null {
  if (colName in sampleRow) return colName
  const lower = colName.toLowerCase()
  for (const key of Object.keys(sampleRow)) {
    if (key.toLowerCase() === lower) return key
    if (lower.replace(/[^a-z0-9]/g, "") === key.toLowerCase().replace(/[^a-z0-9]/g, "")) return key
  }
  return null
}

/**
 * Resolve data references for a visual.
 * 
 * The visual's fields reference measure/column names from the DAX model.
 * These may not match the raw data columns exactly. This function
 * resolves the best available columns from the loaded JSON data.
 */
export function resolveData(
  visual: Visual,
  data: Record<string, any[]>,
  _vizType: "bar" | "line" | "pie" | "table"
): {
  tableData: any[] | null
  categoryCol: string | null
  valueCols: string[] | null
  empty: boolean
} {
  const categoryFields = visual.fields.filter(f => f.role === "Category")
  const valueFields = visual.fields.filter(f => f.role === "Y" || f.role === "Values")

  // Try each referenced table with fuzzy matching
  const usedTables = [...new Set(visual.fields.map(f => f.table))]
  let tableData: any[] | null = null

  for (const t of usedTables) {
    const found = findTable(t, data)
    if (found) { tableData = found[1]; break }
  }

  if (!tableData || tableData.length === 0) {
    return { tableData: null, categoryCol: null, valueCols: null, empty: true }
  }

  // Resolve category column
  let categoryCol: string | null = null
  if (categoryFields.length > 0) {
    // Try last category field first (most specific)
    const lastCat = categoryFields[categoryFields.length - 1].column
    categoryCol = findColumn(lastCat, tableData[0])
    if (!categoryCol) {
      for (const cf of categoryFields) {
        categoryCol = findColumn(cf.column, tableData[0])
        if (categoryCol) break
      }
    }
  }

  // Fallback: first string column
  if (!categoryCol) {
    for (const [key, val] of Object.entries(tableData[0])) {
      if (typeof val === "string") { categoryCol = key; break }
    }
  }

  // Resolve value columns
  let valueCols: string[] | null = null
  if (valueFields.length > 0) {
    valueCols = valueFields
      .map(f => findColumn(f.column, tableData![0]))
      .filter((c): c is string => c !== null)
  }

  // Fallback: first numeric column
  if (!valueCols || valueCols.length === 0) {
    for (const [key, val] of Object.entries(tableData[0])) {
      if (typeof val === "number" && key !== categoryCol) {
        valueCols = [key]
        break
      }
    }
  }

  // Fallback to FIRST column if all else fails
  if (!valueCols || valueCols.length === 0) {
    const keys = Object.keys(tableData[0])
    valueCols = [keys[0]]
  }

  return {
    tableData,
    categoryCol,
    valueCols,
    empty: !categoryCol || !valueCols || valueCols.length === 0,
  }
}
