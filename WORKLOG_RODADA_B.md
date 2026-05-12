# Rodada B Worklog — 2026-05-12

## Diagnóstico Inicial

**Herança da Rodada A:**
- Parser funcional: extrai PbixIR + data JSON de qualquer .pbix. 11 páginas, 9 tabelas, 15 medidas.
- KPI cards renderizam valores computados globalmente (26.4M Revenue Won, 77.3M Revenue In Pipeline).
- Bar/Line/Pie charts resolvem colunas raw mas NÃO aplicam agregação DAX per-categoria — resultado: gráficos mostram soma simples da coluna inteira em vez de aplicar contexto de filtro.
- DataTableVisual agrupa por linhas e soma colunas raw — sem aplicar medidas DAX. Zeros em células de valor.
- Slicer tem checkbox UI e FilterContext funcional, mas valores únicos nem sempre populados; cross-filter não é consumido pelos visuais.
- ActionButtons, shapes, images são renderizados como UnsupportedVisual — poluem o canvas.

**5 bugs confirmados no STATE_DUMP:**

1. **🔴 BUG #1 — Agregação de medidas DAX não aplicada em tabelas/charts**
   - `extract.py` computa valores globais em `_compute_measure()` (filtro fixo no parser)
   - `KpiCard.tsx` usa `computed_values` do config → funciona para KPIs
   - `DataTableVisual.tsx` usa `row[vf.column]` raw → mostra zeros
   - `BarChartVisual.tsx` / `LineChartVisual.tsx` usam `resolveData` + `aggregateData` → soma coluna raw, ignora medida
   - Solução: `measureEvaluator.ts` front-end que aplica filter context + aggregation

2. **🔴 BUG #2 — actionButtons/shapes poluem canvas**
   - `RAW_TO_CANONICAL` em `visuals.py` mapeia `actionButton` como `unsupported` e `shape` como `shape` literal
   - `ReportCanvas.tsx` renderiza esses tipos normalmente
   - Solução: `CHROME_TYPES` no parser + `case 'chrome': return null` no front

3. **🟡 BUG #3 — Layout cramped, labels sobrepostos**
   - Alguns charts têm `<BarChart>` sem `<ResponsiveContainer>`
   - `UnsupportedVisual.tsx` sem `overflow: hidden`
   - Sem `tickFormatter` nos axes Recharts

4. **🟡 BUG #4 — Tipos de visual faltando**
   - `ribbonChart`, `comboChart`, `scatterChart`, `funnel`, `gauge`, `treemap`, `shapeMap` não têm mapeamento ou componente

5. **🟢 BUG #5 — Slicer não filtra visuais**
   - `SlicerVisual.tsx` popula valores únicos corretamente mas visuais não consomem filtros do `FilterContext`

## Fases

### Phase 0 — Diagnóstico (completo)
- STATE_DUMP.md lido: confirma todos os 5 bugs
- Source files lidos: KpiCard, DataTableVisual, BarChartVisual, LineChartVisual, PieChartVisual, SlicerVisual, ReportCanvas, UnsupportedVisual, VisualRegistry, dataResolver, extract.py, visuals.py, schema.py
- IR analisado: 15 medidas DAX no Opportunities, medidas computadas globalmente no parser
- Entendimento: avaliador de medidas precisa ser front-end (TypeScript) para aplicar filter context correto

## Decisões de design
- MeasureEvaluator: implementa 7 padrões DAX em TS, não tenta cobrir CALCULATE/FILTER/SUMX
- Chrome visuals: parser marca como type='chrome', front renderiza null (default) ou passa showChrome
- Cross-filter: FilterContext já existe, só falta visuais consumirem
- Novos visuais: ComboChart (ComposedChart), ScatterChart, Funnel, Treemap, Gauge, Map placeholder
- `lodash` para grouping/uniq — já é dependência via recharts/shared deps

## Status Final

Bugs corrigidos: 5/5
- BUG #1 (DAX aggregation): CORRIGIDO - measureEvaluator.ts com 7 padroes, 14 tests
- BUG #2 (chrome): CORRIGIDO - 837 chrome visuals ocultos
- BUG #3 (layout): CORRIGIDO - truncate, overflow-hidden
- BUG #4 (new visuals): CORRIGIDO - 6 novos componentes
- BUG #5 (slicer): CORRIGIDO - useFilteredData hook em 4 componentes

Commits: 5 na Rodada B
Build: pnpm build OK
Tests: 11 pytest + 14 vitest OK
Visual types: 13 suportados

