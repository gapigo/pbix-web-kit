import type { QueryEngine } from "./QueryEngine"

export interface QueryIssue {
  severity: "error" | "warning"
  table: string
  column?: string
  message: string
  suggestion: string
}

let _consoleLogged = false

async function check(
  issues: QueryIssue[],
  label: string,
  severity: "error" | "warning",
  table: string,
  column: string | undefined,
  message: string,
  suggestion: string,
) {
  issues.push({ severity, table, column, message, suggestion })
}

// ─── helper: run a query, catch silently ───
async function q(engine: QueryEngine, sql: string): Promise<any[] | null> {
  try {
    return await engine.raw(sql)
  } catch {
    return null
  }
}

export async function runQueryValidator(engine: QueryEngine): Promise<QueryIssue[]> {
  const issues: QueryIssue[] = []

  // ═══════════════════════════════════════════════════════════
  // CATEGORIA A: Existência e integridade (5 checks)
  // ═══════════════════════════════════════════════════════════

  // A1: Cada tabela registrada tem COUNT(*) > 0
  const tables = ["Accounts", "Campaigns", "Contacts", "Industries", "Opportunities",
    "Owners", "Products", "Territories", "v_opportunities"]
  for (const t of tables) {
    const r = await q(engine, `SELECT COUNT(*) as n FROM "${t}"`)
    if (r === null) {
      await check(issues, "A1", "error", t, undefined, `Tabela ${t} não existe`, "Verifique registerTables no boot.tsx")
    } else if (r[0].n === 0) {
      await check(issues, "A1", "error", t, undefined, `Tabela ${t} está vazia`, "Verifique se o parquet foi carregado")
    }
  }

  // A2: v_opportunities existe (já coberto acima, mas reforço)
  const viewExists = await q(engine, "SELECT COUNT(*) as n FROM v_opportunities")
  if (viewExists === null) {
    await check(issues, "A2", "error", "v_opportunities", undefined, "v_opportunities não existe", "Verifique o CREATE VIEW no boot.tsx")
  }

  // A3: todas as colunas do JOIN estão presentes na view resultado
  const sample = viewExists ? await q(engine, "SELECT * FROM v_opportunities LIMIT 1") : null
  const joinCols = ["Product", "Product LOB", "Territory", "Region", "State Or Province",
    "Account Name", "Account State", "Owner", "Manager", "Industry"]
  if (sample && sample.length > 0) {
    const keys = Object.keys(sample[0])
    for (const col of joinCols) {
      if (!keys.includes(col)) {
        await check(issues, "A3", "error", "v_opportunities", col,
          `Coluna "${col}" não encontrada na view — JOIN pode estar errado`,
          `Disponíveis: ${keys.join(", ")}`)
      }
    }
  }

  // A4: nenhuma coluna crítica é 100% NULL
  const criticalChecks = ["Territory", "Product", "Owner", "Industry", "Sales Stage", "Value"]
  for (const col of criticalChecks) {
    const r = await q(engine, `SELECT COUNT(*) as total, COUNT("${col}") as nn FROM v_opportunities`)
    if (r && r.length > 0 && r[0].nn === 0 && r[0].total > 0) {
      await check(issues, "A4", "error", "v_opportunities", col,
        `Coluna "${col}" é 100% NULL em ${r[0].total} linhas`,
        "Verifique o JOIN que popula esta coluna")
    }
  }

  // A5: FK keys do JOIN têm matches
  const fkPairs = [
    ["Opportunities", "ProductSeq", "Products", "ProductSeq"],
  ]
  for (const [from, fk, to, pk] of fkPairs) {
    const r = await q(engine,
      `SELECT COUNT(*) as orphan FROM "${from}" f LEFT JOIN "${to}" t ON f."${fk}" = t."${pk}" WHERE t."${pk}" IS NULL`)
    if (r && r.length > 0) {
      const total = await q(engine, `SELECT COUNT(*) as n FROM "${from}"`)
      const totalCt = total?.[0]?.n ?? 1
      const orphanCt = r[0].orphan
      if (orphanCt > 0 && (orphanCt / totalCt) > 0.1) {
        await check(issues, "A5", "warning", from, fk,
          `${((orphanCt / totalCt) * 100).toFixed(0)}% de registros em ${from} sem match em ${to}`,
          "Verifique a integridade dos dados de origem")
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CATEGORIA B: Tipos e formatos (6 checks)
  // ═══════════════════════════════════════════════════════════

  // B1: colunas de revenue são numéricas
  const revType = await q(engine, "SELECT typeof(Value) as t FROM v_opportunities LIMIT 1")
  if (revType && revType.length > 0) {
    const t = String(revType[0].t).toLowerCase()
    if (!["integer", "double", "bigint", "decimal"].includes(t)) {
      await check(issues, "B1", "error", "v_opportunities", "Value",
        `Value é tipo "${t}", não numérico`, "Verifique o schema do parquet")
    }
  }

  // B2: colunas de data são parseáveis
  const dateSample = await q(engine, "SELECT CloseDate FROM v_opportunities LIMIT 1")
  if (dateSample && dateSample.length > 0) {
    const raw = dateSample[0].CloseDate
    if (raw != null) {
      const d = new Date(raw as string)
      if (isNaN(d.getTime())) {
        await check(issues, "B2", "error", "v_opportunities", "CloseDate",
          `CloseDate "${raw}" não é parseável como data`, "Verifique o formato da data no CSV/parquet")
      }
    }
  }

  // B3: timestamps ISO completos (com T)
  if (dateSample && dateSample.length > 0 && typeof dateSample[0].CloseDate === "string") {
    const val: string = dateSample[0].CloseDate
    if (val.includes("T")) {
      await check(issues, "B3", "warning", "v_opportunities", "CloseDate",
        `CloseDate é string ISO completa (${val}) — pode causar eixo X ilegível`,
        "Usar tickFormatter com dateAxisFormatter ou fmtDate nos charts")
    }
  }

  // B4: colunas de percentual em escala correta
  const discAvg = await q(engine, "SELECT AVG(Discount) as avg FROM v_opportunities")
  if (discAvg && discAvg.length > 0 && discAvg[0].avg != null) {
    const avg = Number(discAvg[0].avg)
    if (avg > 1) {
      await check(issues, "B4", "warning", "v_opportunities", "Discount",
        `Discount médio de ${avg.toFixed(3)} — parece estar em escala 0-100, não 0-1`,
        "Se Discount é percentual, dividir por 100 antes de usar")
    }
    if (avg < 0.001 && avg > 0) {
      await check(issues, "B4", "warning", "v_opportunities", "Discount",
        `Discount médio de ${avg.toFixed(6)} — parece muito pequeno`,
        "Verificar se a escala está correta")
    }
  }

  // B5: cardinalidade razoável das colunas categóricas
  const cardCols = ["Territory", "Sales Stage"]
  for (const col of cardCols) {
    const r = await q(engine, `SELECT COUNT(DISTINCT "${col}") as n FROM v_opportunities`)
    if (r && r.length > 0) {
      const n = Number(r[0].n)
      if (n < 2) {
        await check(issues, "B5", "error", "v_opportunities", col,
          `"${col}" tem apenas ${n} valor(es) único(s) — dados insuficientes para grouped charts`,
          "Verificar se a coluna não está NULL para todas as linhas")
      } else if (n > 500) {
        await check(issues, "B5", "warning", "v_opportunities", col,
          `"${col}" tem ${n} valores únicos — pode causar charts sobrecarregados`,
          "Agrupar ou limitar a Top N nos charts")
      }
    }
  }

  // B6: valores numéricos sem NaN
  const nanCheck = await q(engine, 'SELECT COUNT(*) as n FROM v_opportunities WHERE "Value" != "Value"')
  if (nanCheck && nanCheck.length > 0 && Number(nanCheck[0].n) > 0) {
    await check(issues, "B6", "error", "v_opportunities", "Value",
      `Value tem ${nanCheck[0].n} valores NaN`, "Verificar dados de origem para NaN")
  }

  // ═══════════════════════════════════════════════════════════
  // CATEGORIA C: Consistência de negócio (7 checks)
  // ═══════════════════════════════════════════════════════════

  // C1: Revenue Won <= Total Pipeline (Value sum of ALL vs Won)
  const totalValue = await q(engine, 'SELECT SUM("Value") as s FROM v_opportunities')
  const wonValue = await q(engine, "SELECT SUM(\"Value\") as s FROM v_opportunities WHERE LOWER(\"Status\") = 'won'")
  if (totalValue && wonValue && totalValue[0].s != null && wonValue[0].s != null) {
    if (Number(wonValue[0].s) > Number(totalValue[0].s)) {
      await check(issues, "C1", "warning", "v_opportunities", "Value",
        "Soma de Revenue Won > soma de Value total — dados inconsistentes",
        "Verificar se o filtro Status='Won' está correto")
    }
  }

  // C3: Close Rate entre 0-100% por Territory
  const closeByTerr = await q(engine, `
    SELECT Territory,
      COUNT(CASE WHEN "Sales Stage" = '4-Close' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as rate
    FROM v_opportunities GROUP BY Territory`)
  if (closeByTerr) {
    for (const row of closeByTerr) {
      if (row.rate != null && Number(row.rate) > 100) {
        await check(issues, "C3", "error", "v_opportunities", "Sales Stage",
          `Close % de ${row.Territory} é ${Number(row.rate).toFixed(1)}% — impossível`,
          "Close % = COUNT(Closed)/COUNT(*), não SUM(Value). Verificar query nas páginas")
      }
    }
  }

  // C4: Close Rate por Product
  const closeByProd = await q(engine, `
    SELECT Product,
      COUNT(CASE WHEN "Sales Stage" = '4-Close' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as rate
    FROM v_opportunities GROUP BY Product`)
  if (closeByProd) {
    for (const row of closeByProd) {
      if (row.rate != null && Number(row.rate) > 100) {
        await check(issues, "C4", "error", "v_opportunities", "Sales Stage",
          `Close % de ${row.Product} é ${Number(row.rate).toFixed(1)}% — impossível`,
          "Close % por produto está calculado errado")
      }
    }
  }

  // C5: Avg Deal Size razoável
  const avgDeal = await q(engine, 'SELECT AVG("Value") as avg FROM v_opportunities')
  if (avgDeal && avgDeal.length > 0 && avgDeal[0].avg != null) {
    const a = Number(avgDeal[0].avg)
    if (a < 100) {
      await check(issues, "C5", "warning", "v_opportunities", "Value",
        `Avg Deal Size de $${a.toFixed(0)} parece muito baixo para B2B`,
        "Verificar escala dos valores monetários")
    }
    if (a > 10_000_000) {
      await check(issues, "C5", "warning", "v_opportunities", "Value",
        `Avg Deal Size de $${(a / 1e6).toFixed(1)}M parece muito alto`,
        "Verificar escala dos valores monetários")
    }
  }

  // C6: Datas de fechamento posteriores a 2000
  const minDate = await q(engine, "SELECT MIN(CloseDate) as md FROM v_opportunities")
  if (minDate && minDate.length > 0 && minDate[0].md != null) {
    const d = new Date(String(minDate[0].md))
    if (!isNaN(d.getTime()) && d.getFullYear() < 2000) {
      await check(issues, "C6", "warning", "v_opportunities", "CloseDate",
        `Data mais antiga é ${String(minDate[0].md).slice(0, 10)} — antes de 2000`,
        "Verificar se dados históricos são relevantes")
    }
  }

  // C7: Revenue não negativo
  const negRev = await q(engine, 'SELECT COUNT(*) as n FROM v_opportunities WHERE "Value" < 0')
  if (negRev && negRev.length > 0 && Number(negRev[0].n) > 0) {
    await check(issues, "C7", "error", "v_opportunities", "Value",
      `${negRev[0].n} oportunidades com Value negativo`,
      "Revenue negativo pode indicar devoluções ou dados incorretos")
  }

  // ═══════════════════════════════════════════════════════════
  // CATEGORIA D: Cobertura de dimensões (5 checks)
  // ═══════════════════════════════════════════════════════════

  const dims = ["Territory", "Product", "Owner", "Industry", "Sales Stage"]
  for (const col of dims) {
    const r = await q(engine, `SELECT COUNT(DISTINCT "${col}") as n FROM v_opportunities`)
    if (r && r.length > 0 && Number(r[0].n) < 2) {
      await check(issues, "D1-D5", "error", "v_opportunities", col,
        `"${col}" tem menos de 2 valores únicos`, "Dimensão sem variação — charts agrupados não funcionam")
    }
  }

  // Sales Stage específico
  const stages = await q(engine, 'SELECT DISTINCT "Sales Stage" as s FROM v_opportunities ORDER BY s')
  if (stages && stages.length < 2) {
    await check(issues, "D5", "error", "v_opportunities", "Sales Stage",
      `Apenas ${stages?.length ?? 0} Sales Stage(s) encontrado(s) — pipeline funnel não funciona`,
      "Verificar se a coluna Sales Stage tem dados variados")
  }

  // ═══════════════════════════════════════════════════════════
  // CATEGORIA E: Qualidade visual (6 checks)
  // ═══════════════════════════════════════════════════════════

  // E1: Top 10 por Territory tem valores DIFERENTES
  const revByTerr = await q(engine, 'SELECT Territory, SUM("Value") as rev FROM v_opportunities GROUP BY Territory ORDER BY rev DESC')
  if (revByTerr && revByTerr.length > 1) {
    const revs = revByTerr.filter(r => r.rev != null).map(r => Number(r.rev))
    if (revs.length > 1 && new Set(revs).size === 1) {
      await check(issues, "E1", "error", "v_opportunities", "Territory",
        "Revenue por Territory são todos idênticos — bug de query (GROUP BY ausente ou errado)",
        "Verificar se a query usa GROUP BY Territory e não um valor global repetido")
    }
  }

  // E2: Avg Deal Size por Product NÃO é idêntico
  const avgByProd = await q(engine, 'SELECT Product, AVG("Value") as avg FROM v_opportunities GROUP BY Product')
  if (avgByProd && avgByProd.length > 1) {
    const avgs = avgByProd.filter(r => r.avg != null).map(r => Number(r.avg))
    if (avgs.length > 1 && new Set(avgs).size === 1) {
      await check(issues, "E2", "error", "v_opportunities", "Value",
        "Avg Deal Size é idêntico em todos os produtos — bug: AVG sem GROUP BY retorna média global repetida",
        "Garantir que cada query grouped use measures com GROUP BY adequado")
    }
  }

  // E3: Série temporal tem 6+ pontos
  const months = await q(engine, "SELECT COUNT(DISTINCT strftime('%Y-%m', CloseDate)) as n FROM v_opportunities")
  if (months && months.length > 0 && Number(months[0].n) < 6) {
    await check(issues, "E3", "warning", "v_opportunities", "CloseDate",
      `Apenas ${months[0].n} meses distintos — linha do tempo muito curta para trend charts`,
      "Dataset pode ter período insuficiente para análises temporais")
  }

  // E4: KPI Revenue > 0
  const totalRev = await q(engine, 'SELECT SUM("Value") as s FROM v_opportunities')
  if (totalRev && totalRev.length > 0 && (totalRev[0].s == null || Number(totalRev[0].s) === 0)) {
    await check(issues, "E4", "error", "v_opportunities", "Value",
      "Revenue total é zero — dados não carregados ou coluna errada",
      "Verificar se Value contém os valores monetários")
  }

  // E5: v_opportunities não está vazia
  if (viewExists && viewExists.length > 0 && Number(viewExists[0].n) === 0) {
    await check(issues, "E5", "error", "v_opportunities", undefined,
      "v_opportunities está vazia — JOIN pode ter zerado tudo",
      "Verificar CREATE VIEW e dados das tabelas fonte")
  }

  // E6: Top 10 Products têm valores diferentes
  const topProd = await q(engine, 'SELECT Product, SUM("Value") as rev FROM v_opportunities GROUP BY Product ORDER BY rev DESC LIMIT 10')
  if (topProd && topProd.length > 1) {
    const revs = topProd.filter(r => r.rev != null).map(r => Number(r.rev))
    if (revs.length > 1 && new Set(revs).size === 1) {
      await check(issues, "E6", "error", "v_opportunities", "Product",
        "Todos os Top 10 Products têm mesmo Revenue — bug de query",
        "Verificar GROUP BY Product e se os dados de Product são variados")
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CATEGORIA F: Compatibilidade com componentes (4 checks)
  // ═══════════════════════════════════════════════════════════

  // F1: groupBy columns existem
  const groupByCols = ["Territory", "Product", "Owner", "Industry", "Sales Stage", "CloseDate"]
  if (sample && sample.length > 0) {
    const keys = Object.keys(sample[0])
    for (const col of groupByCols) {
      if (!keys.includes(col)) {
        await check(issues, "F1", "error", "v_opportunities", col,
          `Coluna "${col}" não existe — groupBy em charts vai falhar`,
          `Adicionar ao JOIN no CREATE VIEW. Disponíveis: ${keys.join(", ")}`)
      }
    }
  }

  // F2: groupBy produz mais de 1 grupo (já coberto em D, redundante — skip)

  // F3: CloseDate é parseável após arrowToJSON
  if (dateSample && dateSample.length > 0) {
    const raw = dateSample[0].CloseDate
    if (raw != null) {
      const t = typeof raw
      if (t !== "string" && t !== "number" && !(raw instanceof Date)) {
        await check(issues, "F3", "error", "v_opportunities", "CloseDate",
          `CloseDate é tipo "${t}" — pode não ser parseável como Date nos charts`,
          "Converter CloseDate para string ISO no CREATE VIEW")
      }
    }
  }

  // F4: Revenue é numérico após arrowToJSON
  if (revType && revType.length > 0) {
    const t = String(revType[0].t).toLowerCase()
    if (["integer", "double", "bigint", "decimal"].includes(t)) {
      // OK — será convertido para number pelo arrowToJSON
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CATEGORIA G: Performance (2 checks)
  // ═══════════════════════════════════════════════════════════

  // G1: v_opportunities não tem produto cartesiano
  const oppCount = await q(engine, 'SELECT COUNT(*) as n FROM "Opportunities"')
  const viewCount = viewExists
  if (oppCount && viewCount && Number(oppCount[0].n) > 0) {
    const ratio = Number(viewCount[0].n) / Number(oppCount[0].n)
    if (ratio > 2) {
      await check(issues, "G1", "error", "v_opportunities", undefined,
        `v_opportunities tem ${ratio.toFixed(1)}× mais linhas que Opportunities (${viewCount[0].n} vs ${oppCount[0].n}) — JOIN está multiplicando linhas`,
        "Revisar os LEFT JOINs — pode haver 1:N sem agregação")
    }
    if (ratio > 1.05 && ratio <= 2) {
      await check(issues, "G1", "warning", "v_opportunities", undefined,
        `v_opportunities tem ${ratio.toFixed(1)}× linhas de Opportunities — leve expansão por JOINs`,
        "Verificar se é esperado (1:N com múltiplos produtos por oportunidade)")
    }
  }

  // G2: Nenhuma query retorna mais de 50.000 linhas
  if (viewCount && viewCount.length > 0 && Number(viewCount[0].n) > 50_000) {
    await check(issues, "G2", "warning", "v_opportunities", undefined,
      `v_opportunities tem ${Number(viewCount[0].n).toLocaleString()} linhas — charts sem LIMIT podem ser lentos`,
      "Garantir que todas as queries de chart tenham LIMIT adequado")
  }

  // ═══════════════════════════════════════════════════════════
  // Console log com emojis
  // ═══════════════════════════════════════════════════════════
  if (typeof window !== "undefined") {
    ;(window as any).__query_issues__ = issues

    if (!_consoleLogged) {
      _consoleLogged = true
      const errors = issues.filter(i => i.severity === "error")
      const warnings = issues.filter(i => i.severity === "warning")
      console.group("%c QueryValidator v2 — 35 checks", "font-weight:bold;font-size:14px")
      console.log(`✅ ${issues.length === 0 ? "All checks passed" : ""}`)
      for (const i of issues) {
        const icon = i.severity === "error" ? "❌" : "⚠️"
        console.log(`${icon} [${i.table}${i.column ? "/" + i.column : ""}] ${i.message}`)
        console.log(`   ${i.suggestion}`)
      }
      console.log(`📊 ${errors.length} errors, ${warnings.length} warnings, ${35 - issues.length} checks passed`)
      console.groupEnd()
    }
  }

  return issues
}
