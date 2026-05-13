import type { AsyncDuckDB } from "@duckdb/duckdb-wasm"

const REGISTERED_TABLES = new Set<string>()

/**
 * Load a single Parquet file from a URL and register it as a DuckDB table.
 * Idempotent: skips if table already registered.
 */
export async function loadParquet(
  db: AsyncDuckDB,
  url: string,
  tableName: string
): Promise<void> {
  if (REGISTERED_TABLES.has(tableName)) return

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch parquet ${url}: ${response.status}`)
  }
  const buf = await response.arrayBuffer()
  await db.registerFileBuffer(tableName, new Uint8Array(buf))

  const conn = await db.connect()
  try {
    await conn.query(`
      CREATE TABLE "${tableName}" AS
      SELECT * FROM read_parquet('${tableName}')
    `)
    REGISTERED_TABLES.add(tableName)
  } finally {
    await conn.close()
  }
}

/**
 * Register multiple Parquet tables in parallel.
 */
export async function registerTables(
  db: AsyncDuckDB,
  tables: Array<{ url: string; name: string }>
): Promise<void> {
  await Promise.all(tables.map((t) => loadParquet(db, t.url, t.name)))
}

/**
 * Clear the registered tables cache (useful for testing or re-loading).
 */
export function clearRegisteredTables(): void {
  REGISTERED_TABLES.clear()
}
