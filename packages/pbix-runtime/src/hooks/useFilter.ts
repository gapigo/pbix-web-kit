import { useCallback } from "react"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "../state/createDashboardStore"
import type { Filter } from "../data/QueryEngine"

/**
 * Hook: get/set/clear a single filter by key ("Table.Column").
 */
export function useFilter(
  store: UseBoundStore<StoreApi<DashboardStore>>,
  key: string
): [Filter | undefined, (filter: Filter | null) => void, () => void] {
  const filter = store((s) => s.filters[key])
  const setFilter = useCallback(
    (f: Filter | null) => store.getState().setFilter(key, f),
    [store, key]
  )
  const clearFilter = useCallback(
    () => store.getState().setFilter(key, null),
    [store, key]
  )
  return [filter, setFilter, clearFilter]
}

/**
 * Hook: get all filters.
 */
export function useFilters(
  store: UseBoundStore<StoreApi<DashboardStore>>
): Record<string, Filter> {
  return store((s) => s.filters)
}

/**
 * Hook: clear all filters.
 */
export function useClearFilters(
  store: UseBoundStore<StoreApi<DashboardStore>>
): () => void {
  return store((s) => s.clearFilters)
}
