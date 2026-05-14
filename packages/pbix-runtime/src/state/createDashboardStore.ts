import { create, type StoreApi, type UseBoundStore } from "zustand"
import type { Filter } from "../data/QueryEngine"
import type { Storyboard } from "../data/types"

export interface DashboardStore {
  filters: Record<string, Filter> // "Table.Column" -> Filter
  setFilter: (key: string, filter: Filter | null) => void
  clearFilters: () => void

  selection: { visualId: string; values: Record<string, any> } | null
  setSelection: (sel: DashboardStore["selection"]) => void

  activePage: string
  setActivePage: (name: string) => void

  storyboard: Storyboard | null
  setStoryboard: (sb: Storyboard) => void

  pageContentReady: boolean
  setPageContentReady: (ready: boolean) => void
}

export function createDashboardStore(
  initial?: Partial<DashboardStore>
): UseBoundStore<StoreApi<DashboardStore>> {
  return create<DashboardStore>((set) => ({
    filters: {},
    setFilter: (key, filter) =>
      set((state) => {
        const next = { ...state.filters }
        if (filter === null) {
          delete next[key]
        } else {
          next[key] = filter
        }
        return { filters: next }
      }),
    clearFilters: () => set({ filters: {} }),

    selection: null,
    setSelection: (sel) => set({ selection: sel }),

    activePage: "",
    setActivePage: (name) => set({ activePage: name }),

    storyboard: null,
    setStoryboard: (sb) => set({ storyboard: sb }),

    pageContentReady: false,
    setPageContentReady: (ready) => set({ pageContentReady: ready }),

    ...initial,
  }))
}
