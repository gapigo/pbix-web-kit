import { BrowserRouter, Routes, Route, Link, useParams, useNavigate, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  DashboardShell,
  PageTabs,
  FilterBar,
  useUrlSyncedFilters,
  selectFilterCount,
} from "@pbix/runtime"
import { BootProvider, useEngine, useStore } from "./boot"
import { lazy, Suspense, useEffect, useState } from "react"

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

// Lazy load all 11 composer pages — keyed by slug
const composerPages: Record<string, any> = {
  "sales-overview": lazy(() => import("./pages/composer/SalesOverview")),
  "win-loss-ratio-overview": lazy(() => import("./pages/composer/WinLossOverview")),
  "industries-overview": lazy(() => import("./pages/composer/IndustriesOverview")),
  "pipeline-trends": lazy(() => import("./pages/composer/PipelineTrends")),
  "trend-analytics": lazy(() => import("./pages/composer/TrendAnalytics")),
  "win-loss-ratio-insights": lazy(() => import("./pages/composer/WinLossInsights")),
  "days-to-close-insights": lazy(() => import("./pages/composer/DaysToCloseInsights")),
  "sales-discounting-insights": lazy(() => import("./pages/composer/SalesDiscountingInsights")),
  "revenue-source-breakdown": lazy(() => import("./pages/composer/RevenueSourceBreakdown")),
  "qa-query": lazy(() => import("./pages/composer/QAQuery")),
  "template": lazy(() => import("./pages/composer/Template")),
}

const generatorPages: Record<string, any> = {
  "sales-overview": lazy(() => import("./pages/generator/SalesOverview")),
  "win-loss-ratio-overview": lazy(() => import("./pages/generator/WinLossOverview")),
  "industries-overview": lazy(() => import("./pages/generator/IndustriesOverview")),
  "pipeline-trends": lazy(() => import("./pages/generator/PipelineTrends")),
  "trend-analytics": lazy(() => import("./pages/generator/TrendAnalytics")),
  "win-loss-ratio-insights": lazy(() => import("./pages/generator/WinLossInsights")),
  "days-to-close-insights": lazy(() => import("./pages/generator/DaysToCloseInsights")),
  "sales-discounting-insights": lazy(() => import("./pages/generator/SalesDiscountingInsights")),
  "revenue-source-breakdown": lazy(() => import("./pages/generator/RevenueSourceBreakdown")),
  "qa-query": lazy(() => import("./pages/generator/QAQuery")),
  "template": lazy(() => import("./pages/generator/Template")),
}


// E-Commerce pages (Generator only)
const ecommercePages: Record<string, any> = {
  "executive-overview": lazy(() => import("./pages/generator-ecommerce/ExecutiveOverview")),
  "product-analysis": lazy(() => import("./pages/generator-ecommerce/ProductAnalysis")),
  "regional-performance": lazy(() => import("./pages/generator-ecommerce/RegionalPerformance")),
  "discount-impact": lazy(() => import("./pages/generator-ecommerce/DiscountImpact")),
  "customer-segments": lazy(() => import("./pages/generator-ecommerce/CustomerSegments")),
  "shipping-analysis": lazy(() => import("./pages/generator-ecommerce/ShippingAnalysis")),
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

  // Redirect root to first page
  useEffect(() => {
    if (storyboard && storyboard.pages.length > 0 && !pageName) {
      const firstSlug = slugify(storyboard.pages[0].display_name)
      navigate(`/${mode}/${firstSlug}`, { replace: true })
    }
  }, [storyboard, pageName, mode, navigate])

  // Sync activePage from URL on mount
  useEffect(() => {
    if (pageName && storyboard) {
      const match = storyboard.pages.find(
        (p) => slugify(p.display_name) === pageName
      )
      if (match) {
        store.getState().setActivePage(match.display_name)
      }
    }
  }, [pageName, storyboard, store])
  // Clear filters when navigating between pages to avoid stale cross-page filters
  useEffect(() => {
    store.getState().clearFilters()
  }, [pageName, store])

  if (!storyboard) return null

  const pages = mode === "composer" ? composerPages : generatorPages
  const currentSlug = pageName ?? ""
  const PageComponent = pages[currentSlug]

  return (
    <DashboardShell
      title={storyboard.dashboard_name}
      header={
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <Link
              to={`/composer/${currentSlug}`}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                mode === "composer" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Composer
            </Link>
            <Link
              to={`/generator/${currentSlug}`}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                mode === "generator" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Generator
            </Link>
            <Link
              to="/ecommerce/executive-overview"
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                mode === "ecommerce" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              E-Commerce
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
          navigate(`/${mode}/${slugify(name)}`)
        }}
      />
      <FilterBar store={store} />
      <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-lg" />}>
        {PageComponent ? <PageComponent engine={engine} store={store} /> : null}
      </Suspense>
    </DashboardShell>
  )
}
// ─── E-Commerce content (no storyboard, hardcoded pages) ───
const ECOMMERCE_PAGE_NAMES = [
  { slug: "executive-overview", label: "Executive Overview" },
  { slug: "product-analysis", label: "Product Analysis" },
  { slug: "regional-performance", label: "Regional Performance" },
  { slug: "discount-impact", label: "Discount Impact" },
  { slug: "customer-segments", label: "Customer Segments" },
  { slug: "shipping-analysis", label: "Shipping Analysis" },
]

function EcommerceContent() {
  const engine = useEngine()
  const store = useStore()!
  const { pageName } = useParams<{ pageName: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    // clear filters on navigation
    store.getState().clearFilters()
  }, [pageName, store])

  const currentSlug = pageName ?? "executive-overview"
  const PageComponent = ecommercePages[currentSlug]

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Inter',system-ui,sans-serif]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <h1 className="text-[14px] font-semibold text-[#0A2342]">E-Commerce Analytics</h1>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <Link to="/generator/sales-overview"
              className="px-3 py-1 text-xs rounded-md font-medium transition-colors text-gray-500 hover:text-gray-700">
              Regional Sales
            </Link>
            <span className="px-3 py-1 text-xs rounded-md font-medium bg-white shadow-sm text-gray-900">
              E-Commerce
            </span>
          </div>
        </div>
        {/* Page tabs */}
        <div className="max-w-7xl mx-auto px-6 flex gap-1 pb-0">
          {ECOMMERCE_PAGE_NAMES.map((p) => (
            <button
              key={p.slug}
              onClick={() => navigate(`/ecommerce/${p.slug}`)}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                currentSlug === p.slug
                  ? "border-[#0F52BA] text-[#0F52BA] font-semibold"
                  : "border-transparent text-[#6B7280] hover:text-[#0F52BA] hover:bg-[#F8FAFC]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-lg m-6" />}>
        {PageComponent ? <PageComponent engine={engine} store={store} /> : null}
      </Suspense>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <BootProvider>
          <Routes>
            <Route path="/:mode/:pageName" element={<DashboardContent />} />
            <Route path="/ecommerce/:pageName" element={<EcommerceContent />} />
            <Route path="/ecommerce" element={<EcommerceContent />} />
            <Route path="/" element={<DashboardContent />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BootProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
