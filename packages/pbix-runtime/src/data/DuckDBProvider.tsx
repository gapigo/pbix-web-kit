import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { initializeDuckDb, useDuckDb as useDuckDbKit } from "duckdb-wasm-kit"

type DuckDbContextType = ReturnType<typeof useDuckDbKit>

const DuckDbContext = createContext<DuckDbContextType | null>(null)

interface DuckDBProviderProps {
  children: ReactNode
  config?: Record<string, unknown>
}

export function DuckDBProvider({ children, config }: DuckDBProviderProps) {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!initialized) {
      initializeDuckDb({
        config: { query: { castBigIntToDouble: true }, ...((config as any) ?? {}) },
        debug: false,
      })
      setInitialized(true)
    }
  }, [initialized, config])

  return (
    <DuckDbContext.Provider value={null as unknown as DuckDbContextType}>
      {children}
    </DuckDbContext.Provider>
  )
}

export function useDuckDb(): DuckDbContextType {
  // duckdb-wasm-kit's useDuckDb hook provides singleton access
  return useDuckDbKit()
}
