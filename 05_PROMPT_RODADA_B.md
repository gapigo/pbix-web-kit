# 🔧 RODADA B — Prompt Cirúrgico (10h)

> Cole isso como **primeiro turno** no Oh-my-pi com DeepSeek V4 Pro, na pasta `C:\Users\xgabr\workspace\pbi-test\`.
> **PRÉ-REQUISITO**: o arquivo `STATE_DUMP.md` precisa existir na raiz. Ele foi gerado pelo `dump_state.ps1` e contém o estado exato do código que você herda.

---

## 0. CONTEXTO — Quem você é e o que aconteceu

Você é o **agente de continuidade**. Um agente anterior (Rodada A) trabalhou 6h e entregou um repositório que **roda mas tem 5 bugs identificados pelo humano em screenshots reais**. Você herda esse repo e tem **10h** para corrigir os bugs e expandir cobertura.

**Não é trabalho do zero. É polimento cirúrgico.** Você NÃO vai redesenhar nada. Vai consertar partes específicas.

Antes de qualquer coisa, leia o arquivo `STATE_DUMP.md` da raiz inteiro. Ele tem o git log, estrutura do repo, todos os arquivos críticos no estado atual, e o output dos testes. Depois leia `CLAUDE.md` — a constituição do projeto não mudou. Depois leia `HANDOFF.md` da Rodada A.

**Apenas após essa leitura**, comece o trabalho.

---

## 1. OS 5 BUGS IDENTIFICADOS (em ordem de prioridade)

Pelas screenshots do app rodando (Regional Sales Sample) comparadas com o Power BI Desktop nativo:

### 🔴 BUG #1 — Agregação de medidas DAX não é aplicada (CRÍTICO)

**Sintoma**: KPIs mostram alguns números (26.4M, 77.3M) mas TABELAS mostram zeros em todas as células de valor. Slicer "Forecast Adjustment" diz "No data".

**Causa raiz**: O parser extrai medidas DAX (`m.dax_measures` do PBIXRay) mas o front **não as evalua**. Quando um visual referencia uma medida tipo `[Revenue Won] = SUM(Sales[Revenue])` filtrada por um contexto (linha da tabela, filtro de slicer), o app só lê a coluna crua sem aplicar a agregação. Resultado: zeros em massa.

**Solução exigida** — implementar um **mini-evaluator DAX** em TypeScript que cobre os 7 padrões mais comuns. Não é DAX completo. É um subset suficiente:

```ts
// packages/pbix-web-app/src/lib/measureEvaluator.ts
import _ from 'lodash';

type Row = Record<string, any>;
type MeasureExpr = string;  // "SUM(Sales[Revenue])"
type Context = { tables: Record<string, Row[]>, filters: Record<string, any[]> };

// Padrões a suportar:
// 1. SUM(Table[Col])
// 2. AVERAGE(Table[Col]) / AVG(Table[Col])
// 3. COUNT(Table[Col]) / COUNTROWS(Table)
// 4. MIN(Table[Col]) / MAX(Table[Col])
// 5. DISTINCTCOUNT(Table[Col])
// 6. DIVIDE(<expr>, <expr>[, fallback])
// 7. Referência a outra medida: [Measure Name]

