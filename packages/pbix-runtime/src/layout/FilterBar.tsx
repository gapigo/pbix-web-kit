import React from "react"
import { X } from "lucide-react"
import type { DashboardStore } from "../state/createDashboardStore"
import type { UseBoundStore, StoreApi } from "zustand"
import { useFilters, useClearFilters } from "../hooks/useFilter"

interface FilterBarProps {
  store: UseBoundStore<StoreApi<DashboardStore>>
}

export function FilterBar({ store }: FilterBarProps) {
  const filters = useFilters(store)
  const clearFilters = useClearFilters(store)
  const count = Object.keys(filters).length

  if (count === 0) return null

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg mb-4">
      <span className="text-sm font-medium text-blue-700">
        {count} filter{count !== 1 ? "s" : ""} active
      </span>
      <div className="flex flex-wrap gap-1">
        {Object.entries(filters).map(([key, f]) => (
          <span
            key={key}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-white border border-blue-300 rounded-full text-blue-800"
          >
            {key}
            <button
              onClick={() => {
                const storeState = store.getState()
                storeState.setFilter(key, null)
              }}
              className="ml-0.5 hover:text-blue-600"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <button
        onClick={clearFilters}
        className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium"
      >
        Clear all
      </button>
    </div>
  )
}
