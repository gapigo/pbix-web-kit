import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { resolveColumn } from "@/lib/tableLookup"

interface FilterContextValue {
  filters: Record<string, string[]>
  setFilter: (field: string, values: string[]) => void
  clearFilters: () => void
  isFiltered: (field: string, value: string) => boolean
}

const FilterContext = createContext<FilterContextValue | null>(null)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Record<string, string[]>>({})

  const setFilter = useCallback((field: string, values: string[]) => {
    setFilters(prev => {
      if (values.length === 0) {
        const { [field]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [field]: values }
    })
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  const isFiltered = useCallback((field: string, value: string) => {
    const vals = filters[field]
    if (!vals || vals.length === 0) return true
    return vals.includes(value)
  }, [filters])

  return (
    <FilterContext.Provider value={{ filters, setFilter, clearFilters, isFiltered }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error("useFilters must be used within FilterProvider")
  return ctx
}

/**
 * Hook that applies global filters to a table's data.
 * Filters are stored as { "Table.Column": string[] } in the context.
 * The hook resolves them against the actual data columns with tolerant lookup.
 */
export function useFilteredData(tableData: any[] | null | undefined): any[] {
  const { filters } = useFilters()
  if (!tableData || tableData.length === 0 || Object.keys(filters).length === 0) {
    return tableData || []
  }

  const activeFilters: Array<{ col: string; values: string[] }> = []
  for (const [key, vals] of Object.entries(filters)) {
    if (!vals || vals.length === 0) continue
    const dotIdx = key.lastIndexOf(".")
    const col = dotIdx >= 0 ? key.slice(dotIdx + 1) : key
    activeFilters.push({ col, values: vals })
  }

  if (activeFilters.length === 0) return tableData

  return tableData.filter(row => {
    return activeFilters.every(({ col, values }) => {
      const realCol = resolveColumn(row, col)
      if (!realCol) return true // Column not in this table = passthrough
      return values.includes(String(row[realCol] ?? ""))
    })
  })
}
