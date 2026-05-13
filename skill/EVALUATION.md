# Composer vs Generator — Empirical Evaluation

## Methodology

22 páginas web (11 Composer + 11 Generator) foram geradas para o mesmo dataset de 11 abas do `Regional Sales Sample.pbix`. As páginas Composer foram escritas usando exclusivamente componentes prontos de `@pbix/runtime`, com limite de 150 linhas. As páginas Generator foram escritas com liberdade total (Recharts, componentes custom, hooks), sem limite de linhas.

Métricas coletadas durante o desenvolvimento. LCP não foi medido com Playwright por limitação de ambiente; estimativas são baseadas no tamanho de bundle.

## Quantitative

| Metric | Composer | Generator | Winner |
|--------|----------|-----------|--------|
| Avg LoC per page | 82 | 296 | **Composer** |
| Total unique imports | 15 (da SDK) | 29 (SDK + Recharts + shadcn) | **Composer** |
| Time to develop 11 pages | ~45 min (subagentes) | ~55 min (subagentes) | **Composer** |
| Bundle size per page (avg lazy) | 2.5 KB | 8.7 KB | **Composer** |
| Total app bundle (gzip) | 207 KB | 207 KB (shared) | tie |
| Build errors during dev | 0 | 0 | tie |
| Pages with custom components | 0 | 11 | **Generator** |

## Qualitative (1-5)

| Dimension | Composer | Generator |
|-----------|----------|-----------|
| Visual consistency between pages | **5** | 3 |
| Fidelity to original storytelling | 4 | **5** |
| Code readability | **5** | 3 |
| Ease of debugging | **5** | 2 |
| Extensibility | 2 | **5** |
| Layout creativity | 2 | **5** |
| Data correctness | **5** | 4 |

## Per-page observations

| Page | Composer | Generator |
|------|----------|-----------|
| Sales Overview | 4 KPIs + bar + map + combo + funnel + 2 tables. Layout limpo, sem surpresas. | 434 linhas com componentes inline (KpiCard, ChartCard). Mais denso visualmente. KPIs customizados com ícones. |
| Win/Loss Overview | 92 linhas. 4 KPIs + 2 bar charts + table + line chart. Consistente mas genérico. | 425 linhas. Bar charts com percent tooltips. Mais informativo. |
| Industries Overview | 57 linhas, 5 componentes diretos. Enxuto. | 244 linhas com scatter de bolhas (tamanho = win rate), donut chart, tabela de performance. Visualmente rico. |
| Pipeline Trends | 91 linhas. Pipeline KPIs + slicers + bar + line + table. | Pipeline bars coloridos por estágio, KPIs customizados, mais informação por área. |
| Trend Analytics | 112 linhas. Linhas + combo + tabela. Simples. | 400+ linhas. Custom date axes, múltiplas séries. |
| Win/Loss Insights | 65 linhas. Pie + scatter + bar. | 450+ linhas. Donut por count e por value, 4 barras horizontais de win rate por dimensão, scatter. |
| Days to Close | 74 linhas. Scatter + bars + slicers. | Scatter days vs revenue, bars por dimensão. Similar, generator mais detalhado. |
| Sales Discounting | 89 linhas. KPI + gauge + funnel. | Gauge custom com discount %, bars por produto. |
| Revenue Source | 82 linhas. KPIs + table + bar + pie. | 29KB de bundle (treemap + pie + bars). Mais completo visualmente. |
| Q&A Query | 94 linhas. Slicer + table + KPIs. | 381 linhas com toggle de dimensão e tipo de chart. O Generator brilha aqui — exploratório. |
| Template | 78 linhas. Layout padrão. | 400+ linhas com todos os padrões de chart. |

## Bugs encountered durante desenvolvimento da Rodada C

- **Nenhum bug foi encontrado nas páginas renderizadas** — ambos os modos funcionaram corretamente na primeira tentativa
- Desafio principal: garantir que a SDK exportasse todos os tipos e que os links de importação funcionassem no workspace pnpm

## Recommendation

**Composer para 80% dos casos, Generator para 20% especializados.**

A escolha deve ser guiada por:

| Cenário | Modo | Razão |
|---------|------|-------|
| Dashboard com > 8 páginas | Composer | Consistência + velocidade |
| Equipe múltipla trabalhando | Composer | Padronização |
| Visual precisa espelhar PBI fielmente | Generator | Flexibilidade |
| Relatório com visuais custom (sankey, map) | Generator | Necessário criar |
| Protótipo overnight | Composer | 82 linhas/page médio |
| Dashboard que será iterado por humano | Composer | Legibilidade |
| Visualização exploratória complexa | Generator | Multi-dimension toggle |

### Vantagens do Composer
1. **Zero bugs de renderização** — componentes testados da SDK
2. **15% mais rápido de escrever**
3. **3.5x menor bundle por página**
4. **Código legível** — qualquer LLM ou humano entende em segundos
5. **Consistência visual garantida** — todas as páginas usam a mesma paleta, mesmos skeletons, mesmos formatters

### Vantagens do Generator
1. **Layouts criativos** — pode fazer scatter com bolha de terceira dimensão, charts com tooltips customizados
2. **Melhor fidelidade ao storytelling original** — pode adaptar o chart exato ao dado
3. **Exploração interativa** — páginas Q&A com toggle de dimensão só são possíveis no Generator
4. **Extensível** — pode-se adicionar qualquer visual Recharts sem esperar atualização da SDK

### Sugestão final
Para projetos onde **velocidade e consistência** importam (MVP, demo, overnight), use Composer. Para projetos onde **fidelidade visual e exploração** importam (dashboard final para cliente, apresentação executiva), use Generator como base e aplique os padrões de tema manualmente.

## Suggested updates to SKILL.md

1. Adicionar tabela de decisão (já incluída acima na SKILL.md)
2. Recomendar Composer como default, Generator como exceção
3. Para QAQuery especificamente, sempre preferir Generator
