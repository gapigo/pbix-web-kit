# COMPOSER_GUIDE: Modo Composer do pbix-web-kit

> Leia isto **antes** de escrever qualquer página no modo Composer.
> Referência rápida de símbolos: [`SKILL.md`](./SKILL.md)
> Pipeline completo: `SKILL.md` → `COMPOSER_GUIDE.md` → `PROMPT_TEMPLATE_COMPOSER.md`

---

## Filosofia

O modo Composer existe para produzir dashboards web consistentes, funcionais e rápidos de gerar.

| Princípio | Por que |
|---|---|
| **Consistência** | Todas as páginas de um projeto seguem o mesmo layout, mesma paleta, mesmos patterns de query. Um usuário que entende uma página entende todas. |
| **Velocidade** | 10-15 minutos por página, 0 rework de layout. Importe e posicione — sem customização de eixo, legenda, ou cor. |
| **Restrição** | Menos escolhas = menos bugs. `@pbix/runtime` encapsula 90% dos casos de uso com props tipadas. Os 10% restantes são modo Generator. |

> Se a página pede um visual que não existe em `@pbix/runtime` (mapa avançado, sankey, heatmap, visual 100% custom), ou se o layout precisa fugir do grid de 12 colunas — **não force no Composer**. Pule para o modo Generator.

---

## Restrições (violar = rejeitar na revisão)

### Imports
- **Só** `@pbix/runtime` + `react` (`import { useState } from "react"`).
- **Nada** de Recharts, d3, lodash, tailwind classes arbitrárias, ou qualquer outra dependência.
- `@pbix/runtime` já exporta **tudo** que você precisa: visuais, hooks, layout, theme, formatters, e tipos.

```ts
// ✅ OK
import { KpiCard, BarChartVisual, DashboardShell } from "@pbix/runtime"
import { useState } from "react"

// ❌ REJEITADO
import { BarChart, Bar, XAxis } from "recharts"
import { debounce } from "lodash"
```

### Tamanho
- **Máximo 150 linhas por página** (contando imports, layout, componentes — tudo).
- Se ultrapassou, extraia um componente compartilhado ou reavalie se precisa do Generator.

### Layout
- **CSS Grid de 12 colunas obrigatório**: `<div className="grid grid-cols-12 gap-4">`.
- Cada visual ocupa `col-span-N` com N = 3, 4, 6, ou 12.
- Posicionamento absoluto, flexbox arbitrário, margins customizadas são **proibidos**.
- O grid garante responsividade e consistência entre páginas.
- Espaçamento vertical entre rows é controlado pelo `gap-4` do grid — não adicione `mt-*` ou `mb-*`.

### Dados
- **Toda agregação via DuckDB-SQL**, nunca `array.reduce`, `filter`, `sort` em JS.
- Use `useAggregation`, `useQuery`, `useDistinctValues` — hooks que chamam o `QueryEngine`.
- `useAggregation` cobre: sum, avg, count, min, max, distinctCount.
- Para queries arbitrárias: `useQuery({ engine, sql: "SELECT ...", params })`.
- Parquet (via `DuckDBProvider` + `registerTables`) é obrigatório para datasets > 5K linhas.

### Filtros
- **Sempre via Zustand store**, nunca `useState`.
- A store é uma factory: `createDashboardStore()`.
- `useFilter(store, key)` retorna `[filter, setFilter, clearFilter]`.
- `useFilters(store)` retorna `Record<string, Filter>`.
- `useDistinctValues(engine, table, column, filters?)` popula slicers.

### Apresentação
- Use sempre `theme.colors[i]` ou `PBI_PALETTE[i]`, nunca cores hardcoded.
- Formatação numérica via `formatCompact`, `formatCurrency`, `formatPercent`, `formatNumber`.

---

## Receitas

### Receita 1: Overview Page (4 KPI cards + bar chart + table + slicer)

A página de visão geral mostra o estado atual do negócio: métricas agregadas no topo, um gráfico de barras por categoria, uma tabela de suporte, e um slicer contextual.

**Estrutura do grid:**
- Linha 1: 4 KPI cards (`col-span-3` cada)
- Linha 2: Slicer (`col-span-3`) + Bar chart (`col-span-9`)
- Linha 3: DataTable (`col-span-12`)

**Padrão de filtro:** O slicer usa `useDistinctValues` (embutido em `SlicerVisual`) e escreve na store. O bar chart e a tabela leem os filtros da store automaticamente através da prop `filters`.

**Dica de performance:** Se a tabela tem >200 linhas, passe `virtualized={true}` (default). Para tabelas pequenas, `virtualized={false}` é mais leve.

