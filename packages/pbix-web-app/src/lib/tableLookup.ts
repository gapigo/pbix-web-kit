/**
 * tableLookup.ts
 *
 * Lookup tolerante para nomes de tabela e coluna.
 * O parser pode sanitizar nomes (espacos -> underscores, caracteres especiais removidos),
 * entao o IR pode dizer "Opportunity Forecast Adjustment" mas o data key armazenado
 * em memoria pode ser "Opportunity_Forecast_Adjustment" ou similar.
 *
 * Estas funcoes resolvem isso comparando de forma tolerante.
 */

/** Normaliza removendo espacos, underscores, dashes e fazendo lowercase. */
function norm(s: string): string {
  return (s ?? "").toLowerCase().replace(/[\s_\-]+/g, "");
}

/**
 * Retorna os dados de uma tabela tolerando variacoes de nome.
 * Tenta: match exato -> case-insensitive -> normalizado.
 */
export function getTable(
  data: Record<string, any[]>,
  tableName: string,
): any[] | undefined {
  if (!tableName) return undefined;
  if (data[tableName]) return data[tableName];
  const lower = tableName.toLowerCase();
  for (const [k, v] of Object.entries(data)) {
    if (k.toLowerCase() === lower) return v;
  }
  const target = norm(tableName);
  for (const [k, v] of Object.entries(data)) {
    if (norm(k) === target) return v;
  }
  return undefined;
}

/**
 * Retorna o nome real da coluna em uma linha, tolerando variacoes.
 * Util quando o IR diz "Revenue Won" mas o dado tem "Revenue_Won" ou "revenueWon".
 */
export function resolveColumn(
  row: Record<string, any> | undefined,
  columnName: string,
): string | null {
  if (!row || !columnName) return null;
  if (columnName in row) return columnName;
  const lower = columnName.toLowerCase();
  for (const k of Object.keys(row)) {
    if (k.toLowerCase() === lower) return k;
  }
  const target = norm(columnName);
  for (const k of Object.keys(row)) {
    if (norm(k) === target) return k;
  }
  return null;
}

/**
 * Le o valor de uma coluna em uma linha, tolerando variacoes de nome.
 */
export function getCell(
  row: Record<string, any> | undefined,
  columnName: string,
): any {
  const col = resolveColumn(row, columnName);
  return col ? row![col] : undefined;
}
