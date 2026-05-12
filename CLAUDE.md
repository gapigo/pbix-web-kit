# CLAUDE.md — Constituição do pbix-web-kit

> Este arquivo é a fonte de verdade comportamental para qualquer LLM trabalhando neste repositório. Leia inteiro antes de qualquer ação. Em conflitos, este arquivo prevalece sobre o prompt do turno.

## 1. Missão

Converter arquivos `.pbix` (Power BI Desktop) em apps web React/Vite renderizando uma cópia funcional do dashboard original, **sem** dependência do Power BI Embedded ou de iframes. O kit é a base para que LLMs futuras automatizem essa conversão.

## 2. Princípios invioláveis

1. **Estruturado > Visual.** O `.pbix` é um zip de JSONs e dados estruturados. Sempre prefira extrair de `Report/Layout` (JSON) e PBIXRay (DataModel) antes de qualquer abordagem visual/OCR.
2. **IR como contrato.** Tudo passa pelo schema Pydantic `PbixIR`. Adicionar suporte a um visual = adicionar um mapper Python + um componente React. Nada mais.
3. **Dados reais, sempre.** Nunca commitar mocks no front. Se o IR não tem o dado, o componente mostra placeholder, não inventa.
4. **Determinismo > inteligência.** Prefira regras explícitas a heurísticas LLM. Heurística só onde regra não existe.
5. **Commits atômicos** com Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`).
6. **Worklog vivo.** Todo blocker, decisão de design, ou trade-off vai em `WORKLOG.md` no ato.

## 3. Stack obrigatória

- **Python**: 3.11+, `pyproject.toml`, Pydantic v2, Typer, pandas, **pbixray ≥ 0.5.0**.
- **Front**: Vite + React + TypeScript, Tailwind v4, shadcn/ui, Recharts (primary), d3 (escape hatch).
- **Validação**: Playwright (Python), pytesseract, Pillow.
- **Empacotamento**: monorepo simples com pastas em `packages/`. Sem turborepo/nx ainda — over-engineering para o overnight.

## 4. Layout do PbixIR (referência rápida)

```
PbixIR
├── source_file: str
├── pages: list[Page]
│   └── Page { name, display_name, width, height, visuals: list[Visual] }
│       └── Visual { id, type, raw_type, title, position, fields, config }
├── tables: list[TableSchema]
├── measures: list[{table, name, expression}]
└── relationships: list[{from_table, from_col, to_table, to_col, cardinality, active}]
```

**Tipos canônicos de Visual** (`Visual.type`):
- `kpi` — card único, número grande
- `bar` — qualquer barra/coluna (orientação no config)
- `line` — line/area
- `pie` — pie/donut
- `table` — table/matrix
- `slicer` — qualquer filtro on-canvas
- `text` — textbox estático
- `image` — imagem
- `unsupported` — tudo o resto, com `raw_type` preservado

## 5. Adicionar um novo tipo de visual (workflow)

1. Em `packages/pbix-parser/src/pbix_parser/visuals.py`: adicione a entrada no `RAW_TO_CANONICAL` e, se preciso, lógica especial no `parse_visual_container`.
2. Em `packages/pbix-web-app/src/components/visuals/`: crie `<Tipo>Visual.tsx` recebendo `{ visual: Visual, data: Record<string, any>[] }`.
3. Em `pbix-web-app/src/components/layout/ReportCanvas.tsx`: adicione o case no switch de renderização.
4. Teste com um sample que use esse visual; ajuste IR mapping se necessário.
5. Documente em `docs/HOW_TO_ADD_A_VISUAL.md`.

## 6. Tratamento de erros

- Pbix corrompido / não-pbix → `PbixParseError` com mensagem clara.
- Visual de tipo desconhecido → **não falhe**: emita `Visual(type="unsupported", raw_type=<original>)`. O front renderiza placeholder.
- Tabela referenciada num visual mas ausente no model → log warning, render placeholder, segue.
- Sempre fail-soft no parsing visual; fail-hard só no parsing do DataModel (sem dados, sem dashboard).

## 7. Cores e tema

Paleta default Power BI (use como fallback quando o tema do .pbix não estiver carregado):
```ts
export const PBI_DEFAULT_PALETTE = [
  "#118DFF", "#12239E", "#E66C37", "#6B007B",
  "#E044A7", "#744EC2", "#D9B300", "#D64550",
];
```
Tema do .pbix vive em `Report/StaticResources/SharedResources/BaseThemes/CY24SU10.json` (ou similar). Stretch goal.

## 8. Dimensionamento

- Power BI canvas default: **1280 x 720** logical pixels.
- Cada visual tem `position: {x, y, width, height}` em pixels lógicos.
- `ReportCanvas` é um container relativo de 1280x720; visuais com `position: absolute`.
- Responsividade: CSS `transform: scale(...)` no container; preserva proporção.

## 9. Testes obrigatórios

- `pbix-parser`: ≥1 teste por função pública. Smoke test do CLI no sample.
- `pbix-web-app`: build (`pnpm build`) tem que passar. Smoke test com Playwright opcional.
- `pbix-validator`: testa em 1 sample, retorna report estruturado.

## 10. Performance budgets

- Extract de um .pbix de 10 MB: < 30s.
- IR JSON serializado: < 5 MB sem dados (dados em arquivos separados).
- Bootstrap do web app: < 3s até primeiro render (com IR ≤ 5 visuais).
- Não otimize além disso no overnight.

## 11. Para LLMs futuras lendo este repo

Você está aqui porque alguém pediu pra você converter um `.pbix` em web. O workflow é:

```bash
pbix-parser extract --in arquivo.pbix --out ./ir/
cp -r ./ir/data/* packages/pbix-web-app/public/data/
cp ./ir/ir.json packages/pbix-web-app/src/data/ir.json
cd packages/pbix-web-app && pnpm dev
```

Se um visual aparecer como `<UnsupportedVisual>`, siga seção 5 deste arquivo.
Se o IR está vazio, rode `python scripts/spike_explore.py <arquivo.pbix>` para diagnóstico.

Bom trabalho. — humano signatário
