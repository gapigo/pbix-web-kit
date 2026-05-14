import { useMemo } from "react"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "../state/createDashboardStore"
import type { PageBrief, Storyboard } from "../data/types"

/**
 * Get the current storyboard from the store.
 */
export function useStoryboard(
  store: UseBoundStore<StoreApi<DashboardStore>>
): Storyboard | null {
  return store((s) => s.storyboard)
}

/**
 * Get the active page brief from the storyboard.
 */
export function useActivePage(
  store: UseBoundStore<StoreApi<DashboardStore>>
): PageBrief | undefined {
  const storyboard = useStoryboard(store)
  const activePage = store((s) => s.activePage)

  return useMemo(() => {
    if (!storyboard) return undefined
    return storyboard.pages.find(
      (p) => p.name === activePage || p.display_name === activePage
    )
  }, [storyboard, activePage])
}