```tsx
import { KpiCard, BarChartVisual, DataTableVisual, SlicerVisual, theme } from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"

interface Props {
  engine: QueryEngine
  store: any // UseBoundStore<StoreApi<DashboardStore>>
}

export default function OverviewPage({ engine, store }: Props) {
  const filters = store((s: any) => Object.values(s.filters))

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Hero metrics — 4 KPI cards across the top */}
      <div className="col-span-3">
        <KpiCard
          measure={{ table: "Opportunities", column: "Value", agg: "sum" }}
          label="Total Revenue"
          engine={engine}
          format="currency"
          color={theme.colors[0]}
        />
      </div>
      <div className="col-span-3">
        <KpiCard
          measure={{ table: "Opportunities", column: "Value", agg: "count" }}
          label="Total Deals"
          engine={engine}
          format="compact"
          color={theme.colors[1]}
        />
      </div>
      <div className="col-span-3">
        <KpiCard
          measure={{ table: "Opportunities", column: "Value", agg: "avg" }}
          label="Avg Deal Size"
          engine={engine}
          format="currency"
          color={theme.colors[2]}
        />
      </div>
      <div className="col-span-3">
        <KpiCard
          measure={{ table: "Opportunities", column: "Value", agg: "distinctCount" }}
          label="Active Customers"
          engine={engine}
          format="compact"
          color={theme.colors[3]}
        />
      </div>

      {/* Slicer for drill-down */}
      <div className="col-span-3">
        <SlicerVisual
          table="Opportunities"
          column="Region"
          label="Region"
          engine={engine}
          mode="multi"
        />
      </div>

      {/* Revenue by product category */}
      <div className="col-span-9">
        <BarChartVisual
          table="Opportunities"
          category={{ column: "Product", maxItems: 10 }}
          values={[
            { column: "Value", agg: "sum", label: "Revenue", color: theme.colors[0] },
          ]}
          engine={engine}
          filters={filters}
        />
      </div>

      {/* Detail table */}
      <div className="col-span-12">
        <DataTableVisual
          table="Opportunities"
          columns={[
            { column: "Product", role: "row" },
            { column: "Region", role: "row" },
            { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue" },
            { column: "Value", agg: "count", role: "value", format: "compact", label: "Deals" },
          ]}
          engine={engine}
          filters={filters}
          virtualized={false}
        />
      </div>
    </div>
  )
}
```

**O que observar:**
- `measure={{ table, column, agg }}` — a agregação roda no DuckDB, não no JS.
- `SlicerVisual` sem `onChange` explicito = modo controlado pela store.
- A prop `filters` nos visuais é um array de `Filter[]`. Ela é passada como SQL WHERE clause para o DuckDB.

---

### Receita 2: Detail Page (tables + scatter + line)

Página de detalhe que explora correlações e tendências. Combina visuais analíticos com tabelas de suporte.

**Estrutura do grid:**
- Linha 1: Line chart (col-span-12) — tendência ao longo do tempo
- Linha 2: Scatter (col-span-6) + DataTable (col-span-6)
- Linha 3: Slicers para refinar (col-span-3 cada, 4 slicers)

**Padrão de filtro:** Slicers na parte inferior permitem refinar o scatter e o line chart. Como `useFilter` pode ser usado para filtros que não vêm de um `SlicerVisual`.

```tsx
import { KpiCard, LineChartVisual, ScatterChartVisual, DataTableVisual, SlicerVisual, theme } from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"

interface Props {
  engine: QueryEngine
  store: any
}

export default function DetailPage({ engine, store }: Props) {
  const filters = store((s: any) => Object.values(s.filters))

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Revenue trend over time */}
      <div className="col-span-12">
        <LineChartVisual
          table="Opportunities"
          category={{ column: "CloseDate" }}
          values={[
            { column: "Value", agg: "sum", label: "Revenue", color: theme.colors[0] },
          ]}
          engine={engine}
          filters={filters}
        />
      </div>

      {/* Scatter: deal size vs days to close */}
      <div className="col-span-6">
        <ScatterChartVisual
          table="Opportunities"
          x={{ column: "Value", agg: "sum", label: "Deal Size" }}
          y={{ column: "DaysToClose", agg: "avg", label: "Days to Close" }}
          category={{ column: "Product" }}
          engine={engine}
          filters={filters}
        />
      </div>

      {/* Detail table */}
      <div className="col-span-6">
        <DataTableVisual
          table="Opportunities"
          columns={[
            { column: "Owner", role: "row" },
            { column: "Product", role: "row" },
            { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue" },
            { column: "DaysToClose", agg: "avg", role: "value", format: "number", label: "Avg Days" },
          ]}
          engine={engine}
          filters={filters}
        />
      </div>

      {/* Slicers row — refine the analysis */}
      <div className="col-span-3">
        <SlicerVisual table="Opportunities" column="Region" label="Region" engine={engine} />
      </div>
      <div className="col-span-3">
        <SlicerVisual table="Opportunities" column="Product" label="Product" engine={engine} />
      </div>
      <div className="col-span-3">
        <SlicerVisual table="Owners" column="Manager" label="Manager" engine={engine} />
      </div>
      <div className="col-span-3">
        <SlicerVisual table="Opportunities" column="DealStage" label="Deal Stage" engine={engine} />
      </div>
    </div>
  )
}
```