export function evaluateMeasure(expr: MeasureExpr, ctx: Context, allMeasures: Map<string, string>): number | null {
  // 1. trim, strip comments
  // 2. tentar match dos 6 patterns acima via regex
  // 3. aplicar filtros do ctx.filters na tabela antes de agregar
  // 4. fallback: return null e log
}
```

**Para cada visual que usa uma medida** (campo `Field.aggregation === 'measure'` ou referência a `[Name]`), chame `evaluateMeasure` ao invés de ler coluna crua. Tabelas e cards passam a ter números reais.

**Onde aplicar**: `KpiCard.tsx`, `DataTableVisual.tsx`, e onde mais for needed nos charts. Use lodash pra grouping.

**Validação**: O KPI "Revenue Won" da página Sales Overview deve mostrar **26.4M** mesmo se você apagar o hardcode (se houver). E a tabela "Territory / State or Province / Revenue Won / Revenue In Pipeline" deve mostrar números **diferentes de zero** em cada linha (US-WEST, US-SOUTH etc).

### 🔴 BUG #2 — actionButtons e shapes poluem o canvas

**Sintoma**: Topo de cada página tem 6+ retângulos cinzas com texto "actionButton / Unsupported visual type" tomando 1/4 da tela. Mesmo problema com `shape`, `image` decorativa, `basicShape`.

**Causa raiz**: O parser está mapeando `actionButton` e `shape` como `Visual` no IR, e o front renderiza eles como `UnsupportedVisual`. Mas action buttons são **chrome de navegação**, não dados — devem ser **invisíveis ou minimamente renderizados** como botões pequenos.

**Solução exigida**:

1. Em `visuals.py`, adicione lista `CHROME_TYPES = {'actionButton', 'shape', 'basicShape', 'image', 'textbox', 'pageNavigator'}`. Para esses, gere `Visual(type='chrome', raw_type=...)`. Não pule do IR (preserva fidelidade), só marca diferente.

2. Em `ReportCanvas.tsx`, no switch de renderização, `case 'chrome': return null;` (ou renderize como um `<div>` minúsculo sem conteúdo se quiser preservar área). Action buttons só aparecem se você ativar uma flag `showChrome={true}` que default é `false`.

3. Para `textbox` real (com `text` no config), renderize como `<div className="text-sm">{config.text}</div>` sem fundo.

**Validação**: As 6 caixas "actionButton" no topo de cada página desaparecem. O canvas fica mais limpo, KPIs começam de cima.

### 🟡 BUG #3 — Layout cramped, labels sobrepostos

**Sintoma**: Texto vertical em barra ("E-reader Standard 6" 8 GB" empilhado), labels do eixo X colados, textos `nBl ippc ial t` repetindo horizontalmente (esses são UnsupportedVisuals truncados em linha).

**Causa raiz**:
- Recharts default trunca labels longos sem `tickFormatter`
- Container do bar chart está com `width` fixo pequeno
- Falta `<ResponsiveContainer>` envolvendo os Recharts
- UnsupportedVisuals (após filtrar chrome ainda restarão alguns como ribbonChart, scatterChart) renderizam com texto que vaza

**Solução exigida**:

1. **Todo Recharts envolve em `<ResponsiveContainer width="100%" height="100%">`**.

2. **Labels longos do eixo**: configure `<YAxis tickFormatter={truncate(15)} />` ou `<XAxis angle={-30} textAnchor="end" />` quando categoria > 10 chars.

```tsx
const truncate = (n: number) => (s: any) => {
  const str = String(s);
  return str.length > n ? str.slice(0, n) + '…' : str;
};
```

3. **UnsupportedVisual** com overflow controlado:
```tsx
<div className="border border-dashed border-gray-300 bg-gray-50/50 rounded p-2 text-xs text-gray-400 overflow-hidden">
  <div className="truncate font-mono">{visual.raw_type}</div>
  <div className="text-[10px] italic">Unsupported visual type</div>
