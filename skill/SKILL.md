# SKILL: Converter .pbix em Dashboard Web

## Modo padrão: GENERATOR

O kit tem dois modos históricos: Composer e Generator. **Use sempre Generator.**
O Composer é legado — existe para compatibilidade, não deve ser o caminho padrão.

Generator = liberdade criativa com disciplina de dados.
O agente usa os primitives de dados (@pbix/runtime hooks) mas tem liberdade de criar
layouts, componentes e visual design próprio, desde que siga o DASHBOARD_DESIGN.md.

## O que Generator pode fazer
- Criar componentes React customizados
- Usar Recharts diretamente (não os wrappers do Composer)
- Layouts próprios com CSS Grid / Flexbox
- Qualquer design que siga DASHBOARD_DESIGN.md

## O que Generator NÃO pode fazer
- Usar Recharts default colors (#8884d8) — use designTokens.colors.chart
- Criar filtros que não funcionem (filtro decorativo é pior que sem filtro)
- Exibir timestamps ISO como labels de eixo
- Deixar charts vazios sem mensagem de erro
- Exibir valores idênticos em tabelas agrupadas (indica bug de query)
- Deixar KPIs sem label descritivo acima do número

## Workflow obrigatório

1. `pbix-storyboard extract` → lê o .pbix
2. `pbix-storyboard data-to-parquet` → converte dados
3. `pbix-storyboard brief` → gera briefs por aba
4. Leia DASHBOARD_DESIGN.md — é a lei visual
5. Implemente QueryValidator v2 (35 checks)
6. Gere páginas Generator uma por vez
7. Após cada página: screenshot → 5 perguntas → corrija se necessário
8. Teste cross-filter em cada página
9. Commit por página validada

## Para dashboards novos (sem .pbix)

1. Gere dados sintéticos realistas com Python
2. Crie parquets na pasta `packages/pbix-web-app/public/data/<nome>/`
3. Adicione parquet ao `PARQUET_TABLES` no `boot.tsx`
4. Crie `CREATE VIEW` no `boot.tsx` com colunas computadas
5. Crie `STORYBOARD.md` manual com narrativa e briefs
6. Crie páginas Generator que usam `v_<nome>` como tabela

## Perguntas de auto-validação (após cada screenshot)
1. Os KPIs usam Brand Blue (#0F52BA) e têm label uppercase acima?
2. Os charts têm dados reais (não empty state com filtro neutro)?
3. Clicando num filtro, outros visuais mudam?
4. Nenhum eixo X mostra timestamp ISO?
5. Nenhum tooltip mostra número sem formatação?

## Checklist de qualidade visual

Antes de commitar qualquer página, verificar:
- [ ] KPI label uppercase 11px + valor 32px bold + cor semântica ou Brand Blue
- [ ] Filtros: pelo menos 1 por página, funcional, com clear button
- [ ] Cross-filter: clicar num filtro atualiza TODOS os visuais da mesma página
- [ ] Charts: ResponsiveContainer com height numérico (não percentual)
- [ ] Tooltips customizados (não Recharts default)
- [ ] Eixo X com datas: tickFormatter aplicado (ex: 'Jan 23' não '2023-01-15T00:00')
- [ ] Eixo Y com moeda: formatter aplicado ('$1.2M' não '1200000')
- [ ] Tabelas: dados diferentes por linha, header uppercase, zebra stripe
- [ ] Charts vazios: mostram empty state com mensagem, não área em branco
- [ ] window.__query_issues__ retorna [] ou só warnings
- [ ] Filtros de página diferentes NÃO persistem entre páginas

## Estrutura do projeto

```
packages/
  pbix-runtime/         # Engine de dados + hooks React
    src/
      data/             # QueryEngine, QueryValidator, autoFormat
      hooks/            # useFilter, useAggregation, useDistinctValues
      visuals/          # Componentes visuais (Composer)
  pbix-web-app/         # Aplicação web
    src/
      lib/
        designTokens.tsx  # Tokens de design + helpers
      pages/
        generator/        # 11 páginas Generator (Regional Sales)
        generator-ecommerce/  # 6 páginas E-Commerce (quando aplicável)
        composer/         # 11 páginas Composer (legado)
      boot.tsx           # Init: parquet, views, validator
      App.tsx            # Router + dashboard toggle
```

## Sobre os datasets

### Regional Sales (padrão)
- Tabela: `v_opportunities` — vendas B2B
- Coluna monetária: `Value`
- Coluna de data: `CloseDate` (string ISO)
- 9 parquets de dimensão + Opportunities fato

### E-Commerce (quando ativado)
- Tabela: `v_orders` — vendas varejo
- Coluna monetária: `Sales`
- Coluna de lucro: `Profit`
- Coluna de data: `Order_Date`
- 1 parquet (Orders) com 5000+ linhas
- 6 páginas: Executive Overview, Product Analysis, Regional Performance, Discount Impact, Customer Segments, Shipping Analysis
