# SKILL: Converter Power BI .pbix em Dashboard Web

## Quando usar
- **Triggers explícitos**: "converte este .pbix", "replica esse dashboard", "transforma este relatório em site"
- **Triggers implícitos**: usuário fornece arquivo `.pbix` + pede algo navegável/interativo
- **Quando NÃO usar**: relatório estático (use PDF/markdown), análise de dados (use notebook/Python), dashboards que precisam de Power BI Embedded (use PBI Embedded SDK)

## Visão de 30 segundos

```
.pbix → pbix-parser extract → IR/ → pbix-storyboard → Storyboard + Parquet + Briefs/
                                                                ↓
                                                       LLM lê briefs + SDK
                                                          ↓           ↓
                                                    Composer    Generator
                                                    (rápido)    (criativo)
                                                          ↓           ↓
                                                   Dashboard Web (22 páginas)
```

Duas CLIs Python + uma SDK React = conversão completa de `.pbix` para dashboard web.

## Pré-requisitos

### Python (parser + storyboard)
- Python 3.11+
- `pbixray>=0.7.0`, `pydantic>=2`, `pandas>=2`, `pyarrow`, `typer`, `rich`
- Instalação: `pip install -e packages/pbix-storyboard`
- Parser: `pip install -e packages/pbix-parser`

### Node (runtime + app)
- Node 20+, pnpm
- `pnpm install` na raiz do monorepo
- App demo: `cd packages/pbix-web-app && pnpm dev`

## Workflow obrigatório (8 passos)

### Passo 1: Extrair IR do .pbix
```bash
pbix-parser extract --in "samples/regional_sales/Regional Sales Sample.pbix" --out samples/regional_sales/ir/
```
Gera `ir.json` + pasta `data/` com JSONs de cada tabela.

### Passo 2: Extrair Storyboard
```bash
pbix-storyboard extract --ir-dir samples/regional_sales/ir --out samples/regional_sales/
```
Gera `storyboard.json` + `STORYBOARD.md`.

### Passo 3: Converter dados para Parquet
```bash
pbix-storyboard data-to-parquet --ir-dir samples/regional_sales/ir --out samples/regional_sales/parquet
```
Gera 1 `.parquet` por tabela. Essenciais para performance (>50K linhas).

### Passo 4: Gerar briefs por página
```bash
pbix-storyboard brief --storyboard-file samples/regional_sales/storyboard.json --out samples/regional_sales/briefs
```
Gera 1 `.md` por página com narrativa, medidas, dimensões, importância de cada visual.

### Passo 5: Ler briefs + STORYBOARD.md
Cada brief contém:
- **Propósito da página**: narrativa em texto
- **Hero metric**: KPI principal
- **Visuals sorted by importance**: quais componentes usar
- **Data sources**: tabelas envolvidas
- **Filters**: slicers e cross-filters disponíveis

### Passo 6: Escolher modo (Composer vs Generator)
Ver [EVALUATION.md](./EVALUATION.md) para comparação completa.

| Situação | Modo |
|----------|------|
| Protótipo rápido | **Composer** |
| Dashboard padronizado | **Composer** |
| Visual consistente | **Composer** |
| Layout criativo | **Generator** |
| Visual customizado | **Generator** |
| Performance crítica | **Composer** |

### Passo 7: Gerar páginas
No modo **Composer**: 1 arquivo por página em `pages/composer/<Page>.tsx`, <150 linhas, imports só de `@pbix/runtime`.

No modo **Generator**: 1 arquivo por página em `pages/generator/<Page>.tsx`, sem limite de linhas, pode importar Recharts + criar componentes.

### Passo 8: Validar com checklist
Copie o checklist da seção "Validação" abaixo e marque cada item.

## Ferramentas que você TEM

### CLIs Python

| Comando | O que faz |
|---------|-----------|
| `pbix-parser extract` | Extrai IR completo de um .pbix |
| `pbix-storyboard extract` | Constrói Storyboard do IR |
| `pbix-storyboard data-to-parquet` | Converte JSON → Parquet |
| `pbix-storyboard brief` | Gera briefs markdown por página |

### SDK `@pbix/runtime` — símbolos exportados

**Data**
- `DuckDBProvider` — wrapper React que inicializa DuckDB-WASM
- `useDuckDb()` — hook para instância DuckDB singleton
- `loadParquet(db, url, tableName)` — carrega Parquet no DuckDB
- `registerTables(db, tables[])` — carrega múltiplos Parquets
- `QueryEngine` — classe para queries tipadas
- `arrowToJSON(table)` — converte Arrow → JS arrays

**State**
- `createDashboardStore()` — factory Zustand (não singleton)
- `useUrlSyncedFilters(store)` — sincroniza filtros com URL
- `selectActivePageBrief(state)`, `selectHeroVisuals(state)`, etc.

**Hooks**
- `useFilter(store, key)` — `[filter, setFilter, clearFilter]`
- `useFilters(store)` — todos os filtros ativos
- `useClearFilters(store)` — limpa filtros
- `useQueryHook({ engine, sql, params })` — SQL raw
- `useAggregation(engine, params)` — query agregada tipada
- `useDistinctValues(engine, table, column, filters?)` — para slicers
- `useTopN(engine, params)` — top N por medida
- `useStoryboard(store)` — storyboard atual
- `useActivePage(store)` — página ativa

