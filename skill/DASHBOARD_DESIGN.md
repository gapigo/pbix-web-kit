# Dashboard Design System — pbix-web-kit

## 1. Filosofia

Dashboard executivo B2B. Dados confiáveis, hierarquia clara, zero frivolidade.
Cada pixel justifica sua existência — se não comunica informação, é ruído.
A identidade visual replica o padrão Power BI: fundo cinza claro, cards brancos com sombra sutil, tipografia limpa.

## 2. Paleta de Cores

### Primária (dados e ação)
- Brand Blue:    #0F52BA   (KPIs principais, barras primárias, links)
- Deep Navy:     #0A2342   (headers, texto principal)
- Electric Blue: #1B6FEB   (hover states, seleção ativa)

### Semântica
- Revenue/Success: #1A7A4A  (verde escuro, não verde lima)
- Warning:         #C17D00  (âmbar, nunca amarelo puro)
- Danger/Loss:     #B91C1C  (vermelho escuro)
- Neutral:         #6B7280  (labels, textos secundários)

### Superfície
- Background page: #F8FAFC  (quase branco, não branco puro)
- Background card: #FFFFFF  com box-shadow: 0 1px 3px rgba(0,0,0,0.08)
- Background hover: #F1F5F9
- Border:          #E2E8F0  (1px, nunca mais espesso)
- Border active:   #0F52BA  (quando selecionado)

### Charts — 8 cores em ordem de uso
#0F52BA → #1A7A4A → #C17D00 → #7C3AED → #0891B2 → #BE185D → #92400E → #374151

## 3. Tipografia

- Font family: "Inter", system-ui, -apple-system, sans-serif
- Importe via Google Fonts no index.html

| Uso | Size | Weight | Color | Letter-spacing |
|---|---|---|---|---|
| KPI principal | 2rem (32px) | 700 | #0F52BA ou semântica | -0.02em |
| KPI label | 0.75rem (12px) | 500 | #6B7280 | 0.06em uppercase |
| Card title | 0.875rem (14px) | 600 | #0A2342 | 0 |
| Chart axis | 0.6875rem (11px) | 400 | #9CA3AF | 0 |
| Table header | 0.75rem (12px) | 600 | #374151 | 0.04em uppercase |
| Table cell | 0.875rem (14px) | 400 | #1F2937 | 0 |
| Page title | 1.25rem (20px) | 700 | #0A2342 | -0.01em |
| Section label | 0.6875rem (11px) | 600 | #6B7280 | 0.08em uppercase |
| Filter chip | 0.75rem (12px) | 500 | #0F52BA | 0 |

## 4. Espaçamento e Layout

- Page padding: 24px (1.5rem) em todos os lados
- Gap entre cards: 16px (1rem)
- Padding interno do card: 20px (1.25rem)
- Border radius do card: 8px (0.5rem)
- Border radius de badges/chips: 9999px

Grid padrão:
- Desktop: 12 colunas, gap 16px
- KPI row: 4 colunas iguais (col-span-3 each)
- Chart large: col-span-8
- Chart small / table: col-span-4
- Full width: col-span-12

## 5. Componentes KPI Card

```
┌─────────────────────────────────────┐
│ REVENUE WON           ↑ +12.4%      │  ← label (uppercase 11px) + delta badge
│                                     │
│ $26.4M                              │  ← valor (32px, 700, Brand Blue)
│                                     │
│ vs $23.5M previous period           │  ← contexto (11px, Neutral)
└─────────────────────────────────────┘
```

Obrigatório:
- Label em uppercase com letter-spacing
- Delta badge: fundo verde/vermelho 10% opacity, texto semântico
- Valor nunca trunca — se não cabe, reduce para $26M, nunca "26,435,..."
- Hover: box-shadow aumenta levemente, cursor default (não pointer)

## 6. Componentes Chart

Regras absolutas:
- Sempre `<ResponsiveContainer width="100%" height={HEIGHT}>` onde HEIGHT é número fixo em px
- Tooltip customizado: fundo branco, border 1px #E2E8F0, border-radius 6px, padding 8px 12px
  - Label do tooltip: 11px uppercase neutral
  - Valor do tooltip: 14px 600 com formatação correta ($1.2M, não 1234567)
- Eixo X: 11px, #9CA3AF, sem borda, apenas tick lines
- Eixo Y: mesmo estilo, valores formatados ($1M, $2M, não 1000000)
- Grid lines: horizontal apenas, 1px #F1F5F9 (quase invisível)
- Sem legend quando há apenas 1 série
- Legend quando há 2+ séries: inline abaixo do chart, 12px, ícone 8px circle

