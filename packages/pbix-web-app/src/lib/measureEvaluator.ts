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

/** Normalize a name for tolerant lookup: lowercase + remove spaces/underscores/dashes. */
function normName(s: string): string {
  return (s ?? "").toLowerCase().replace(/[\s_\-]+/g, "");
}

/** Look up a table tolerantly (handles sanitized names like "Foo_Bar" vs "Foo Bar"). */
function lookupTable(tables: DataTables, name: string): Row[] | undefined {
  if (!name) return undefined;
  if (tables[name]) return tables[name];
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(tables)) {
    if (k.toLowerCase() === lower) return v;
  }
  const target = normName(name);
  for (const [k, v] of Object.entries(tables)) {
    if (normName(k) === target) return v;
  }
  return undefined;
}

/** Look up a column name in a row tolerantly. */
function lookupColumn(row: Row | undefined, name: string): string | null {
  if (!row || !name) return null;
  if (name in row) return name;
  const lower = name.toLowerCase();
  for (const k of Object.keys(row)) {
    if (k.toLowerCase() === lower) return k;
  }
  const target = normName(name);
  for (const k of Object.keys(row)) {
    if (normName(k) === target) return k;
  }
  return null;
}

/** Extract table + column from a `Table[Column]` or `'Table'[Column]` reference. */
function parseColRef(s: string): { table: string; column: string } | null {
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

  const noComments = trimmed.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();

  const calcMatch = noComments.match(/^CALCULATE\s*\(([\s\S]*)\)$/i);
  let innerExpr: string;
  let preFilters: FilterPred[] = [];

  if (calcMatch) {
    const inner = calcMatch[1];
    const parts = splitCalculateArgs(inner);
    innerExpr = parts.inner;
    preFilters = parts.filters;
  } else {
    innerExpr = noComments;
  }

  const result = resolveToValue(innerExpr, tables, rowFilters, preFilters, measureMap, evaluatedMeasures);
  return result;
}

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

  const filters: FilterPred[] = [];
  const filterMatches = rest.matchAll(/FILTER\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi);
  for (const fm of filterMatches) {
    const filterCond = fm[2].trim();
    const predMatch = filterCond.match(/^(?:'?[^'\[\]]+'?)\[([^\]]+)\]\s*=\s*"([^"]*)"$/);
    if (predMatch) {
      filters.push({ column: predMatch[1], operator: '=', value: predMatch[2] });
    }
  }

  return { inner: firstArg, filters };
}

