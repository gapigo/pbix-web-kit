import { useState, useEffect } from "react"
import type { PbixIR, Page } from "@/components/visuals/types"
import { ReportCanvas } from "@/components/layout/ReportCanvas"
import { FilterProvider } from "@/components/layout/FilterContext"
import irData from "@/data/ir.json"

// Create a typed reference to the IR data
const ir = irData as unknown as PbixIR

function App() {
  const [activePage, setActivePage] = useState<Page | null>(null)
  const [allData, setAllData] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      // Load all table data files
      const data: Record<string, any[]> = {}
      for (const table of ir.tables) {
        const safeName = table.name.replace(/[^a-zA-Z0-9\-_]/g, "_")
        try {
          const resp = await fetch(`/data/${safeName}.json`)
          if (resp.ok) {
            data[table.name] = await resp.json()
          }
        } catch {
          console.warn(`Failed to load ${table.name}.json`)
        }
      }
      setAllData(data)
      setActivePage(ir.pages[0])
      setLoading(false)
    }
    loadData()
  }, [])

  useEffect(() => {
    document.title = "pbix-web-kit — " + ir.source_file.split(/[/\\]/).pop()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        Loading dashboard...
      </div>
    )
  }

  if (!activePage) {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        No pages found in report
      </div>
    )
  }

  return (
    <FilterProvider>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="border-b px-4 py-2 flex items-center gap-4 shrink-0">
          <h1 className="text-sm font-semibold">pbix-web-kit</h1>
          <span className="text-xs text-muted-foreground">|</span>
          <span className="text-xs text-muted-foreground truncate">
            {ir.source_file.split(/[/\\]/).pop()}
          </span>
        </header>

        {/* Page tabs */}
        <div className="border-b px-4 flex gap-0 overflow-x-auto shrink-0">
          {ir.pages.map((page) => (
            <button
              key={page.name}
              onClick={() => setActivePage(page)}
              className={`px-3 py-2 text-xs border-b-2 transition-colors whitespace-nowrap ${
                activePage.name === page.name
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {page.display_name}
            </button>
          ))}
        </div>

        {/* Canvas area */}
        <main className="flex-1 p-4 overflow-hidden">
          <ReportCanvas
            key={activePage.name}
            page={activePage}
            allData={allData}
          />
        </main>
      </div>
    </FilterProvider>
  )
}

export default App
