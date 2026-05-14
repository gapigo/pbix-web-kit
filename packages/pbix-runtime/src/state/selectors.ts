import type { DashboardStore } from "./createDashboardStore"
import type { PageBrief, VisualSummary } from "../data/types"

/** Get the current active page brief from the storyboard. */
export function selectActivePageBrief(state: DashboardStore): PageBrief | undefined {
  if (!state.storyboard) return undefined
  return state.storyboard.pages.find(
    (p) => p.name === state.activePage || p.display_name === state.activePage
  )
}

/** Get hero visuals for the active page (importance <= 2). */
export function selectHeroVisuals(state: DashboardStore): VisualSummary[] | undefined {
  const page = selectActivePageBrief(state)
  if (!page) return undefined
  return page.visuals.filter((v) => v.importance <= 2 && !v.chrome)
}

/** Get supporting visuals for the active page (importance 3-4). */
export function selectSupportingVisuals(state: DashboardStore): VisualSummary[] | undefined {
  const page = selectActivePageBrief(state)
  if (!page) return undefined
  return page.visuals.filter((v) => v.importance >= 3 && v.importance <= 4 && !v.chrome)
}

/** Get slicers for the active page. */
export function selectPageSlicers(state: DashboardStore): VisualSummary[] | undefined {
  const page = selectActivePageBrief(state)
  if (!page) return undefined
  return page.visuals.filter((v) => v.raw_type === "slicer" && !v.chrome)
}

/** Count active filters. */
export function selectFilterCount(state: DashboardStore): number {
  return Object.keys(state.filters).length
}
