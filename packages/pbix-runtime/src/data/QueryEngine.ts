import type { AsyncDuckDB, ArrowTable } from "@duckdb/duckdb-wasm"

export type AggFn = "sum" | "avg" | "count" | "min" | "max" | "distinctCount"

export interface Filter {
  column: string // "Table.Column" or just "Column"
  op: "in" | "eq" | "ne" | "gte" | "lte" | "between" | "contains"
  values: any[]
}

export interface AggregateParams {
  table: string
  groupBy?: string[]
  measures: Array<{ column: string; fn: AggFn; alias?: string }>
  filters?: Filter[]
  orderBy?: Array<{ column: string; dir: "asc" | "desc" }>
  limit?: number
}

export interface TopNParams {
  table: string
  column: string
  measure: { column: string; fn: AggFn }
  n: number
  filters?: Filter[]
  groupBy?: string[]
}

/**
 * Converts an Arrow table to a plain JS array of records.
 * Handles BigInt → Number, Date → ISO string, Decimal → Number.
 */
export function arrowToJSON(table: ArrowTable): Record<string, any>[] {
  const rows: Record<string, any>[] = []
  const cols = table.schema.fields.map((f) => f.name)

  for (let r = 0; r < table.numRows; r++) {
    const row: Record<string, any> = {}
    for (let c = 0; c < cols.length; c++) {
      const val = table.getChildAt(c)?.get(r)
      if (val === null || val === undefined) {
        row[cols[c]] = null
      } else if (typeof val === "bigint") {
        row[cols[c]] = Number(val)
      } else if (val instanceof Date) {
        row[cols[c]] = val.toISOString()
      } else if (typeof val === "object" && val?.constructor?.name === "Decimal") {
        row[cols[c]] = Number(val.toString())
      } else {
        row[cols[c]] = val
      }
    }
    rows.push(row)
  }
  return rows
}

/** Escape an identifier for SQL (quote-safe). */
function ident(name: string): string {
  return `"${name.replace(/"/g, '""')}"`
}

/** Build SQL WHERE clause from filters. Returns { clause, params }. */
function buildWhere(
  filters: Filter[] | undefined,
  tableRef: string
): { clause: string; params: any[] } {
  if (!filters || filters.length === 0) return { clause: "", params: [] }

  const parts: string[] = []
  const params: any[] = []

  for (const f of filters) {
    const col = ident(f.column.includes(".") ? f.column.split(".")[1] : f.column)
    const ref = `${tableRef}.${col}`
    switch (f.op) {
      case "in":
        parts.push(`${ref} IN (${f.values.map(() => "?").join(", ")})`)
        params.push(...f.values)
        break
      case "eq":
        parts.push(`${ref} = ?`)
        params.push(f.values[0])
        break
      case "ne":
        parts.push(`${ref} <> ?`)
        params.push(f.values[0])
        break
      case "gte":
        parts.push(`${ref} >= ?`)
        params.push(f.values[0])
        break
      case "lte":
        parts.push(`${ref} <= ?`)
        params.push(f.values[0])
        break
      case "between":
        parts.push(`${ref} BETWEEN ? AND ?`)
        params.push(f.values[0], f.values[1])
        break
      case "contains":
        parts.push(`LOWER(${ref}) LIKE LOWER('%' || ? || '%')`)
        params.push(f.values[0])
        break
    }
  }

  return { clause: "WHERE " + parts.join(" AND "), params }
}

const AGG_SQL: Record<AggFn, string> = {
  sum: "SUM",
  avg: "AVG",
  count: "COUNT",
  min: "MIN",
  max: "MAX",
  distinctCount: "COUNT(DISTINCT",
}

export class QueryEngine {
  private db: AsyncDuckDB
  private tableAliases: Map<string, number> = new Map()

  constructor(db: AsyncDuckDB) {
    this.db = db
  }

