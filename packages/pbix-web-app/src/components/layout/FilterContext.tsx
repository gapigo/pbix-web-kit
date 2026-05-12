import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

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
