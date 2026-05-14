import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useDuckDb } from 'duckdb-wasm-kit'
import { QueryEngine, createDashboardStore, runQueryValidator } from '@pbix/runtime'
import type { DashboardStore, QueryIssue } from '@pbix/runtime'

interface PageConfig { slug: string; title: string; component: string }
interface DataSourceConfig { type: string; parquetBasePath?: string; tables?: string[]; viewSql?: string }
interface DashboardManifest { id: string; name: string; source: string; dataSource: DataSourceConfig; pages: PageConfig[] }

interface BootValue { engine: QueryEngine | null; store: ReturnType<typeof createDashboardStore> | null; manifest: DashboardManifest | null; ready: boolean; error: string | null }
const BootCtx = createContext<BootValue>({ engine: null, store: null, manifest: null, ready: false, error: null })
export function useEngine() { return useContext(BootCtx).engine }
export function useStore() { return useContext(BootCtx).store }
export function useManifest() { return useContext(BootCtx).manifest }

async function loadParquet(db: any, url: string, name: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Fetch fail ' + url + ': ' + res.status)
  const buf = await res.arrayBuffer()
  await db.registerFileBuffer(name, new Uint8Array(buf))
  const conn = await db.connect()
  try { await conn.query('CREATE TABLE IF NOT EXISTS "' + name + '" AS SELECT * FROM read_parquet(\'' + name + '\')') } finally { await conn.close() }
}

interface Props { manifestId: string; children: ReactNode }
export function BootProvider({ manifestId, children }: Props) {
  const duckDb = useDuckDb()
  const [val, setVal] = useState<BootValue>({ engine: null, store: null, manifest: null, ready: false, error: null })

  useEffect(() => {
    if (!duckDb?.db) return
    let cancelled = false
    async function init() {
      try {
        const mr = await fetch('/dashboards/' + manifestId + '.manifest.json')
        if (!mr.ok) throw new Error('Manifest not found: ' + manifestId)
        const manifest: DashboardManifest = await mr.json()
        const ds = manifest.dataSource
        if (ds.type === 'parquet' && ds.tables && ds.parquetBasePath) {
          for (const t of ds.tables) {
            try { await loadParquet(duckDb.db, ds.parquetBasePath + t + '.parquet', t) } catch (e: any) { console.warn('[boot] parquet fail:', t, e.message) }
          }
        }
        const conn = await duckDb.db.connect()
        if (ds.viewSql) { try { await conn.query(ds.viewSql) } catch (e: any) { console.warn('[boot] viewSql fail:', e.message) } }
        await conn.close()
        const engine = new QueryEngine(duckDb.db)
        const store = createDashboardStore()
        const issues = await runQueryValidator(engine)
        ;(window as any).__query_issues__ = issues
        ;(window as any).__queryEngine__ = engine
        if (!cancelled) setVal({ engine, store, manifest, ready: true, error: null })
      } catch (err: any) { if (!cancelled) setVal(p => ({ ...p, error: err.message })) }
    }
    init()
    return () => { cancelled = true }
  }, [duckDb?.db, manifestId])

  if (val.error) {
    return <div className="flex h-screen items-center justify-center bg-[#F8FAFC] p-8"><div className="text-center"><p className="text-2xl mb-2">{'\u26A0\uFE0F'}</p><p className="font-semibold text-[#0A2342] mb-2">Error loading dashboard</p><p className="text-sm text-[#6B7280] font-mono">{val.error}</p></div></div>
  }
  if (!val.ready) {
    return <div className="flex h-screen items-center justify-center bg-[#F8FAFC]"><div className="text-center"><div className="w-8 h-8 border-2 border-[#0F52BA] border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-sm text-[#6B7280]">{val.manifest ? 'Loading ' + val.manifest.name + '...' : 'Starting...'}</p></div></div>
  }
  return <BootCtx.Provider value={val}>{children}</BootCtx.Provider>
}