**O que observar:**
- Scatter aceita `x` e `y` com `agg` individual — cada eixo pode ter agregação diferente.
- `category` no Scatter colore os pontos por grupo.
- Slicers no final da página = filtros aplicados a todos os visuais acima via store.
- `LineChartVisual` com `category` de data mostra tendência temporal.

---

### Receita 3: Exploration Page (slicers + multiple charts)

Página exploratória com múltiplos ângulos de análise. Muitos slicers + gráficos de suporte que respondem imediatamente a filtros.

**Estrutura do grid:**
- Linha 1: 4 slicers (col-span-3 cada)
- Linha 2: Funnel (col-span-4) + Pie (col-span-4) + ComboChart (col-span-4)
- Linha 3: Treemap (col-span-6) + DataTable (col-span-6)

**Padrão de filtro:** Todos os visuais compartilham o mesmo array `filters` vindo da store. O `SlicerVisual` escreve na store; os visuais leem.

```tsx
import {
  SlicerVisual, FunnelVisual, PieChartVisual, ComboChartVisual,
  TreemapVisual, DataTableVisual, theme,
} from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"

interface Props {
  engine: QueryEngine
  store: any
}

export default function ExplorationPage({ engine, store }: Props) {
  const filters = store((s: any) => Object.values(s.filters))

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Slicer row — full control */}
      <div className="col-span-3">
        <SlicerVisual table="Opportunities" column="Region" label="Region" engine={engine} mode="multi" />
      </div>
      <div className="col-span-3">
        <SlicerVisual table="Opportunities" column="Product" label="Product" engine={engine} mode="multi" />
      </div>
      <div className="col-span-3">
        <SlicerVisual table="Opportunities" column="DealStage" label="Deal Stage" engine={engine} mode="multi" />
      </div>
      <div className="col-span-3">
        <SlicerVisual table="Owners" column="Manager" label="Manager" engine={engine} mode="single" />
      </div>

      {/* Funnel: pipeline stages */}
      <div className="col-span-4">
        <FunnelVisual
          table="Opportunities"
          category={{ column: "PipelineStep" }}
          value={{ column: "Value", agg: "sum", label: "Revenue" }}
          engine={engine}
          filters={filters}
        />
      </div>

      {/* Pie: revenue distribution */}
      <div className="col-span-4">
        <PieChartVisual
          table="Opportunities"
          category={{ column: "Product" }}
          value={{ column: "Value", agg: "sum", label: "Revenue" }}
          engine={engine}
          filters={filters}
        />
      </div>

      {/* Combo: bars + line overlay */}
      <div className="col-span-4">
        <ComboChartVisual
          table="Opportunities"
          category={{ column: "Owner" }}
          bars={[{ column: "Value", agg: "sum", label: "Revenue" }]}
          lines={[{ column: "Value", agg: "count", label: "Deal Count" }]}
          engine={engine}
          filters={filters}
        />
      </div>

      {/* Treemap: hierarchical view */}
      <div className="col-span-6">
        <TreemapVisual
          table="Opportunities"
          category={{ column: "Region" }}
          value={{ column: "Value", agg: "sum", label: "Revenue" }}
          engine={engine}
          filters={filters}
        />
      </div>

      {/* Supporting table */}
      <div className="col-span-6">
        <DataTableVisual
          table="Opportunities"
          columns={[
            { column: "Region", role: "row" },
            { column: "Product", role: "row" },
            { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue" },
            { column: "Value", agg: "count", role: "value", format: "compact", label: "Deals" },
          ]}
          engine={engine}
          filters={filters}
        />
      </div>
    </div>
  )
}
```

**O que observar:**
- `mode="multi"` no slicer permite seleção múltipla; `mode="single"` força um valor.
- `ComboChartVisual` aceita `bars` e `lines` como arrays separados — ótimo para comparar métricas diferentes no mesmo eixo X.
- `FunnelVisual` precisa de `category` (etapas) e `value` (medida).

---

## Template copiável

Use este template como ponto de partida para **qualquer** página Composer. Substitua os comentários com os visuais reais do brief.

