/**
 * measureEvaluator.ts
 * 
 * Mini DAX evaluator for the 7 most common patterns in Power BI measures.
 * NOT a full DAX engine — only covers patterns found in the Regional Sales sample.
 *
 * Supported patterns:
 *   SUM(Table[Column])
 *   AVERAGE(Table[Column]) / AVG(Table[Column])
 *   COUNT(Table[Column]) / COUNTROWS(Table)
 *   MIN(Table[Column]) / MAX(Table[Column])
 *   DISTINCTCOUNT(Table[Column])
 *   DIVIDE(<expr>, <expr>[, fallback])
 *   [Measure Name] — reference to another measure
 *
 * CALCULATE/FILTER wrapper: extracts inner aggregation + filter predicate,
 * applies filter before aggregation.
 */

type Row = Record<string, any>;
type DataTables = Record<string, Row[]>;
type MeasureMap = Map<string, string>; // "Table.Measure" -> "DAX expression"


interface FilterPred {
  column: string;
  operator: string; // "=" for now
  value: string;
}

/** Extract table + column from a `Table[Column]` or `'Table'[Column]` reference. */
function parseColRef(s: string): { table: string; column: string } | null {
  // Match: TableName[ColumnName] or 'Table Name'[ColumnName]
  const m = s.match(/^(?:'?([^'\[\]]+)'?)\[([^\]]+)\]$/);
  if (m) return { table: m[1].trim(), column: m[2].trim() };
  return null;
}


/**
 * Parse a DAX expression and return a result evaluator function.
 * Returns null if the expression can't be parsed.
 */
export function parseAndEvaluate(
  expr: string,
  tables: DataTables,
  rowFilters: Record<string, string[]> = {},
  measureMap: MeasureMap = new Map(),
  evaluatedMeasures: Set<string> = new Set(),
): number | null {
  const trimmed = expr.trim();

  // 1. Strip comments (-- and /* */)
  const noComments = trimmed.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();

  // 2. Check for CALCULATE(...) wrapper
  const calcMatch = noComments.match(/^CALCULATE\s*\(([\s\S]*)\)$/i);
  let innerExpr: string;
  let preFilters: FilterPred[] = [];

  if (calcMatch) {
    // Extract the inner expression (first argument) and filter args
    const inner = calcMatch[1];
    // Try to split on ), FILTER( or ),FILTER(
    // Simple approach: find the aggregation + FILTER parts
    const parts = splitCalculateArgs(inner);
    innerExpr = parts.inner;
    preFilters = parts.filters;
  } else {
    innerExpr = noComments;
  }

  // 3. Resolve inner expression to an evaluator
  const result = resolveToValue(innerExpr, tables, rowFilters, preFilters, measureMap, evaluatedMeasures);
  return result;
}

/**
 * Split CALCULATE(firstArg, FILTER(...)) into the first argument and extracted filters.
 */