  private alias(table: string): string {
    const count = this.tableAliases.get(table) ?? 0
    this.tableAliases.set(table, count + 1)
    return count === 0 ? ident(table) : `${ident(table)} AS t${count}`
  }

  /**
   * Execute a raw SQL query and return JS arrays.
   */
  async raw<T = Record<string, any>>(sql: string, params?: any[]): Promise<T[]> {
    const conn = await this.db.connect()
    try {
      let stmt
      if (params && params.length > 0) {
        // Use prepared statement for parameterized queries
        stmt = await conn.prepare(sql)
        const arrow = await stmt.query(...params)
        return arrowToJSON(arrow) as T[]
      }
      const result = await conn.query(sql)
      return arrowToJSON(result) as T[]
    } finally {
      await conn.close()
    }
  }

  /**
   * Run an aggregate query with typed params.
   */
  async aggregate(params: AggregateParams): Promise<Record<string, any>[]> {
    const tableRef = `"${params.table}"`
    const selects: string[] = []

    if (params.groupBy && params.groupBy.length > 0) {
      for (const g of params.groupBy) {
        const col = g.includes(".") ? g.split(".")[1] : g
        selects.push(`${tableRef}.${ident(col)} AS ${ident(col)}`)
      }
    }

    for (const m of params.measures) {
      const col = m.column.includes(".") ? m.column.split(".")[1] : m.column
      const alias = m.alias ?? `${m.fn}_${col}`
      const aggFn = AGG_SQL[m.fn]
      if (!aggFn) {
        throw new Error(`Unknown aggregation: ${m.fn}`)
      }
      if (m.fn === "distinctCount") {
        selects.push(`${aggFn} ${ident(col)}) AS ${ident(alias)}`)
      } else {
        selects.push(`${aggFn}(${ident(col)}) AS ${ident(alias)}`)
      }
    }

    const { clause, params: whereParams } = buildWhere(params.filters, tableRef)

    let sql = `SELECT ${selects.join(", ")}\nFROM ${tableRef}\n${clause}`

    if (params.groupBy && params.groupBy.length > 0) {
      sql += `\nGROUP BY ${params.groupBy.map((g) => {
        const col = g.includes(".") ? g.split(".")[1] : g
        return ident(col)
      }).join(", ")}`
    }

    if (params.orderBy && params.orderBy.length > 0) {
      sql += "\nORDER BY " + params.orderBy.map(
        (o) => `${ident(o.column)} ${o.dir === "desc" ? "DESC" : "ASC"}`
      ).join(", ")
    }

    if (params.limit) {
      sql += `\nLIMIT ${params.limit}`
    }

    return this.raw(sql, whereParams.length > 0 ? whereParams : undefined)
  }

  /**
   * Get distinct values for a column, optionally filtered.
   */
  async distinctValues(
    table: string,
    column: string,
    filters?: Filter[]
  ): Promise<string[]> {
    const col = column.includes(".") ? column.split(".")[1] : column
    const tableRef = `"${table}"`
    const colRef = `${tableRef}.${ident(col)}`

    const { clause, params: whereParams } = buildWhere(filters, tableRef)
    const sql = `SELECT DISTINCT ${colRef} AS val\nFROM ${tableRef}\n${clause}\nORDER BY val`

    const results = await this.raw<{ val: any }>(
      sql,
      whereParams.length > 0 ? whereParams : undefined
    )
    return results.map((r) => String(r.val)).filter(Boolean)
  }

  /**
   * Get top N values of a column by a measure.
   */
  async topN(params: TopNParams): Promise<Record<string, any>[]> {
    return this.aggregate({
      table: params.table,
      groupBy: params.groupBy ?? [params.column],
      measures: [params.measure],
      filters: params.filters,
      orderBy: [{ column: params.measure.alias ?? `${params.measure.fn}_${params.measure.column}`, dir: "desc" }],
      limit: params.n,
    })
  }
}
