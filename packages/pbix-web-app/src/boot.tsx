import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import {
  QueryEngine,
  createDashboardStore,
  type Storyboard,
  type DashboardStore,
} from "@pbix/runtime"
import type { AsyncDuckDB } from "@duckdb/duckdb-wasm"
import { useDuckDb } from "duckdb-wasm-kit"

const EngineContext = createContext<QueryEngine | null>(null)
const StoreContext = createContext<ReturnType<typeof createDashboardStore> | null>(null)

export function useEngine(): QueryEngine | null {
  return useContext(EngineContext)
}

export function useStore(): ReturnType<typeof createDashboardStore> | null {
  return useContext(StoreContext)
}

const PARQUET_TABLES = [
  { name: "Accounts", url: "/parquet/Accounts.parquet" },
  { name: "Campaigns", url: "/parquet/Campaigns.parquet" },
  { name: "Contacts", url: "/parquet/Contacts.parquet" },
  { name: "Industries", url: "/parquet/Industries.parquet" },
  { name: "Opportunities", url: "/parquet/Opportunities.parquet" },
  { name: "Opportunity Forecast Adjustment", url: "/parquet/Opportunity_Forecast_Adjustment.parquet" },
  { name: "Owners", url: "/parquet/Owners.parquet" },
  { name: "Products", url: "/parquet/Products.parquet" },
  { name: "Territories", url: "/parquet/Territories.parquet" },
]

async function loadParquetToDuckDB(db: AsyncDuckDB, url: string, tableName: string): Promise<void> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`)
  const buf = await response.arrayBuffer()
  await db.registerFileBuffer(tableName, new Uint8Array(buf))
  const conn = await db.connect()
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS "${tableName}" AS
      SELECT * FROM read_parquet('${tableName}')
    `)
  } finally {
    await conn.close()
  }
}

async function createViews(db: AsyncDuckDB): Promise<void> {
  const conn = await db.connect()
  try {
    // Denormalized opportunity view with all joins
    await conn.query(`
      CREATE VIEW IF NOT EXISTS v_opportunities AS
      SELECT
        o.*,
        p.Product,
        p."Product Category" AS "Product LOB",
        t.Territory,
        t.Region,
        t."State Or Province",
        a."Account Name",
        a."State or Province" AS "Account State",
        own.Owner,
        own.Manager,
        i.Industry
      FROM Opportunities o
      LEFT JOIN Products p ON o.ProductSeq = p.ProductSeq
      LEFT JOIN Accounts a ON o.AccountSeq = a.AccountSeq
      LEFT JOIN Territories t ON a.TerritorySeq = t.TerritorySeq
      LEFT JOIN Owners own ON o.SystemUserSeq = own.SystemUserSeq
      LEFT JOIN Industries i ON a.IndustrySeq = i.IndustrySeq
    `)
  } finally {
    await conn.close()
  }
}

export function BootProvider({ children }: { children: ReactNode }) {
  const duckDb = useDuckDb()
  const [engine, setEngine] = useState<QueryEngine | null>(null)
  const [store] = useState(() => createDashboardStore())
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!duckDb?.db) return

    let cancelled = false

    async function init() {
      try {
        // Load storyboard
        const sbResp = await fetch("/storyboard.json")
        const sbData = await sbResp.json()
        const storyboard = sbData as Storyboard

        // Register parquet tables
        for (const t of PARQUET_TABLES) {
          await loadParquetToDuckDB(duckDb.db, t.url, t.name)
        }

        // Create denormalized views for easier querying
        await createViews(duckDb.db)
        if (!cancelled) {
          store.getState().setStoryboard(storyboard)
          if (storyboard.pages.length > 0) {
            store.getState().setActivePage(storyboard.pages[0].display_name)
          }
          store.getState().setPageContentReady(true)
          setEngine(new QueryEngine(duckDb.db))
          setReady(true)
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message ?? "Failed to initialize")
        }
      }
    }

    init()
    return () => { cancelled = true }
  }, [duckDb, store])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-red-200 max-w-md">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Initialization Error</h2>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading dashboard data…</p>
        </div>
      </div>
    )
  }

  return (
    <EngineContext.Provider value={engine}>
      <StoreContext.Provider value={store}>
        {children}
      </StoreContext.Provider>
    </EngineContext.Provider>
  )
}
