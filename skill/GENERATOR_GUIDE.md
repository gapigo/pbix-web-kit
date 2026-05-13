# GENERATOR_GUIDE.md — Modo Generator

**Generator** é o modo criativo do pbix-web-kit. Use quando o Composer for limitante:
layout não convencional, componentes customizados, interações complexas, ou liberdade visual total.

> **Contraste com Composer:** Generator não tem limite de linhas, pode importar bibliotecas
> externas (Recharts, D3, custom components) e permite qualquer estrutura de layout.
> Em troca, você assume responsabilidade por consistência visual e performance.

---

## Filosofia

O Generator existe para páginas que **não cabem num template**. Exemplos reais:

- **Página de execução** com KPI hero + timeline de eventos + métricas em tempo real
- **Mapa geográfico** com plotagem customizada sobre imagem ou canvas
- **Narrativa tipográfica** onde dados e texto se entrelaçam (análise trimestral, report)
- **Dashboard comparativo** lado a lado com toggle de período e chart type switching
- **Visão executiva** com grid assimétrico, destaques de cor, indicadores de variação

**Mas liberdade não é anarquia.** O Generator tem obrigações mais rígidas que o Composer,
porque você está fora do guardrail dos componentes prontos.

---

## 4 Obrigações (não negociáveis)

### 1. Use `theme.colors` — sempre

Nunca hardcode cores hex. O tema PBI é a identidade visual do projeto.

```tsx
// ❌ Ruim
<BarChart data={data} fill="#118DFF" />

// ✅ Correto
<BarChart data={data} fill={theme.colors[0]} />
// Ou para valores positivos/negativos
<span style={{ color: value >= 0 ? theme.semantic.success : theme.semantic.danger }}>
  {formatPercent(value)}
</span>
```

### 2. Use os formatters do SDK — sempre

`formatCurrency`, `formatCompact`, `formatPercent`, `formatNumber`. Eles tratam
null/undefined/NaN → `"—"`, que é o contrato do projeto.

```tsx
// ❌ Ruim
d3.format(",.2f")(value)

// ✅ Correto
formatCurrency(value)
```

### 3. Use os hooks de dados — sempre

`useAggregation`, `useDistinctValues`, `useTopN`, `useQuery`. Eles gerenciam:
- Caching com React Query (staleTime padrão 30s)
- Loading/error states
- Integração com filtros da store

Nunca chame `QueryEngine.query()` diretamente num efeito.

### 4. DuckDB, não JS — sempre

Nunca faça `array.filter().reduce()` para agregar dados. O DuckDB é o engine
de dados — qualquer agregação passa por SQL.

```tsx
// ❌ Ruim
const totals = data.reduce((s, r) => s + r.Amount, 0)

// ✅ Correto
const { data } = useAggregation(engine, {
  table: "Sales",
  measures: [{ column: "Amount", fn: "sum", alias: "total" }],
})
```

---

## Receitas

### Receita 1 — Página de Overview com KPI Custom

Um componente KPI inline com sparkline e indicador de variação, usando Recharts
para o mini-gráfico e `useAggregation` para os números.

