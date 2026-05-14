import { useEffect, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "./createDashboardStore"
import type { Filter } from "../data/QueryEngine"

const FILTER_KEY = "f"

/**
 * Serialize filters to URL base64 JSON and hydrate from URL on mount.
 * Returns the store instance for chaining.
 */
export function useUrlSyncedFilters(
  store: UseBoundStore<StoreApi<DashboardStore>>
): void {
  const [searchParams, setSearchParams] = useSearchParams()
  const hydrated = useRef(false)

  // Hydrate from URL on mount
  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true

    const fParam = searchParams.get(FILTER_KEY)
    if (!fParam) return

    try {
      const decoded = JSON.parse(atob(fParam)) as Record<string, Filter>
      const state = store.getState()
      for (const [key, filter] of Object.entries(decoded)) {
        state.setFilter(key, filter)
      }
    } catch {
      // Invalid URL params — ignore silently
    }
  }, [searchParams, store])

  // Sync filters to URL on every change
  useEffect(() => {
    const unsub = store.subscribe((state, prev) => {
      if (state.filters === prev.filters) return

      const keys = Object.keys(state.filters)
      if (keys.length === 0) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev)
          next.delete(FILTER_KEY)
          return next
        }, { replace: true })
        return
      }

      const encoded = btoa(JSON.stringify(state.filters))
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set(FILTER_KEY, encoded)
        return next
      }, { replace: true })
    })

    return () => unsub()
  }, [store, setSearchParams])
}
