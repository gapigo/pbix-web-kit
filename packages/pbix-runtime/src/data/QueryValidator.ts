import type { QueryEngine } from "./QueryEngine"

export interface QueryIssue {
  severity: "error" | "warning"
  table: string
  column?: string
  message: string
  suggestion: string
}

export async function runQueryValidator(engine: QueryEngine): Promise<QueryIssue[]> {
  const issues: QueryIssue[] = []

  // 1. Verifica se tabelas principais existem e têm dados
  const requiredTables = [
    "v_opportunities",
    "Products",
    "Territories",
    "Owners",
    "Industries",
    "Accounts",
  ]
  for (const table of requiredTables) {
    try {
      const rows = await engine.raw(`SELECT COUNT(*) as n FROM "${table}"`)
      if (rows[0].n === 0) {
        issues.push({
          severity: "error",
          table,
          message: `Tabela ${table} está vazia`,
          suggestion:
            "Verifique se o parquet foi carregado e se o JOIN na v_opportunities está correto",
        })
      }
    } catch (e) {
      issues.push({
        severity: "error",
        table,
        message: `Tabela ${table} não existe: ${e}`,
        suggestion: "Verifique o registerTables no boot.tsx",
      })
    }
  }

  // 2. Verifica colunas críticas da v_opportunities
  const criticalColumns = [
    "Territory",
    "Product",
    "Owner",
    "Manager",
    "Industry",
    "Sales Stage",
    "Value",
    "CloseDate",
  ]
  try {
    const sample = await engine.raw("SELECT * FROM v_opportunities LIMIT 1")
    if (sample.length > 0) {
      for (const col of criticalColumns) {
        if (!(col in sample[0])) {
          issues.push({
            severity: "error",
            table: "v_opportunities",
            column: col,
            message: `Coluna "${col}" não existe na v_opportunities`,
            suggestion: `Verifique o CREATE VIEW no boot.tsx. Colunas disponíveis: ${Object.keys(sample[0]).join(", ")}`,
          })
        }
      }
    }
  } catch (e) {
    issues.push({
      severity: "error",
      table: "v_opportunities",
      message: `Erro ao inspecionar v_opportunities: ${e}`,
      suggestion: "Verifique o CREATE VIEW no boot.tsx",
    })
  }

  // 3. Detecta percentuais impossíveis (Close % > 100% indica cálculo errado)
  try {
    const closeRates = await engine.raw(`
      SELECT Territory,
             COUNT(CASE WHEN "Sales Stage" = '4-Close' THEN 1 END) * 100.0 / COUNT(*) as close_pct
      FROM v_opportunities GROUP BY Territory
    `)
    for (const row of closeRates) {
      if (row.close_pct > 100) {
        issues.push({
          severity: "warning",
          table: "v_opportunities",
          column: "Sales Stage",
          message: `Close % de ${row.Territory} é ${row.close_pct.toFixed(1)}% — impossível`,
          suggestion:
            "Close % = Won / Total, não Won / Lost. Verifique o cálculo nas páginas.",
        })
      }
    }
  } catch {
    // query may fail, skip
  }

  // 4. Detecta timestamps como string (causa labels ISO feios no eixo X)
  try {
    const sample = await engine.raw("SELECT CloseDate FROM v_opportunities LIMIT 1")
    if (sample.length > 0) {
      const val = sample[0].CloseDate
      if (typeof val === "string" && val.includes("T")) {
        issues.push({
          severity: "warning",
          table: "v_opportunities",
          column: "CloseDate",
          message: `CloseDate é string ISO (${val}) em vez de Date`,
          suggestion:
            "No eixo X dos charts de linha, use: tickFormatter={(v) => format(new Date(v), 'MMM yy')}",
        })
      }
    }
  } catch {
    // skip
  }

  // 5. Detecta valores monetários sem formatação no eixo X
  try {
    const sample = await engine.raw("SELECT Value FROM v_opportunities LIMIT 1")
    if (sample.length > 0 && typeof sample[0].Value === "number") {
      issues.push({
        severity: "warning",
        table: "v_opportunities",
        column: "Value",
        message: "Coluna Value é numérica — eixos Y de charts podem mostrar números crus sem formatação $",
        suggestion:
          "Use tickFormatter={(v) => formatCurrency(v)} em todos os eixos Y que mostram receita",
      })
    }
  } catch {
    // skip
  }

  // 6. Expõe no window para debug via browser_evaluate
  if (typeof window !== "undefined") {
    ;(window as any).__query_issues__ = issues
  }

  return issues
}