```tsx
// pages/generator/Overview.tsx
import { useMemo } from "react"
import {
  DashboardShell, PageTabs, FilterBar,
  BarChartVisual, PieChartVisual, DataTableVisual,
  useAggregation, useFilters, theme, formatCurrency, formatCompact,
} from "@pbix/runtime"
import { useStore } from "../store" // instância de createDashboardStore()
import { LineChart, Line, ResponsiveContainer } from "recharts"

// ── Custom KPI com sparkline ─────────────────────────────────────
// Diferente do KpiCard do SDK, este inclui tendência visual e delta.
function SparklineKpi({
  label,
  measure,
  engine,
  sparklineSql,
}: {
  label: string
  measure: { table: string; column: string; fn: string }
  engine: any
  sparklineSql: string
}) {
  // Valor principal
  const { data: agg } = useAggregation(engine, {
    table: measure.table,
    measures: [{ column: measure.column, fn: measure.fn as any, alias: "val" }],
  })
  const current = agg?.[0]?.val as number | undefined

  // Série temporal para sparkline (SQL raw)
  const { data: series } = useQuery({
    engine,
    sql: sparklineSql,
  })

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      <div className="flex items-end gap-3">
        <div className="text-2xl font-bold" style={{ color: theme.colors[0] }}>
          {formatCompact(current)}
        </div>
        {series && (
          <div className="flex-1 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <Line
                  type="monotone"
                  dataKey="val"
                  stroke={theme.colors[0]}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Página ──────────────────────────────────────────────────────
export default function OverviewPage({ engine }: { engine: any }) {
  const filters = useFilters(useStore)

  // Top produtos por receita (alimenta tabela + bar chart)
  const { data: topProducts } = useAggregation(engine, {
    table: "Sales",
    groupBy: ["Product"],
    measures: [{ column: "Amount", fn: "sum", alias: "total" }],
    orderBy: [{ column: "total", dir: "desc" }],
    limit: 10,
    filters: Object.values(filters),
  })

  return (
    <DashboardShell title="Overview" header={<PageTabs />}>
      <FilterBar store={useStore} />

      {/* Grid assimétrico — 3 KPIs na primeira linha, 2 cards largos abaixo */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <SparklineKpi
          label="Receita Total"
          measure={{ table: "Sales", column: "Amount", fn: "sum" }}
          engine={engine}
          sparklineSql={`
            SELECT DATE_TRUNC('month', "Date") as d, SUM("Amount") as val
            FROM "Sales" GROUP BY d ORDER BY d
          `}
        />
        <SparklineKpi
          label="Pedidos"
          measure={{ table: "Sales", column: "OrderID", fn: "distinctCount" }}
          engine={engine}
          sparklineSql={`
            SELECT DATE_TRUNC('month', "Date") as d, COUNT(DISTINCT "OrderID") as val
            FROM "Sales" GROUP BY d ORDER BY d
          `}
        />
        <SparklineKpi
          label="Ticket Médio"
          measure={{ table: "Sales", column: "Amount", fn: "avg" }}
          engine={engine}
          sparklineSql={`
            SELECT DATE_TRUNC('month', "Date") as d, AVG("Amount") as val
            FROM "Sales" GROUP BY d ORDER BY d
          `}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <BarChartVisual
          engine={engine}
          table="Sales"
          groupBy={["Product"]}
          measure={{ column: "Amount", fn: "sum" }}
          title="Receita por Produto"
          filters={Object.values(filters)}
          limit={10}
        />
        <PieChartVisual
          engine={engine}
          table="Sales"
          groupBy={["Category"]}
          measure={{ column: "Amount", fn: "sum" }}
          title="Receita por Categoria"
          filters={Object.values(filters)}
        />
      </div>

      <DataTableVisual
        engine={engine}
        table="Sales"
        measures={[{ column: "Amount", fn: "sum", alias: "Total" }]}
        groupBy={["Product", "Category"]}
        title="Detalhamento"
        filters={Object.values(filters)}
        virtualized={true}
      />
    </DashboardShell>
  )
}
```

---

### Receita 2 — Página de Tendência com Formatação de Data Custom

Quando você precisa de eixos temporais com formatação específica (mês/ano,
acumulado YTD, comparação YoY) que os visuais prontos não suportam.

```tsx
// pages/generator/Trends.tsx
import {
  DashboardShell, PageTabs, SlicerVisual,
  useAggregation, useQuery, useDistinctValues, useFilter,
  useFilters, theme, formatCurrency,
} from "@pbix/runtime"
import { useStore } from "../store"
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid,
} from "recharts"

// ── Custom tooltip com formatação PBI ──────────────────────────
function PbiTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <div className="font-medium text-gray-900 mb-1">{label}</div>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex justify-between gap-4">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="font-semibold">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Página ──────────────────────────────────────────────────────
export default function TrendsPage({ engine }: { engine: any }) {
  // Slicer de ano
  const [yearFilter, setYearFilter] = useFilter(useStore, "OrderDate.Year")
  const filters = useFilters(useStore)

  // Receita mensal — Note: SQL direto porque queremos formatação de data
  // específica ("Jan 2024") que nenhum visual do SDK expõe.
  const { data: monthly } = useQuery({
    engine,
    sql: `
      SELECT
        DATE_TRUNC('month', "OrderDate") as dt,
        SUM("Amount") as revenue,
        COUNT(DISTINCT "OrderID") as orders
      FROM "Sales"
      WHERE 1=1 ${yearFilter?.values ? `AND strftime("%OrderDate", '%Y') = '${yearFilter.values[0]}'` : ""}
      GROUP BY dt
      ORDER BY dt
    `,
  })

  // Processar data no JS (só formatação, não agregação)
  const chartData = monthly?.map((r) => ({
    month: new Date(r.dt).toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    }),
    revenue: r.revenue,
    orders: r.orders,
  })) ?? []

  return (
    <DashboardShell title="Tendências" header={<PageTabs />}>
      {/* Slicer de ano usando SDK */}
      <div className="mb-4 max-w-xs">
        <SlicerVisual
          engine={engine}
          table="Sales"
          column="OrderDate.Year"
          label="Ano"
          store={useStore}
        />
      </div>

      {/* ComposedChart Recharts — barras + linha no mesmo eixo */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <h2 className="text-base font-semibold mb-3">Receita Mensal</h2>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis
              yAxisId="left"
              tickFormatter={(v: number) => formatCurrency(v)}
              tick={{ fontSize: 12 }}
            />
            <YAxis yAxisId="right" orientation="right" hide />
            <Tooltip content={<PbiTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey="revenue" fill={theme.colors[0]} name="Receita" radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" dataKey="orders" stroke={theme.colors[2]} strokeWidth={2} name="Pedidos" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </DashboardShell>
  )
}
```