function resolveToValue(
  expr: string,
  tables: DataTables,
  rowFilters: Record<string, string[]>,
  preFilters: FilterPred[],
  measureMap: MeasureMap,
  evaluatedMeasures: Set<string>,
): number | null {
  const trimmed = expr.trim();
  const numVal = Number(trimmed);
  if (!isNaN(numVal)) return numVal;

  const aggResult = tryAggregation(trimmed, tables, rowFilters, preFilters, measureMap, evaluatedMeasures);
  if (aggResult !== null) return aggResult;

  const crMatch = trimmed.match(/^COUNTROWS\s*\(\s*'?([^'")\]\[}]+)'?\s*\)$/i);
  if (crMatch) {
    const tableName = crMatch[1].trim();
    return filterAndCount(tableName, tables, rowFilters, preFilters);
  }

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

  if (/^SELECTEDVALUE\s*\(/i.test(trimmed)) {
    return 0;
  }

  const arithResult = tryArithmetic(trimmed, tables, rowFilters, preFilters, measureMap, evaluatedMeasures);
  if (arithResult !== null) return arithResult;

  return null;
}

function tryAggregation(
  expr: string,
  tables: DataTables,
  rowFilters: Record<string, string[]>,
  preFilters: FilterPred[],
  _measureMap: MeasureMap,
  _evaluatedMeasures: Set<string>,
): number | null {
  const aggMatch = expr.match(/^(SUMX?|AVERAGE|AVG|COUNT|MIN|MAX|DISTINCTCOUNT|COUNTAX|AVERAGEX)\s*\(\s*([^,]+?)(?:\s*,\s*(.+?))?\s*\)$/i);
  if (!aggMatch) return null;

  const fn = aggMatch[1].toUpperCase();
  let tableName: string;
  let columnName: string | null = null;
  const secondArg = aggMatch[3]?.trim();

  if (aggMatch[2]) {
    const ref = parseColRef(aggMatch[2].trim());
    if (ref) {
      tableName = ref.table;
      columnName = ref.column;
    } else if (secondArg) {
      tableName = aggMatch[2].trim();
      const colRef = parseColRef(secondArg);
      if (colRef) {
        columnName = colRef.column;
        tableName = colRef.table;
      }
    } else {
      tableName = aggMatch[2].trim().replace(/^'|'$/g, '');
    }
  } else {
    return null;
  }

  tableName = tableName.replace(/^'|'$/g, '').trim();

  // TOLERANT LOOKUP: handles "Sales Data" vs "Sales_Data"
  const data = lookupTable(tables, tableName);
  if (!data || data.length === 0) return null;

  let filtered = applyPrefilters(data, preFilters);

  filtered = applyRowFilters(filtered, rowFilters);

  if (filtered.length === 0) return 0;

  // TOLERANT COLUMN LOOKUP
  const realCol = columnName ? lookupColumn(filtered[0], columnName) : null;

  let fnUpper = fn;
  if (fnUpper === 'SUMX') fnUpper = 'SUM';
  else if (fnUpper === 'AVERAGEX' || fnUpper === 'AVG') fnUpper = 'AVERAGE';
  else if (fnUpper === 'COUNTAX') fnUpper = 'COUNT';

  switch (fnUpper) {
    case 'SUM': {
      if (!realCol) return null;
      return filtered.reduce((sum: number, r: Row) => sum + (Number(r[realCol]) || 0), 0);
    }
    case 'AVERAGE': {
      if (!realCol) return null;
      const sum = filtered.reduce((s: number, r: Row) => s + (Number(r[realCol]) || 0), 0);
      return filtered.length > 0 ? sum / filtered.length : 0;
    }
    case 'COUNT': {
      if (realCol) {
        return filtered.filter(r => r[realCol] != null).length;
      }
      return filtered.length;
    }
    case 'MIN': {
      if (!realCol) return null;
      const vals = filtered.map(r => Number(r[realCol])).filter(v => !isNaN(v));
      return vals.length > 0 ? Math.min(...vals) : null;
    }
    case 'MAX': {
      if (!realCol) return null;
      const vals = filtered.map(r => Number(r[realCol])).filter(v => !isNaN(v));
      return vals.length > 0 ? Math.max(...vals) : null;
    }
    case 'DISTINCTCOUNT': {
      if (!realCol) return null;
      const distinct = new Set(filtered.map(r => r[realCol]));
      return distinct.size;
    }
    default:
      return null;
  }
}

function applyPrefilters(data: Row[], preFilters: FilterPred[]): Row[] {
  if (preFilters.length === 0) return data;
  return data.filter(row => {
    return preFilters.every(pf => {
      const realCol = lookupColumn(row, pf.column);
      if (!realCol) return true; // column not in this table = passthrough
      const val = row[realCol];
      if (pf.operator === '=') return String(val) === pf.value;
      return true;
    });
  });
}

/**
 * Apply row context filters (from chart category / table row / slicer).
 *
 * CROSS-TABLE PASSTHROUGH: if the filter column is not in the data table,
 * pass through. This is the "wrong" behavior for full DAX (which would
 * traverse relationships), but it's the closest heuristic without implementing
 * a relationship walker. Most cases work because the fact table has
 * denormalized FK columns.
 */
function applyRowFilters(data: Row[], rowFilters: Record<string, string[]>): Row[] {
  const entries = Object.entries(rowFilters);
  if (entries.length === 0) return data;
  return data.filter(row => {
    return entries.every(([col, vals]) => {
      if (!vals || vals.length === 0) return true;
      const realCol = lookupColumn(row, col);
      if (!realCol) return true; // CROSS-TABLE PASSTHROUGH
      return vals.includes(String(row[realCol] ?? ''));
    });
  });
}

function filterAndCount(
  tableName: string,
  tables: DataTables,
  rowFilters: Record<string, string[]>,
  preFilters: FilterPred[],
): number {
  const data = lookupTable(tables, tableName);
  if (!data) return 0;
  let filtered = applyPrefilters(data, preFilters);
  filtered = applyRowFilters(filtered, rowFilters);
  return filtered.length;
}

function tryArithmetic(
  expr: string,
  tables: DataTables,
  rowFilters: Record<string, string[]>,
  _preFilters: FilterPred[],
  measureMap: MeasureMap,
  evaluatedMeasures: Set<string>,
): number | null {
  const refs: string[] = [];
  const refPattern = /\[([^\]]+)\]/g;
  let refMatch;
  while ((refMatch = refPattern.exec(expr)) !== null) {
    refs.push(refMatch[1]);
  }

  if (refs.length === 0) return null;

  const refValues: Map<string, number> = new Map();
  for (const refName of refs) {
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

  let numericalExpr = expr;
  for (const [name, val] of refValues) {
    numericalExpr = numericalExpr.replace(new RegExp(`\\[${escapeRegex(name)}\\]`, 'g'), `(${val})`);
  }

  numericalExpr = numericalExpr.replace(/SELECTEDVALUE\s*\([^)]+\)/gi, '0');

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
  return parseAndEvaluate(expression, tables, rowFilters, allMeasures, new Set());
}

// ---- IR-based helpers ----

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
 *
 * NOTE: now passes ALL tables to the evaluator (not just the field's table),
 * so cross-table refs in measure expressions can resolve.
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

  // Pass ALL tables (not just field.table) so cross-table refs in the measure resolve.
  return parseAndEvaluate(expr, allData, rowFilters, measureMap, new Set());
}