</div>
```

4. **No `ReportCanvas`**, garanta que cada visual tem `overflow: hidden` no container e que `position: absolute` está respeitando z-index do Layout JSON (`vc.position?.z` se existir).

**Validação**: Bar chart com labels legíveis (não empilhados verticalmente em pixels mínimos). UnsupportedVisuals contidos em suas caixas, sem texto vazando.

### 🟡 BUG #4 — Tipos de visual faltando no mapper

**Sintoma**: Aparecem como "Unsupported visual type": `ribbonChart`, `scatterChart`, `comboChart`, `shapeMap`, `funnel`, `gauge`, `FlowVisual_*` (custom visual).

**Solução exigida** — expandir `RAW_TO_CANONICAL` e implementar os componentes:

| raw_type | canonical | componente |
|---|---|---|
| `ribbonChart` | `bar` | reusar `BarChartVisual` com prop `variant="ribbon"` |
| `comboChart`, `lineStackedColumnComboChart`, `lineClusteredColumnComboChart` | `combo` | novo `ComboChartVisual` (Recharts `<ComposedChart>` com Bar + Line) |
| `scatterChart` | `scatter` | novo `ScatterChartVisual` (Recharts `<ScatterChart>`) |
| `funnel` | `funnel` | novo `FunnelVisual` (Recharts `<FunnelChart>`) |
| `gauge` | `gauge` | novo `GaugeVisual` (Recharts `<RadialBarChart>`) |
| `treemap` | `treemap` | Recharts `<Treemap>` |
| `shapeMap`, `azureMap`, `filledMap` | `map` | placeholder estilizado com "Map unavailable" — não implementa, custa muito |
| custom (`FlowVisual_*`, etc.) | `unsupported` | mantém |

**Validação**: Pelo menos 4 novos tipos renderizam. O ribbonChart na página Pipeline Trends deve virar uma barra reconhecível, não um placeholder.

### 🟢 BUG #5 — Slicer não filtra

**Sintoma**: O slicer "Forecast Adjustment" mostra "No data" e mesmo se mostrasse, clicar nele não muda os outros visuais.

**Causa raiz**: 1) os valores únicos da coluna não estão sendo populados, 2) o `FilterContext` provavelmente armazena filtros mas os outros visuais não estão lendo.

**Solução exigida**:

1. Em `SlicerVisual.tsx`: extraia valores únicos da `Field` configurada usando `lodash.uniq` dos dados da tabela. Popule o `<Select>` com eles.
2. Quando o usuário muda a seleção, chame `setFilter(table, column, [selectedValues])`.
3. Em cada visual (`KpiCard`, `BarChartVisual`, etc.), antes de processar dados, aplique `filters` do contexto:
```ts
const filtered = useMemo(() => {
  return rows.filter(r => Object.entries(filters).every(([k, vals]) =>
    !vals?.length || vals.includes(r[k])
  ));
}, [rows, filters]);
```

**Validação**: Clicar numa opção do slicer atualiza KPI e tabela.

---

## 2. FASES DE EXECUÇÃO (10h)

### **FASE 0 — Diagnóstico (30 min)**

1. Leia `STATE_DUMP.md` inteiro
2. Leia `CLAUDE.md`, `HANDOFF.md`, `WORKLOG.md`
3. `pnpm dev` em `packages/pbix-web-app`, abra http://localhost:5173, confirme o estado relatado
4. Crie `WORKLOG_RODADA_B.md` com:
   - O que está funcionando hoje
   - Quais dos 5 bugs você confirmou nos screenshots
   - Sua interpretação de cada bug (com nome do arquivo onde está)
5. **Commit**: `chore(rodada-b): diagnostic baseline`

### **FASE 1 — BUG #2 actionButtons (45 min, primeiro porque é mais fácil e dá vitória visual rápida)**

Implemente em `visuals.py` o `CHROME_TYPES` e altere o parser. Adicione `case 'chrome'` no `ReportCanvas.tsx`. Re-extraia o IR, copie para o app. Verifique no navegador.

**Commit**: `fix(parser): mark actionButton/shape/image as chrome, hide by default`

### **FASE 2 — BUG #1 Evaluator de medidas (3h, o coração da rodada)**

Esta é a fase mais pesada. Trabalhe nela com **calma e testes**.

1. Crie `packages/pbix-web-app/src/lib/measureEvaluator.ts` com a função `evaluateMeasure`.
2. Implemente os 7 padrões em ordem (SUM, AVG, COUNT, MIN/MAX, DISTINCTCOUNT, DIVIDE, referência a [Measure]).
3. Crie tests Vitest em `lib/__tests__/measureEvaluator.test.ts` com 1 caso por padrão usando data sintética.
4. Atualize `KpiCard.tsx` para usar o evaluator.
5. Atualize `DataTableVisual.tsx` para, em cada linha, aplicar o evaluator com filtro de contexto (a linha do grupo).
6. Para charts, atualize `BarChartVisual.tsx` e `LineChartVisual.tsx` similarmente — cada categoria do eixo X é um filter context.

**Commit incremental por padrão**: `feat(evaluator): SUM`, `feat(evaluator): AVERAGE`, `feat(evaluator): wire to KpiCard`, etc.

Ao final desta fase: KPI "Revenue Won" mostra 26.4M sem hardcode. Tabela mostra números reais.

### **FASE 3 — BUG #3 Layout polish (1h)**

1. Wrap todos Recharts em `<ResponsiveContainer>`.
2. Adicione `tickFormatter` para truncate em todos os axes.
3. Atualize `UnsupportedVisual` com `overflow: hidden`.
4. `ReportCanvas` aplica `overflow: hidden` em cada `<div>` de visual.

**Commit**: `fix(web): responsive containers, truncate labels, contain overflow`

### **FASE 4 — BUG #4 Novos tipos de visual (3h)**

Implemente na ordem:
1. `ComboChartVisual` (combo) — 30 min
2. `ScatterChartVisual` (scatter) — 30 min
3. Reusar `bar` para `ribbonChart` — 15 min
4. `FunnelVisual` (funnel) — 30 min
5. `TreemapVisual` (treemap) — 30 min
6. `GaugeVisual` (gauge) — 30 min
7. `map` placeholder estilizado — 15 min

Cada um: atualize `RAW_TO_CANONICAL`, crie o `.tsx`, adicione case no `ReportCanvas`. **Commit por componente**.

### **FASE 5 — BUG #5 Slicer + cross-filter (1h)**

1. `SlicerVisual.tsx`: popula valores únicos com lodash, dispara `setFilter`.
2. Cria hook `useFilteredData(tableName)` que retorna os dados filtrados.
3. Refatora KpiCard, BarChart, LineChart, DataTable para usarem o hook.

**Commit**: `feat(slicer): wire cross-filter through context`

### **FASE 6 — Validação visual e tests (45 min)**

1. Rode `pnpm dev`, navegue pelas 11 tabs, tire screenshot de cada com Playwright em `samples/regional_sales/rodada_b/`.
2. Rode `pytest` (parser) e `pnpm test` (web).
3. Compare lado a lado com Power BI Desktop em pelo menos 3 páginas (Sales Overview, Pipeline Trends, Trend Analytics).

**Commit**: `test(rodada-b): visual regression snapshots`

### **FASE 7 — Polish + Handoff (30 min)**

1. Atualize `README.md` com o que mudou na Rodada B.
2. Crie `HANDOFF_RODADA_B.md` com:
   - Antes/depois de cada bug (descreva)
   - O que ainda está parcial
   - Próximos 3 passos
   - Lista dos novos tipos de visual suportados
3. **Commit final**: `chore(rodada-b): handoff`

---

## 3. REGRAS DE EXECUÇÃO

### 3.1 Não-negociáveis
- **Não desfaça** o trabalho da Rodada A. Adicione, refine, refatore com cuidado. Se um arquivo está funcional mesmo que feio, melhore-o; não reescreva.
- **Antes de tocar um arquivo**, dê `git log -p <arquivo>` pra entender as decisões anteriores.
- Toda mudança em parser → re-extraia o IR → copie pro app → cheque visualmente.
- **Sem mocks de dados**. Tudo do `.pbix` real, agora com agregação correta.

### 3.2 Quando um padrão DAX não cobre
Se uma expressão DAX é complexa demais pro evaluator (ex: `CALCULATE(...)`, `FILTER(...)`, `SUMX(...)`), faça:
1. Loga em `WORKLOG_RODADA_B.md` como "DAX skipped: <expr>"
2. Retorna `null` do evaluator
3. Visual mostra `—` (em-dash) ao invés de quebrar

Não tente implementar DAX completo. É buraco sem fim.

### 3.3 Stopping rules
- **Pare** se passar 9h30 — guarde 30min pra handoff.
- **Pare** se tentou 3x consertar o mesmo bug e ele continua quebrado. Marque como `⚠️ blocker` no handoff e siga pro próximo.
- **Pare** se `pnpm build` quebrar e você não conseguir consertar em 30min. Revert e siga.

### 3.4 Persistência
- Não pergunte. O humano dorme/trabalha. Decisões ambíguas: escolha a mais simples, anote, siga.
- A cada hora cheia, faça commit do que tiver, mesmo que parcial. Granularidade > vitória total.

### 3.5 Anti-patterns
- ❌ Adicionar DAX engine completo (use o subset).
- ❌ Re-baixar o sample ou trocar pra outro pbix.
- ❌ Mudar a estrutura de pastas. O monorepo está OK.
- ❌ Rodar `npm`/`yarn` se `pnpm` já está funcionando.
- ❌ Comentários TODO sem ticket correspondente no worklog.
- ❌ Renderizar imagem de KPI numa screenshot estática como prova. **Tire de página real rodando**.

---

## 4. CRITÉRIO DE SUCESSO

Quando você terminar, o humano vai abrir `pnpm dev` e julgar:

### Must-have (sem isso é falha):
- ✅ Action buttons sumiram do topo de todas as páginas
- ✅ KPIs mostram números **plausíveis** (26.4M, 77.3M, etc.) sem hardcode
- ✅ Tabelas mostram números **diferentes de zero** nas células de valor
- ✅ Slicer (Forecast Adjustment) tem opções e filtra ao menos 1 visual
- ✅ `pnpm build` passa
- ✅ Pytest passa

### Should-have:
- ✅ Pelo menos 3 novos tipos de visual renderizam (combo, scatter, treemap)
- ✅ Labels longos não sobrepõem
- ✅ Cross-filter funciona em ≥2 visuais

### Nice-to-have:
- ✅ Gauge ou Funnel renderizam
- ✅ Map placeholder estilizado
- ✅ Tema do Power BI carregado das cores do .pbix

---

## 5. CHEAT SHEET

```powershell
# Re-extrair IR (faça após mudar parser)
cd packages\pbix-parser
pbix-parser extract --in ..\..\samples\regional_sales\Regional` Sales` Sample.pbix --out ..\..\samples\regional_sales\ir\
cp ..\..\samples\regional_sales\ir\ir.json ..\pbix-web-app\src\data\ir.json
cp -r ..\..\samples\regional_sales\ir\data\* ..\pbix-web-app\public\data\

