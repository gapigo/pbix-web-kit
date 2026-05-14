import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DuckDBProvider } from '@pbix/runtime'
import { BootProvider, useEngine, useManifest, useStore } from './boot'
import { lazy, Suspense } from 'react'

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30000, retry: 1 } } })

const DASHBOARDS: Record<string, { label: string; pages: Record<string, any> }> = {
  'regional-sales': {
    label: 'Regional Sales',
    pages: {
      'sales-overview': lazy(() => import('./dashboards/regional-sales/SalesOverview')),
      'win-loss-overview': lazy(() => import('./dashboards/regional-sales/WinLossOverview')),
      'industries-overview': lazy(() => import('./dashboards/regional-sales/IndustriesOverview')),
      'pipeline-trends': lazy(() => import('./dashboards/regional-sales/PipelineTrends')),
      'trend-analytics': lazy(() => import('./dashboards/regional-sales/TrendAnalytics')),
      'win-loss-insights': lazy(() => import('./dashboards/regional-sales/WinLossInsights')),
      'days-to-close': lazy(() => import('./dashboards/regional-sales/DaysToClose')),
      'sales-discounting': lazy(() => import('./dashboards/regional-sales/SalesDiscounting')),
      'revenue-breakdown': lazy(() => import('./dashboards/regional-sales/RevenueBreakdown')),
      'qa-query': lazy(() => import('./dashboards/regional-sales/QAQuery')),
      'template': lazy(() => import('./dashboards/regional-sales/Template')),
    }
  },
  'ecommerce': {
    label: 'E-Commerce',
    pages: {
      'executive-overview': lazy(() => import('./dashboards/ecommerce/ExecutiveOverview')),
      'product-analysis': lazy(() => import('./dashboards/ecommerce/ProductAnalysis')),
      'regional-performance': lazy(() => import('./dashboards/ecommerce/RegionalPerformance')),
      'discount-impact': lazy(() => import('./dashboards/ecommerce/DiscountImpact')),
      'customer-segments': lazy(() => import('./dashboards/ecommerce/CustomerSegments')),
      'shipping-analysis': lazy(() => import('./dashboards/ecommerce/ShippingAnalysis')),
    }
  }
}

function DashboardRouter({ dashboardId }: { dashboardId: string }) {
  const manifest = useManifest()
  const engine = useEngine()
  const store = useStore()!
  const { pageSlug } = useParams()
  const navigate = useNavigate()
  if (!manifest) return null
  const dash = DASHBOARDS[dashboardId]
  const PageComponent = dash?.pages[pageSlug ?? '']
  const firstSlug = manifest.pages[0]?.slug
  if (!pageSlug && firstSlug) return <Navigate to={'/' + dashboardId + '/' + firstSlug} replace />
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-[Inter,system-ui,sans-serif]">
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-10">
        <div className="px-6 py-3 flex items-center gap-4">
          <h1 className="text-sm font-bold text-[#0A2342]">{manifest.name}</h1>
          <a href="/" className="text-xs text-[#6B7280] hover:text-[#0F52BA]">All dashboards</a>
        </div>
        <div className="px-6 flex gap-0 overflow-x-auto">
          {manifest.pages.map(p => (
            <button key={p.slug} onClick={() => navigate('/' + dashboardId + '/' + p.slug)}
              className={'px-4 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ' + (pageSlug === p.slug ? 'border-[#0F52BA] text-[#0F52BA]' : 'border-transparent text-[#6B7280] hover:text-[#0A2342]')}>
              {p.title}
            </button>
          ))}
        </div>
      </header>
      <Suspense fallback={<div className="flex h-64 items-center justify-center"><div className="w-6 h-6 border-2 border-[#0F52BA] border-t-transparent rounded-full animate-spin" /></div>}>
        {PageComponent ? <PageComponent engine={engine} store={store} /> : <div className="p-8 text-center text-[#6B7280]">Page not found: {pageSlug}</div>}
      </Suspense>
    </div>
  )
}

function DashboardSelector() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-[Inter,system-ui,sans-serif]">
      <div className="text-center max-w-lg">
        <h1 className="text-2xl font-bold text-[#0A2342] mb-2">pbix-web-kit</h1>
        <p className="text-sm text-[#6B7280] mb-8">Select a dashboard to view</p>
        <div className="grid gap-4">
          {Object.entries(DASHBOARDS).map(([id, d]) => (
            <a key={id} href={'/' + id}
              className="block p-6 bg-white rounded-lg border border-[#E2E8F0] hover:border-[#0F52BA] hover:shadow-md transition-all text-left">
              <p className="font-semibold text-[#0A2342]">{d.label}</p>
              <p className="text-xs text-[#6B7280] mt-1">{Object.keys(d.pages).length} pages</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={qc}>
      <DuckDBProvider config={{ query: { castBigIntToDouble: true } }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DashboardSelector />} />
            {Object.keys(DASHBOARDS).map(id => (
              <Route key={id} path={'/' + id + '/*'} element={
                <BootProvider manifestId={id}>
                  <Routes>
                    <Route path=":pageSlug" element={<DashboardRouter dashboardId={id} />} />
                    <Route path="" element={<DashboardRouter dashboardId={id} />} />
                  </Routes>
                </BootProvider>
              } />
            ))}
          </Routes>
        </BrowserRouter>
      </DuckDBProvider>
    </QueryClientProvider>
  )
}

export default App