Alturas padrão:
- Bar/Line chart large: 280px
- Bar/Line chart small: 200px
- Pie/Donut: 220px com innerRadius=70 para donut
- Scatter: 260px
- Funnel: 180px

## 7. Componentes Tabela

```
TERRITORY        REVENUE WON    PIPELINE    CLOSE %
────────────────────────────────────────────────────
US-SOUTH         $4.6M          $18.2M      36.4%
US-WEST          $3.5M          $14.8M      31.2%
```

Regras:
- Header: 12px uppercase letter-spacing 0.04em, #374151, peso 600
- Linha: 14px, #1F2937, altura 40px, border-bottom 1px #F1F5F9
- Hover na linha: background #F8FAFC
- Coluna numérica: alinhada à direita, font-variant-numeric: tabular-nums
- Coluna texto: alinhada à esquerda
- Primeira coluna: sticky se tabela > 5 colunas
- Scroll interno se > 8 linhas (max-height com overflow-y: auto)
- Sem "NaN", sem "undefined" — mostrar "—" quando sem dado

## 8. Filtros e Slicers

REGRA: Toda página DEVE ter pelo menos 1 filtro funcional que afete os demais visuais.

Slicer visual:
```
┌─ SALES STAGE ──────────────────────┐
│ [●] All stages                     │
│ [ ] 1-Qualify     (9.0K)           │
│ [ ] 2-Develop     (5.0K)           │
│ [ ] 3-Propose     (4.0K)           │
│ [ ] 4-Close       (2.0K)           │
└────────────────────────────────────┘
```

Ou como chips inline:
```
Filter by:  [All ×]  [US-WEST ×]  [2022 ×]  [+ Add filter]
```

Comportamento obrigatório:
- Clicar num valor filtra TODOS os visuais da mesma página instantaneamente
- Estado "All" = sem filtro aplicado
- Estado selecionado: fundo Brand Blue 10% opacity, borda Brand Blue, texto Brand Blue
- Clear button: aparece quando há filtro ativo, "×" remove
- Contador de resultados atualiza: "Showing 1,234 of 20,000 opportunities"

## 9. Estados de Loading e Vazio

Loading:
- Skeleton animation: background linear-gradient animado de #E2E8F0 para #F1F5F9
- KPI skeleton: retângulo 32px height
- Chart skeleton: retângulo com height do chart
- Table skeleton: 5 linhas de retângulo

Vazio:
- Ícone 24px neutral, texto "No data for selected filters", link "Clear filters"
- Nunca "—" sozinho sem contexto

Erro:
- Ícone ⚠️ 16px warning, texto curto do erro, botão "Retry"
- Nunca traceback ou texto técnico visível ao usuário

## 10. Header do Dashboard

```
┌────────────────────────────────────────────────────────────────┐
│ Regional Sales Sample          [Composer] [Generator]  ← toggle│
│ ─────────────────────────────────────────────────────────────  │
│ Sales Overview  Win/Loss  Industries  Pipeline  Analytics ...  │
│                 ↑ active tab: fundo branco, borda azul bottom  │
└────────────────────────────────────────────────────────────────┘
```

- Background do header: #FFFFFF, border-bottom 1px #E2E8F0
- Tab ativa: text Brand Blue, border-bottom 2px Brand Blue, weight 600
- Tab inativa: text #6B7280, sem borda, hover background #F8FAFC
- Título: 14px, 600, #0A2342

## 11. Anti-patterns (nunca faça)

- ❌ Cores Recharts default (azul #8884d8, verde #82ca9d) — use nossa paleta
- ❌ Tailwind gray-* como cor primária de dado
- ❌ border-radius > 12px em cards (parece toy)
- ❌ Sombras excessivas (parece Material 2015)
- ❌ Qualquer texto > 600 weight exceto KPI principal
- ❌ Grid sem gap (elementos colados)
- ❌ Labels de eixo Y com números crus (1000000 ao invés de $1M)
- ❌ Tooltip sem formatação
- ❌ Página sem filtro
- ❌ Charts com height percentual (quebra no ResponsiveContainer)
- ❌ Tabela com todas as linhas com mesmo valor (bug de query)
- ❌ "Unsupported visual type" visível ao usuário
- ❌ Qualquer fonte diferente de Inter (inconsistência)