**Visuals**
- `KpiCard` — card com valor agregado
- `BarChartVisual` — barras verticais/horizontais
- `LineChartVisual` — linhas com tendência
- `PieChartVisual` — pizza/donut
- `DataTableVisual` — tabela com virtualização opcional
- `SlicerVisual` — filtro de valores únicos
- `ComboChartVisual` — barras + linhas combinadas
- `ScatterChartVisual` — dispersão
- `TreemapVisual` — treemap hierárquico
- `FunnelVisual` — funil
- `GaugeVisual` — velocímetro radial
- `MapPlaceholder` — placeholder para mapas

**Layout**
- `DashboardShell` — header sticky + conteúdo
- `PageTabs` — navegação entre páginas
- `FilterBar` — chips de filtros ativos + clear

**Theme + Utils**
- `theme` — `{ colors, semantic, fontFamily, spacing, radius }`
- `PBI_PALETTE` — array de 8 cores Power BI
- `formatCompact`, `formatCurrency`, `formatPercent`, `formatNumber`
- `getTable`, `resolveColumn` — lookup tolerante

## Anti-patterns (não faça)

- ❌ **Filtrar/agregar em JS** — use `useAggregation` que gera SQL no DuckDB
- ❌ **position:absolute para layout** — use CSS grid responsivo (`grid grid-cols-12 gap-4`)
- ❌ **useState pra filtros globais** — use Zustand store via `createDashboardStore()`
- ❌ **Recharts default colors** — sempre use `theme.colors[i]`
- ❌ **JSON.parse de tabelas grandes** — Parquet via DuckDB é obrigatório para >5K linhas
- ❌ **Renderizar visuais chrome** — o storyboard já marca chrome como `chrome: true`, pule por padrão
- ❌ **Inventar números quando query falha** — mostre "—" ou componente de empty state
- ❌ **Copiar código entre páginas** — extraia componente compartilhado se repetir padrão
- ❌ **Importar Recharts no modo Composer** — use os visuais prontos de `@pbix/runtime`
- ❌ **Mocks de dados** — sempre use Parquet real via DuckDB

## Padrões obrigatórios

- ✅ Toda agregação passa por DuckDB (SQL), nunca JS array.filter/reduce
- ✅ Toda página Composer tem ≤150 linhas
- ✅ Todo visual tem skeleton/empty/error states
- ✅ Filtros sempre via store, nunca useState local
- ✅ Tabela usa `virtualized={true}` quando row_count > 200
- ✅ Cores sempre de `theme.colors` ou `PBI_PALETTE`
- ✅ Formatação numérica com `formatCurrency`, `formatCompact`, `formatPercent`

## Decisão Composer vs Generator

Baseado no EVALUATION.md:

| Dimensão | Composer | Generator |
|----------|----------|-----------|
| Consistência visual | ★★★★★ | ★★★☆☆ |
| Fidelidade ao storytelling | ★★★★☆ | ★★★★★ |
| Facilidade de debugging | ★★★★★ | ★★★☆☆ |
| Performance (bundle) | ★★★★★ (5-10KB/page) | ★★★☆☆ (30-879KB/page) |
| Tempo de desenvolvimento | ~15min/page | ~25min/page |
| Criatividade visual | ★★☆☆☆ | ★★★★★ |

**Recomendação**: Composer para 80% dos casos (speed + consistency), Generator para 20% especializados (custom maps, typographic narratives, complex interactions).

## Validação antes de declarar pronto

- [ ] App carrega em < 5s (LCP)
- [ ] Todas as N páginas renderizam no modo ativo
- [ ] KPIs mostram números **reais** (não hardcoded, não NaN)
- [ ] Tabelas mostram dados diferentes por linha
- [ ] Slicers populam com valores únicos
- [ ] Selecionar slicer atualiza outros visuais em < 500ms
- [ ] Charts usam colunas corretas (não ProductSeq aleatório)
- [ ] Não há sobreposição visível em nenhum visual
- [ ] ActionButtons/shapes não aparecem como "Unsupported"
- [ ] URL muda quando seleciona filtro (URL sync)
- [ ] F5 mantém filtros ativos
- [ ] Tema PBI aplicado consistentemente

Critério de sucesso: ≥10/12 passam.

## Como reportar falhas

Se uma conversão falhar, documente em HANDOFF.md com:
1. Nome do arquivo .pbix + source
2. Passo onde falhou (extract → storyboard → parquet → pages)
3. Erro exato ou comportamento observado
4. O que tentou + resultado
5. Blocker? (sim/não)

## Apêndices

- [COMPOSER_GUIDE.md](./COMPOSER_GUIDE.md) — padrões e receitas para modo Composer
- [GENERATOR_GUIDE.md](./GENERATOR_GUIDE.md) — padrões e receitas para modo Generator
- [PROMPT_TEMPLATE_COMPOSER.md](./PROMPT_TEMPLATE_COMPOSER.md) — template de prompt para modo Composer
- [PROMPT_TEMPLATE_GENERATOR.md](./PROMPT_TEMPLATE_GENERATOR.md) — template de prompt para modo Generator
- [EVALUATION.md](./EVALUATION.md) — comparação empírica Composer vs Generator
- [EXAMPLES/composer](../samples/regional_sales/screenshots/composer/) — screenshots do modo Composer
- [EXAMPLES/generator](../samples/regional_sales/screenshots/generator/) — screenshots do modo Generator
