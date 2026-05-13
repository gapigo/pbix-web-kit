/**
 * Tolerant table/column lookup utilities.
 * Handles sanitized names like "Foo_Bar" vs "Foo Bar".
 */

/** Normalize a name for tolerant matching: lowercase, collapse whitespace/underscores. */
function norm(s: string): string {
  return (s ?? "").toLowerCase().replace(/[\s_\-]+/g, "")
}

/**
 * Find a table in a data dict with fuzzy name matching.
 * Returns [found_key, data_array] or null.
 */
export function getTable(
  name: string,
  data: Record<string, any[]>
): [string, any[]] | null {
  // Exact match
  if (data[name]) return [name, data[name]]

  const n = norm(name)
  for (const key of Object.keys(data)) {
    if (norm(key) === n) return [key, data[key]]
  }

  // Partial match
  for (const key of Object.keys(data)) {
    if (norm(key).includes(n) || n.includes(norm(key))) return [key, data[key]]
  }

  return null
}

/**
 * Find a column in a sample row with fuzzy matching.
 * Returns the actual column name or null.
 */
export function resolveColumn(
  colName: string,
  sampleRow: Record<string, any>
): string | null {
  if (!sampleRow) return null

  // Exact
  if (colName in sampleRow) return colName

  const n = norm(colName)
  for (const key of Object.keys(sampleRow)) {
    if (norm(key) === n) return key
  }

  // Partial match on suffix (e.g. "Sales" matches "Total_Sales")
  for (const key of Object.keys(sampleRow)) {
    if (norm(key).includes(n) || n.includes(norm(key))) return key
  }

  return null
}