---

### Receita 3 — Página de Exploração com Toggle de Tipo de Gráfico

Um pattern de "exploration mode": o usuário alterna entre visualizações do mesmo
dataset (barras → pizza → tabela) via botões, tudo alimentado pela mesma query.

```tsx
// pages/generator/Explorer.tsx
import { useState } from "react"
import {
  DashboardShell, PageTabs, FilterBar,
  DataTableVisual, SlicerVisual,
  useAggregation, useFilters, useDistinctValues,
  useStore, // sua instância de createDashboardStore()
  theme, formatCompact,
} from "@pbix/runtime"
import {
  BarChart, PieChart, Bar, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts"

type ChartMode = "bar" | "pie" | "table"

// ── Botões de toggle ────────────────────────────────────────────
function ChartToggle({ mode, onChange }: {
  mode: ChartMode
  onChange: (m: ChartMode) => void
}) {
  const modes: { key: ChartMode; label: string }[] = [
    { key: "bar", label: "Barras" },
    { key: "pie", label: "Pizza" },
    { key: "table", label: "Tabela" },
  ]
  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
      {modes.map((m) => (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors
            ${mode === m.key
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
            }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}

// ── Página ──────────────────────────────────────────────────────
export default function ExplorerPage({ engine }: { engine: any }) {
  const [mode, setMode] = useState<ChartMode>("bar")
  const filters = useFilters(useStore)

  // Query única — os três modos compartilham os mesmos dados
  const { data, loading } = useAggregation(engine, {
    table: "Sales",
    groupBy: ["Product"],
    measures: [{ column: "Amount", fn: "sum", alias: "total" }],
    orderBy: [{ column: "total", dir: "desc" }],
    limit: 15,
    filters: Object.values(filters),
  })

  return (
    <DashboardShell title="Explorador" header={<PageTabs />}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">Produtos por Receita</h2>
        <ChartToggle mode={mode} onChange={setMode} />
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-200">
        {loading ? (
          <div className="h-80 bg-gray-100 animate-pulse rounded-lg" />
        ) : mode === "bar" ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tickFormatter={(v: number) => formatCompact(v)} />
              <YAxis type="category" dataKey="Product" width={160} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => formatCompact(v)} />
              <Bar dataKey="total" fill={theme.colors[0]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : mode === "pie" ? (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data}
                dataKey="total"
                nameKey="Product"
                cx="50%"
                cy="50%"
                outerRadius={140}
                label={({ Product, percent }: any) =>
                  `${Product} (${(percent * 100).toFixed(1)}%)`
                }
              >
                {data?.map((_, i) => (
                  <Cell key={i} fill={theme.colors[i % theme.colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatCompact(v)} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <DataTableVisual
            engine={engine}
            table="Sales"
            groupBy={["Product"]}
            measures={[{ column: "Amount", fn: "sum", alias: "Total" }]}
            title=""
            filters={Object.values(filters)}
            limit={15}
          />
        )}
      </div>
    </DashboardShell>
  )
}
```

---

## Template de Página Generator (completo)

Use como ponto de partida. Diferente do template Composer, este inclui
importação Recharts, componentes customizados inline, e um hook de dados.

