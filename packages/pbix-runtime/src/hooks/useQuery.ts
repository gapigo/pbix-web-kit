import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { QueryEngine, type AggregateParams, type Filter, type TopNParams } from "../data/QueryEngine"

const DEFAULT_STALE_TIME = 30_000 // 30s

interface UseQueryParams {
  engine: QueryEngine | null
  sql: string
  params?: any[]
  staleTime?: number
  enabled?: boolean
}

/**
 * Hook: execute a raw SQL query via the QueryEngine.
 * Returns { data, loading, error }.
 */
export function useQueryHook({
  engine,
  sql,
  params,
  staleTime = DEFAULT_STALE_TIME,
  enabled = true,
}: UseQueryParams): { data: Record<string, any>[] | undefined; loading: boolean; error: Error | null } {
  const queryKey = useMemo(() => ["raw", sql, JSON.stringify(params)], [sql, params])

  const result = useQuery({
    queryKey,
    queryFn: async () => {
      if (!engine) throw new Error("QueryEngine not initialized")
      return engine.raw(sql, params)
    },
    staleTime,
    enabled: enabled && !!engine,
  })

  return {
    data: result.data,
    loading: result.isLoading,
    error: result.error as Error | null,
  }
}

/**
 * Hook: execute an aggregate query.
 */
export function useAggregation(
  engine: QueryEngine | null,
  params: AggregateParams,
  staleTime = DEFAULT_STALE_TIME
): { data: Record<string, any>[] | undefined; loading: boolean; error: Error | null } {
  const queryKey = useMemo(() => ["aggregate", JSON.stringify(params)], [params])

  const result = useQuery({
    queryKey,
    queryFn: async () => {
      if (!engine) throw new Error("QueryEngine not initialized")
      return engine.aggregate(params)
    },
    staleTime,
    enabled: !!engine,
  })

  return {
    data: result.data,
    loading: result.isLoading,
    error: result.error as Error | null,
  }
}

/**
 * Hook: get distinct values for a slicer column.
 */
export function useDistinctValues(
  engine: QueryEngine | null,
  table: string,
  column: string,
  filters?: Filter[],
  staleTime = DEFAULT_STALE_TIME
): { data: string[] | undefined; loading: boolean; error: Error | null } {
  const queryKey = useMemo(
    () => ["distinctValues", table, column, JSON.stringify(filters)],
    [table, column, filters]
  )

  const result = useQuery({
    queryKey,
    queryFn: async () => {
      if (!engine) throw new Error("QueryEngine not initialized")
      return engine.distinctValues(table, column, filters)
    },
    staleTime,
    enabled: !!engine,
  })

  return {
    data: result.data,
    loading: result.isLoading,
    error: result.error as Error | null,
  }
}

/**
 * Hook: get top N values by measure.
 */
export function useTopN(
  engine: QueryEngine | null,
  params: TopNParams,
  staleTime = DEFAULT_STALE_TIME
): { data: Record<string, any>[] | undefined; loading: boolean; error: Error | null } {
  const queryKey = useMemo(() => ["topN", JSON.stringify(params)], [params])

  const result = useQuery({
    queryKey,
    queryFn: async () => {
      if (!engine) throw new Error("QueryEngine not initialized")
      return engine.topN(params)
    },
    staleTime,
    enabled: !!engine,
  })

  return {
    data: result.data,
    loading: result.isLoading,
    error: result.error as Error | null,
  }
}