function splitCalculateArgs(inner: string): { inner: string; filters: FilterPred[] } {
  let depth = 0;
  let firstArgEnd = -1;
  let i = 0;
  while (i < inner.length) {
    if (inner[i] === '(') depth++;
    else if (inner[i] === ')') depth--;
    else if (inner[i] === ',' && depth === 0) {
      firstArgEnd = i;
      break;
    }
    i++;
  }

  if (firstArgEnd === -1) return { inner: inner.trim(), filters: [] };

  const firstArg = inner.slice(0, firstArgEnd).trim();
  const rest = inner.slice(firstArgEnd + 1).trim();

  // Parse FILTER predicates from rest
  const filters: FilterPred[] = [];
  const filterMatches = rest.matchAll(/FILTER\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi);
  for (const fm of filterMatches) {
    // filterTable available in fm[1] if needed
    const filterCond = fm[2].trim();
    // Parse simple predicate: Table[Col] = "Value"
    const predMatch = filterCond.match(/^(?:'?[^'\[\]]+'?)\[([^\]]+)\]\s*=\s*"([^"]*)"$/);
    if (predMatch) {
      filters.push({ column: predMatch[1], operator: '=', value: predMatch[2] });
    }
  }

  return { inner: firstArg, filters };
}

/**
 * Resolve an expression (potentially containing measure references and arithmetic)
 * to a numeric value.
 */
function resolveToValue(
  expr: string,
  tables: DataTables,
  rowFilters: Record<string, string[]>,
  preFilters: FilterPred[],
  measureMap: MeasureMap,
  evaluatedMeasures: Set<string>,
): number | null {
  const trimmed = expr.trim();
  // 0. Numeric literal
  const numVal = Number(trimmed);
  if (!isNaN(numVal)) return numVal;


  // 4. Try aggregation patterns (SUM, AVERAGE, COUNT, MIN, MAX, DISTINCTCOUNT)
  const aggResult = tryAggregation(trimmed, tables, rowFilters, preFilters, measureMap, evaluatedMeasures);
  if (aggResult !== null) return aggResult;

  // 5. Try COUNTROWS(Table)
  const crMatch = trimmed.match(/^COUNTROWS\s*\(\s*'?([^'")\]\[}]+)'?\s*\)$/i);
  if (crMatch) {
    const tableName = crMatch[1].trim();
    return filterAndCount(tableName, tables, rowFilters, preFilters);
  }

  // 6. Try DIVIDE(num, denom[, fallback])
  const divMatch = trimmed.match(/^DIVIDE\s*\(\s*([^,]+)\s*,\s*([^,]+)(?:\s*,\s*([^)]+))?\s*\)$/i);
  if (divMatch) {
    const num = resolveToValue(divMatch[1], tables, rowFilters, [], measureMap, evaluatedMeasures);
    const den = resolveToValue(divMatch[2], tables, rowFilters, [], measureMap, evaluatedMeasures);
    if (num !== null && (den === null || den === 0)) {
      const fallback = divMatch[3] ? Number(divMatch[3]) : null;
      return fallback !== null && !isNaN(fallback) ? fallback : null;
    }
    if (num !== null && den !== null && den !== 0) return num / den;
    return null;
  }

  // 7. Try SELECTEDVALUE(...) — return 0 (no filter context in eval)
  if (/^SELECTEDVALUE\s*\(/i.test(trimmed)) {
    return 0;
  }

  // 8. Try arithmetic with measure references: [A] + [B], [A] * [B], etc.
  const arithResult = tryArithmetic(trimmed, tables, rowFilters, preFilters, measureMap, evaluatedMeasures);
  if (arithResult !== null) return arithResult;

  return null;
}

/**
 * Try to match and evaluate aggregation patterns.
 */
function tryAggregation(
  expr: string,
  tables: DataTables,
  rowFilters: Record<string, string[]>,
  preFilters: FilterPred[],
  _measureMap: MeasureMap,
  _evaluatedMeasures: Set<string>,
): number | null {
  // Pattern: AGG_FN(Table[Column])
  // Where AGG_FN is SUM, AVERAGE, AVG, COUNT, MIN, MAX, DISTINCTCOUNT, SUMX, AVERAGEX, COUNTAX
  const aggMatch = expr.match(/^(SUMX?|AVERAGE|AVG|COUNT|MIN|MAX|DISTINCTCOUNT|COUNTAX|AVERAGEX)\s*\(\s*([^,]+?)(?:\s*,\s*(.+?))?\s*\)$/i);
  if (!aggMatch) return null;

  const fn = aggMatch[1].toUpperCase();
  let tableName: string;
  let columnName: string | null = null;
  const secondArg = aggMatch[3]?.trim();

  // Handle COUNTROWS-equivalent: COUNT(Table[Col]) has Table[Col]; COUNTAX(Table, TRUE()) uses TRUE
  if (aggMatch[2]) {
    const ref = parseColRef(aggMatch[2].trim());
    if (ref) {
      tableName = ref.table;
      columnName = ref.column;
    } else if (secondArg) {
      // Second pattern: SUMX(Table, Table[Col]) — col is in second arg
      tableName = aggMatch[2].trim();
      // Try to parse column from second arg
      const colRef = parseColRef(secondArg);
      if (colRef) {
        columnName = colRef.column;
        tableName = colRef.table; // Use table from column ref for consistency
      }
      // Handle COUNTAX(Table, TRUE()) — no column
    } else {
      // Table name only (for COUNTROWS-like patterns)
      tableName = aggMatch[2].trim().replace(/^'|'$/g, '');
    }
  } else {
    return null;
  }

  // Clean table name
  tableName = tableName.replace(/^'|'$/g, '').trim();

  const data = tables[tableName];
  if (!data || data.length === 0) return null;

  // Apply pre-filters (from CALCULATE/FILTER)
  let filtered = applyPrefilters(data, preFilters);

  // Apply row context filters (from chart category/slicer)
  filtered = applyRowFilters(filtered, rowFilters);

  if (filtered.length === 0) return 0;

  let fnUpper = fn;
  // Normalize: SUMX→SUM, AVERAGEX→AVERAGE, COUNTAX→COUNT, AVG→AVERAGE
  if (fnUpper === 'SUMX') fnUpper = 'SUM';
  else if (fnUpper === 'AVERAGEX' || fnUpper === 'AVG') fnUpper = 'AVERAGE';
  else if (fnUpper === 'COUNTAX') fnUpper = 'COUNT';

  switch (fnUpper) {
    case 'SUM': {
      if (!columnName || !(columnName in filtered[0])) return null;
      return filtered.reduce((sum: number, r: Row) => sum + (Number(r[columnName!]) || 0), 0);
    }
    case 'AVERAGE': {
      if (!columnName || !(columnName in filtered[0])) return null;
      const sum = filtered.reduce((s: number, r: Row) => s + (Number(r[columnName!]) || 0), 0);
      return filtered.length > 0 ? sum / filtered.length : 0;
    }
    case 'COUNT': {
      if (columnName && columnName in filtered[0]) {
        return filtered.filter(r => r[columnName!] != null).length;
      }
      return filtered.length;
    }
    case 'MIN': {
      if (!columnName || !(columnName in filtered[0])) return null;
      const vals = filtered.map(r => Number(r[columnName!])).filter(v => !isNaN(v));
      return vals.length > 0 ? Math.min(...vals) : null;
    }
    case 'MAX': {
      if (!columnName || !(columnName in filtered[0])) return null;
      const vals = filtered.map(r => Number(r[columnName!])).filter(v => !isNaN(v));
      return vals.length > 0 ? Math.max(...vals) : null;
    }
    case 'DISTINCTCOUNT': {
      if (!columnName || !(columnName in filtered[0])) return null;
      const distinct = new Set(filtered.map(r => r[columnName!]));
      return distinct.size;
    }
    default:
      return null;
  }
}

/**
 * Apply pre-filters from measure expression (e.g., FILTER(Table, Status = "Won")).
 */
function applyPrefilters(data: Row[], preFilters: FilterPred[]): Row[] {
  if (preFilters.length === 0) return data;
  return data.filter(row => {
    return preFilters.every(pf => {
      const val = row[pf.column];
      if (pf.operator === '=') return String(val) === pf.value;
      return true;
    });
  });
}

/**
 * Apply row context filters (from chart category/slicer).
 */
function applyRowFilters(data: Row[], rowFilters: Record<string, string[]>): Row[] {
  const entries = Object.entries(rowFilters);
  if (entries.length === 0) return data;
  return data.filter(row => {
    return entries.every(([col, vals]) => {
      if (!vals || vals.length === 0) return true;
      return vals.includes(String(row[col] ?? ''));
    });
  });
}

/**
 * Filter a table by preFilters + rowFilters and return row count.
 */
function filterAndCount(
  tableName: string,
  tables: DataTables,
  rowFilters: Record<string, string[]>,
  preFilters: FilterPred[],
): number {
  const data = tables[tableName];
  if (!data) return 0;
  let filtered = applyPrefilters(data, preFilters);
  filtered = applyRowFilters(filtered, rowFilters);
  return filtered.length;
}

/**
 * Try arithmetic expressions with measure references.
 * Handles: [A] + [B], [A] * [B], [A] / [B], ([A]+[B])/C, etc.
 */
function tryArithmetic(
  expr: string,
  tables: DataTables,
  rowFilters: Record<string, string[]>,
  _preFilters: FilterPred[],
  measureMap: MeasureMap,
  evaluatedMeasures: Set<string>,
): number | null {
  // Replace all [Measure Name] references with their evaluated values
  // First collect all measure references
  const refs: string[] = [];
  const refPattern = /\[([^\]]+)\]/g;
  let refMatch;
  while ((refMatch = refPattern.exec(expr)) !== null) {
    refs.push(refMatch[1]);
  }

  if (refs.length === 0) return null;

  // Build a map of measure name -> evaluated value
  const refValues: Map<string, number> = new Map();
  for (const refName of refs) {
    // Look up the measure expression
    let foundExpr: string | undefined;
    for (const [key, val] of measureMap) {
      if (key.endsWith(`.${refName}`)) {
        foundExpr = val;
        break;
      }
    }
    if (foundExpr && !evaluatedMeasures.has(refName)) {
      evaluatedMeasures.add(refName);
      const val = parseAndEvaluate(foundExpr, tables, rowFilters, measureMap, evaluatedMeasures);
      if (val !== null) refValues.set(refName, val);
    }
  }

  if (refValues.size === 0) return null;

  // Replace [Name] references with their values in the expression
  let numericalExpr = expr;
  for (const [name, val] of refValues) {
    numericalExpr = numericalExpr.replace(new RegExp(`\\[${escapeRegex(name)}\\]`, 'g'), `(${val})`);
  }

  // Also resolve SELECTEDVALUE(...) to 0
  numericalExpr = numericalExpr.replace(/SELECTEDVALUE\s*\([^)]+\)/gi, '0');

  // Try to evaluate as a JavaScript expression
  // Sanitize: remove non-numeric, non-operator chars
  const safe = numericalExpr
    .replace(/[^0-9\s+\-*/().,%]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!safe) return null;

  try {
    // eslint-disable-next-line no-new-func
    const result = new Function(`return (${safe});`)();
    return typeof result === 'number' && !isNaN(result) ? result : null;
  } catch {
    return null;
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Main entry point: evaluate a DAX measure expression against data.
 */
export function evaluateMeasure(
  expression: string,
  tableName: string,
  data: Row[],
  rowFilters: Record<string, string[]> = {},
  allMeasures: MeasureMap = new Map(),
): number | null {
  const tables: DataTables = {};
  tables[tableName] = data;

  // Also provide other tables if available — needed for measure refs across tables
  // The caller passes allData in practice

  return parseAndEvaluate(expression, tables, rowFilters, allMeasures, new Set());
}

// ---- IR-based helpers ----

/**
 * Build a measure map from the IR measures array.
 * Call once at module init or in a visual component.
 */
export function buildMeasureMap(
  measures: Array<{ table: string; name: string; expression: string }>
): Map<string, string> {
  const map = new Map<string, string>();
  for (const m of measures) {
    map.set(`${m.table}.${m.name}`, m.expression);
  }
  return map;
}

/**
 * Resolve a visual field to a measure expression, then evaluate it.
 * Returns null if the field doesn't reference a known measure.
 */
export function evaluateField(
  field: { table: string; column: string; aggregation?: string | null },
  allData: Record<string, any[]>,
  rowFilters: Record<string, string[]> = {},
  measureMap: Map<string, string> = new Map(),
): number | null {
  const key = `${field.table}.${field.column}`;
  const expr = measureMap.get(key);
  if (!expr) return null;

  const data = allData[field.table];
  if (!data || data.length === 0) return null;

  return evaluateMeasure(expr, field.table, data, rowFilters, measureMap);
}
