import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from "react-router-dom"
import {
  DashboardShell,
  PageTabs,
  FilterBar,
  useUrlSyncedFilters,
  selectFilterCount,
} from "@pbix/runtime"
import { BootProvider, useEngine, useStore } from "./boot"
import { lazy, Suspense } from "react"

// Lazy load all 11 composer pages
const composerPages: Record<string, any> = {
  "Sales Overview": lazy(() => import("./pages/composer/SalesOverview")),
  "Win/Loss Ratio Overview": lazy(() => import("./pages/composer/WinLossOverview")),
  "Industries Overview": lazy(() => import("./pages/composer/IndustriesOverview")),
  "Pipeline Trends": lazy(() => import("./pages/composer/PipelineTrends")),
  "Trend Analytics": lazy(() => import("./pages/composer/TrendAnalytics")),
  "Win/Loss Ratio Insights": lazy(() => import("./pages/composer/WinLossInsights")),
  "Days to Close Insights": lazy(() => import("./pages/composer/DaysToCloseInsights")),
  "Sales Discounting Insights": lazy(() => import("./pages/composer/SalesDiscountingInsights")),
  "Revenue Source Breakdown": lazy(() => import("./pages/composer/RevenueSourceBreakdown")),
  "Q&A Query": lazy(() => import("./pages/composer/QAQuery")),
  "Template": lazy(() => import("./pages/composer/Template")),
}

const generatorPages: Record<string, any> = {
  "Sales Overview": lazy(() => import("./pages/generator/SalesOverview")),
  "Win/Loss Ratio Overview": lazy(() => import("./pages/generator/WinLossOverview")),
  "Industries Overview": lazy(() => import("./pages/generator/IndustriesOverview")),
  "Pipeline Trends": lazy(() => import("./pages/generator/PipelineTrends")),
  "Trend Analytics": lazy(() => import("./pages/generator/TrendAnalytics")),
  "Win/Loss Ratio Insights": lazy(() => import("./pages/generator/WinLossInsights")),
  "Days to Close Insights": lazy(() => import("./pages/generator/DaysToCloseInsights")),
  "Sales Discounting Insights": lazy(() => import("./pages/generator/SalesDiscountingInsights")),
  "Revenue Source Breakdown": lazy(() => import("./pages/generator/RevenueSourceBreakdown")),
  "Q&A Query": lazy(() => import("./pages/generator/QAQuery")),
  "Template": lazy(() => import("./pages/generator/Template")),
}

function DashboardContent() {
  const engine = useEngine()
  const store = useStore()!
  const { mode = "composer", pageName } = useParams<{ mode: string; pageName: string }>()
  const navigate = useNavigate()

  useUrlSyncedFilters(store)

  const storyboard = store((s) => s.storyboard)
  const activePage = store((s) => s.activePage)
  const filterCount = selectFilterCount(store.getState())

  if (!storyboard) return null

  const pages = mode === "composer" ? composerPages : generatorPages
  const PageComponent = pages[activePage]

  return (
    <DashboardShell
      title={storyboard.dashboard_name}
      header={
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <Link
              to={`/composer/${activePage}`}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                mode === "composer" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Composer
            </Link>
            <Link
              to={`/generator/${activePage}`}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                mode === "generator" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Generator
            </Link>
          </div>
          {filterCount > 0 && (
            <span className="text-xs text-blue-600 font-medium">
              {filterCount} filter{filterCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      }
    >
      <PageTabs
        storyboard={storyboard}
        activePage={activePage}
        onPageChange={(name) => {
          store.getState().setActivePage(name)
          navigate(`/${mode}/${encodeURIComponent(name)}`)
        }}
      />
      <FilterBar store={store} />
      <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-lg" />}>
        {PageComponent ? <PageComponent engine={engine} store={store} /> : null}
      </Suspense>
    </DashboardShell>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <BootProvider>
        <Routes>
          <Route path="/:mode/:pageName" element={<DashboardContent />} />
          <Route path="*" element={<DashboardContent />} />
        </Routes>
      </BootProvider>
    </BrowserRouter>
  )
}