```tsx
// pages/generator/MyPage.tsx
// ────────────────────────────────────────────────────────────────
// 1. Imports: SDK + Recharts (opcional)
//    Diferente do Composer, você PODE importar Recharts e criar
//    componentes à vontade.
// ────────────────────────────────────────────────────────────────
import { useState } from "react"
import {
  // Layout
  DashboardShell,
  PageTabs,
  FilterBar,

  // SDK visuals (use quando servir; não é obrigatório)
  KpiCard,
  DataTableVisual,
  SlicerVisual,

  // Data hooks — SEMPRE use estes, nunca JS array.reduce
  useAggregation,
  useQuery,
  useDistinctValues,
  useFilter,
  useFilters,

  // Theme + formatters — SEMPRE use estes
  theme,
  formatCurrency,
  formatPercent,
  formatCompact,
  formatNumber,
} from "@pbix/runtime"

// Recharts — liberado no Generator
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"

// Store — instância única do Zustand
import { useStore } from "../store"

// ────────────────────────────────────────────────────────────────
// 2. Tipos (opcional — útil para dados processados)
// ────────────────────────────────────────────────────────────────
interface ChartRow {
  label: string
  value: number
}

// ────────────────────────────────────────────────────────────────
// 3. Componentes custom (opcional)
//    Extraia componentes só quando o arquivo crescer demais.
//    No Generator não há limite de linhas — comece tudo no mesmo
//    arquivo e extraia quando sentir repetição.
// ────────────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
      {message}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// 4. Página principal
// ────────────────────────────────────────────────────────────────
export default function MyPage({ engine }: { engine: any }) {
  // ── Estado local (só UI — filtros vão na store) ────────────
  const [sortAsc, setSortAsc] = useState(false)

  // ── Filtros da store ──────────────────────────────────────
  const filters = useFilters(useStore)

  // ── Dados via DuckDB (obrigatório) ────────────────────────
  const { data, loading, error } = useAggregation(engine, {
    table: "Sales",             // Nome da tabela Parquet
    groupBy: ["Product"],       // Dimensão
    measures: [                 // Medidas
      { column: "Amount", fn: "sum", alias: "total" },
      { column: "Quantity", fn: "sum", alias: "qty" },
    ],
    orderBy: [{                 // Ordenação por SQL (não JS .sort)
      column: "total",
      dir: sortAsc ? "asc" : "desc",
    }],
    limit: 20,
    filters: Object.values(filters),  // Filtros ativos da store
  })

  // ── Processamento pós-query (só formatação/map, nunca agregação)
  const chartData: ChartRow[] = (data ?? []).map((r) => ({
    label: r.Product,
    value: r.total,
  }))

  // ── Render ────────────────────────────────────────────────
  return (
    <DashboardShell title="Minha Página Generator" header={<PageTabs />}>
      {/* Barra de filtros ativos (auto-sincronizada) */}
      <FilterBar store={useStore} />

      {/* Grid de KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <KpiCard
          measure={{ table: "Sales", column: "Amount", fn: "sum" }}
          label="Receita Total"
          engine={engine}
          filters={Object.values(filters)}
          format="currency"
        />
        {/* Mais KPIs aqui */}
      </div>

      {/* Botão de ordenação (UI state local é OK) */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">Produtos</h2>
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          {sortAsc ? "↑ Crescente" : "↓ Decrescente"}
        </button>
      </div>

      {/* Loading / Error / Empty / Data — SEMPRE os 4 estados */}
      {loading ? (
        <div className="h-80 bg-gray-100 animate-pulse rounded-lg" />
      ) : error ? (
        <div className="text-red-400 text-sm p-4">Erro ao carregar dados</div>
      ) !data || data.length === 0 ? (
        <EmptyState message="Nenhum dado encontrado para os filtros ativos." />
      ) : (
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v: number) => formatCompact(v)} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="value" fill={theme.colors[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashboardShell>
  )
}
```

---

## Checklist específico do Generator

Antes de dar como pronto, verifique:

- [ ] Todas as cores vêm de `theme.colors` ou `theme.semantic` — zero hex hardcoded
- [ ] Toda formatação numérica usa `formatCurrency` / `formatCompact` / `formatPercent` / `formatNumber`
- [ ] Nenhuma agregação em JS (`reduce`, `filter+map`, `Math.sum`)
- [ ] Toda query de dados passa por `useAggregation` / `useQuery` / `useDistinctValues` / `useTopN`
- [ ] Todos os 4 estados renderizam: loading (skeleton), error (mensagem), empty (placeholder), data (visual)
- [ ] Filtros sempre via store (`useFilter`/`useFilters`), nunca `useState`
- [ ] Importações de Recharts são justificadas (não dava pra usar o visual do SDK?)
- [ ] Página carrega em < 500ms no dev (descontando o primeiro load do DuckDB-WASM)
- [ ] Bundle da página não adiciona >50KB gzipped (se sim, considere voltar pro Composer)