```tsx
// @pbix/runtime — única dependência permitida
import {
  // Layout
  DashboardShell,
  // Visuais (importe só os que usar)
  KpiCard, BarChartVisual, LineChartVisual, PieChartVisual,
  DataTableVisual, SlicerVisual, FunnelVisual, ScatterChartVisual,
  ComboChartVisual, TreemapVisual, GaugeVisual, MapPlaceholder,
  // Hooks
  useAggregation, useQuery, useDistinctValues,
  useFilter, useFilters,
  // Store
  createDashboardStore,
  // Theme + utils
  theme, formatCurrency, formatCompact, formatPercent,
} from "@pbix/runtime"

// Tipos
import type { QueryEngine } from "@pbix/runtime"

interface Props {
  engine: QueryEngine
  store: ReturnType<typeof createDashboardStore>
}

export default function PageName({ engine, store }: Props) {
  // Colete filtros ativos — todos os visuais compartilham o mesmo array
  // Object.values resolve o Record<string, Filter> em Filter[]
  const filters = store((s) => Object.values(s.filters))

  // Para queries custom que os visuais prontos não cobrem:
  //   const { data, loading, error } = useQuery({ engine, sql: "..." })
  // Para agregação direta sem visual:
  //   const { data, loading, error } = useAggregation(engine, { table, measures, groupBy })
  // Para popular opções de slicer manual:
  //   const { data: options } = useDistinctValues(engine, "Table", "Column")

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* ═══════ KPI Row ═══════
          4 cards de métricas no topo, col-span=3 cada.
          measure = { table, column, agg } — agregação roda no DuckDB.
      */}
      <div className="col-span-3">
        <KpiCard measure={{ table: "Table", column: "Column", agg: "sum" }} label="Metric" engine={engine} format="compact" color={theme.colors[0]} />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "Table", column: "Column", agg: "count" }} label="Metric" engine={engine} format="compact" color={theme.colors[1]} />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "Table", column: "Column", agg: "avg" }} label="Metric" engine={engine} format="currency" color={theme.colors[2]} />
      </div>
      <div className="col-span-3">
        <KpiCard measure={{ table: "Table", column: "Column", agg: "sum" }} label="Metric" engine={engine} format="percent" color={theme.colors[3]} />
      </div>

      {/* ═══════ Charts Row ═══════
          Visuais: BarChartVisual, LineChartVisual, PieChartVisual,
                   ComboChartVisual, ScatterChartVisual, TreemapVisual,
                   FunnelVisual, GaugeVisual, MapPlaceholder
          Todos aceitam engine + filters.
          Filtros fluem da store automaticamente.
      */}
      <div className="col-span-6">
        <BarChartVisual
          table="Table"
          category={{ column: "Category", maxItems: 10 }}
          values={[{ column: "Value", agg: "sum", label: "Label" }]}
          engine={engine}
          filters={filters}
        />
      </div>
      <div className="col-span-6">
        <DataTableVisual
          table="Table"
          columns={[
            { column: "Col", role: "row" },
            { column: "Measure", agg: "sum", role: "value", format: "currency", label: "Label" },
          ]}
          engine={engine}
          filters={filters}
          virtualized={true}
        />
      </div>

      {/* ═══════ Slicers Row ═══════
          SlicerVisual popula automaticamente com distinct values.
          mode="multi" | "single"
          Escreve na store — outros visuais reagem.
      */}
      <div className="col-span-3">
        <SlicerVisual table="Table" column="Column" label="Label" engine={engine} />
      </div>
      <div className="col-span-3">
        <SlicerVisual table="Table" column="Column" label="Label" engine={engine} />
      </div>
    </div>
  )
}
```

---

## Checklist de validação

Antes de declarar uma página Composer pronta:

- [ ] Apenas imports de `@pbix/runtime` (e `react` se necessário)
- [ ] Nenhum import de `recharts`, `d3`, `lodash`
- [ ] ≤ 150 linhas
- [ ] Layout com `grid grid-cols-12 gap-4`
- [ ] Posicionamento via `col-span-N` — sem `absolute`, sem `mt-*`/`mb-*`
- [ ] Números formatados com `formatCurrency`, `formatCompact`, `formatPercent`
- [ ] Cores de `theme.colors[i]` ou `PBI_PALETTE[i]`
- [ ] `SlicerVisual` sem `onChange` = controlado pela store
- [ ] Filtros compartilhados via `store((s) => Object.values(s.filters))`
- [ ] Nenhum `useState` para filtros
- [ ] Tabela >200 linhas com `virtualized={true}`
- [ ] Dados reais via DuckDB (não arrays hardcoded, não mocks)
- [ ] Build passa sem erro de tipo
- [ ] Página renderiza no app sem crash
