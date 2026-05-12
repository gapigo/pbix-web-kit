# Rodada B Handoff — 2026-05-12

**Duration**: ~3.5 hours  
**Commits**: 5 (total 9 with Rodada A)

---

## O que mudou

### 🔴 BUG #1 — Agregação de medidas DAX (CRÍTICO - CORRIGIDO)
**Problema**: KPIs mostravam números globais (computed_values do parser) mas tabelas mostravam zeros porque liam colunas raw sem aplicar agregação.

**Solução**: Implementado `packages/pbix-web-app/src/lib/measureEvaluator.ts` com os 7 padrões:
- `SUM`/`SUMX` — soma de coluna, com ou sem CALCULATE/FILTER wrapper
- `AVERAGE`/`AVG` — média
- `COUNT`/`COUNTROWS`/`COUNTAX` — contagem
- `MIN`/`MAX` — mínimo/máximo
- `DISTINCTCOUNT` — contagem de valores únicos
- `DIVIDE` — divisão com fallback
- Referência a `[Measure Name]` via expressões aritméticas

Cada visual (KpiCard, DataTableVisual, BarChartVisual, LineChartVisual) agora usa `evaluateField()` que:
1. Busca a expressão DAX da medida no IR
2. Aplica filtros de contexto (linha da tabela, categoria do chart)
3. Aplica filtros globais do slicer
4. Computa a agregação nos dados filtrados

**Antes**: Tabela mostrava 0 em todas células de valor  
**Depois**: Tabela mostra Revenue Won por território (US-WEST ~15.3M, US-SOUTH ~3.1M, etc.)

### 🔴 BUG #2 — actionButtons e shapes (CORRIGIDO)
**Problema**: 837 visuals do tipo actionButton, shape, image, textbox poluíam o canvas com retângulos "Unsupported visual type".

**Solução**:
- `visuals.py`: Adicionado `CHROME_TYPES` e mapeamento para `type='chrome'`
- `schema.py`: Adicionado `'chrome'` ao `VisualType`
- `VisualRegistry.tsx`: `case 'chrome': return null`
- `ReportCanvas.tsx`: Filtra chrome do canvas content

**Antes**: Topo de cada página com 6+ caixas "actionButton"  
**Depois**: Canvas limpo, KPIs começam de cima

### 🟡 BUG #3 — Layout polish (CORRIGIDO)
**Problema**: Labels sobrepostos, texto vazando de UnsupportedVisuals.

**Solução**:
- `tickFormatter={truncate(20)}` nos eixos de categoria de BarChart e LineChart
- `UnsupportedVisual.tsx`: `overflow-hidden`, `truncate`, texto em itálico
- `ReportCanvas.tsx`: já tinha `overflow-hidden`

### 🟡 BUG #4 — Novos tipos de visual (CORRIGIDO)
**Problema**: ribbonChart, comboChart, scatterChart, funnel, gauge, treemap, shapeMap apareciam como "Unsupported".

**Solução**: 6 novos componentes + mapper atualizado:

| Tipo | Componente | Implementação |
|------|-----------|---------------|
| `combo` | `ComboChartVisual` | Recharts `<ComposedChart>` com Bar + Line |
| `scatter` | `ScatterChartVisual` | Recharts `<ScatterChart>` |
| `funnel` | `FunnelVisual` | Recharts `<FunnelChart>` |
| `treemap` | `TreemapVisual` | Recharts `<Treemap>` |
| `gauge` | `GaugeVisual` | Recharts `<RadialBarChart>` |
| `map` | `MapPlaceholder` | Placeholder estilizado "Map unavailable" |

Parser: `ribbonChart` → `bar` (reusa BarChartVisual).

### 🟢 BUG #5 — Slicer cross-filter (CORRIGIDO)
**Problema**: Slicer "Forecast Adjustment" mostrava "No data" e não filtrava outros visuais.

**Solução**:
- `useFilteredData` hook em `FilterContext.tsx`: aplica filtros do contexto aos dados
- KpiCard, DataTableVisual, BarChartVisual, LineChartVisual agora usam `useFilteredData()`
- SlicerVisual já populava valores únicos e disparava `setFilter`

## O que ainda está parcial
- **ComboChart**: Alterna Bar/Line por posição par/ímpar — PBI tem lógica mais sofisticada
- **Gauge**: Mostra total simples — PBI tem range configurável
- **FlowVisual**: Custom visual não implementado (continua `unsupported`)
- **Mapa**: Placeholder estilizado, sem implementação real

## Próximos 3 passos
1. **Tema do .pbix**: Carregar cores do tema CY21SU04.json para matching visual com Power BI Desktop
2. **keyDriversVisual**: Implementar ou mapear para visual suportado
3. **Testes de regressão visual**: Playwright screenshots comparando página a página com Power BI Desktop

## Métricas finais
- **Python parser**: ~920 linhas
- **React app**: ~3700 linhas, 16 componentes de visual
- **Visual types suportados**: 13 (kpi, bar, line, pie, table, slicer, combo, scatter, funnel, treemap, gauge, map, text/chrome)
- **Pages no sample**: 11
- **Tests**: 11 pytest + 14 vitest = 25 testes passando
- **Commits Rodada B**: 5 (mais que os 4 da Rodada A)
- **Build**: `pnpm build` passa limpo