# Web
cd ..\pbix-web-app
pnpm dev      # http://localhost:5173
pnpm build    # validation
pnpm test     # vitest

# Validator
cd ..\pbix-validator
pbix-validator check --ir ..\..\samples\regional_sales\ir\ir.json --url http://localhost:5173
```

---

## 6. ENTREGA ESPERADA

Ao final, eu (humano) vou:
1. `git log --oneline` → espero ≥15 commits convencionais (vs os 4 da Rodada A)
2. `bash scripts/02_run_web.sh` → web sobe
3. Abrir http://localhost:5173 → ver Sales Overview SEM actionButtons, KPIs corretos, tabela com números
4. Clicar Pipeline Trends → ver ComboChart ou Funnel renderizando
5. Clicar no slicer Forecast Adjustment → ver outro visual mudar
6. Ler `HANDOFF_RODADA_B.md` → entender em 90 segundos o que mudou

**Vai.**

---

## 7. CLAUDE.md REVISÃO

O `CLAUDE.md` da Rodada A continua válido. Adicione uma seção no final dele:

```markdown
## 12. Evaluator de medidas (adicionado Rodada B)

Visuais com fields agregados (medidas DAX ou `aggregation` setado) usam `src/lib/measureEvaluator.ts` no front. Padrões suportados:
- SUM, AVERAGE/AVG, COUNT/COUNTROWS, MIN, MAX, DISTINCTCOUNT, DIVIDE
- Referência a outra medida via `[Name]`

Não implementa CALCULATE, FILTER, SUMX, ou qualquer DAX que muda filter context. Se a expressão não casa nenhum padrão, retorna `null` e o visual mostra `—`.

Para adicionar um padrão novo:
1. Adicione função em `measureEvaluator.ts`
2. Adicione teste em `__tests__/measureEvaluator.test.ts`
3. Adicione case no switch da função `evaluateMeasure`

## 13. Chrome visuals

Tipos do raw layout que são chrome (não dados):
- actionButton, shape, basicShape, image, textbox, pageNavigator

São extraídos no IR como `Visual(type='chrome')` mas o `ReportCanvas` renderiza como `null` por default. Toggle via `showChrome` prop se quiser preservar.
```

Faça commit dessa adição: `docs(claude): rodada B sections`.

---

Boa sorte. Você herdou trabalho bom. Faz ele ficar **honesto**.
