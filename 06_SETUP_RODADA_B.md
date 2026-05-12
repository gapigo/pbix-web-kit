# 🚀 RODADA B — Guia de operação (3 minutos antes de sair pro trabalho)

## Os 3 passos

### Passo 1 — Gerar STATE_DUMP.md (30 segundos)

Abra PowerShell na pasta do repo:

```powershell
cd C:\Users\xgabr\workspace\pbi-test
```

Cole o conteúdo do `04_DUMP_COMMAND.md` (a parte do script) num arquivo `dump_state.ps1` e rode:

```powershell
notepad dump_state.ps1
# cole o script, salva
pwsh dump_state.ps1
```

Você vai ver: `✅ Generated STATE_DUMP.md — XX KB`

**Confira rápido**: abra `STATE_DUMP.md`, role até a seção 4 (Análise do IR), e veja se aparecem as 11 páginas com contagem de visuais. Se sim, dump funcionou.

### Passo 2 — Lançar o agente (1 minuto)

```powershell
cd C:\Users\xgabr\workspace\pbi-test
omp --model deepseek/deepseek-v4-pro 2>&1 | Tee-Object overnight_rodada_b.log
```

**No primeiro turno, cole DUAS coisas:**

1. **O conteúdo inteiro do `05_PROMPT_RODADA_B.md`** (~22 KB de instrução cirúrgica)
2. **Logo após**, na mesma mensagem, anexe o conteúdo de `STATE_DUMP.md` envolto em uma seção:

```
---

## ANEXO — STATE_DUMP.md

<cole aqui o conteúdo inteiro do STATE_DUMP.md>
```

Se o STATE_DUMP.md for >150 KB, recorte só as seções 1, 4, 6, 7, 8, 9, 10, 11 (são as que importam para os 5 bugs).

### Passo 3 — Pré-aprovações (30 segundos)

Mesmo combo de antes:
- Auto-approve `Bash(*)`, `Edit(*)`, `Read(*)`
- Auto-approve `pnpm *`, `pip *`, `git *`, `python *`, `node *`, `npx *`, `npm *`
- Set `max-tokens` no contexto: alto (deepseek v4 pro aguenta)
- Tempo limite: 10h reais (não tempo wall-clock do modelo)

E vai.

---

## Checklist de manhã (5 min)

Quando você voltar do trabalho:

```powershell
cd C:\Users\xgabr\workspace\pbi-test
git log --oneline | head -20
cat HANDOFF_RODADA_B.md
```

**Quick smell test:**
- 15+ commits convencionais? ✅
- HANDOFF_RODADA_B.md menciona os 5 bugs por nome? ✅
- Existe `WORKLOG_RODADA_B.md` com timestamps? ✅

**Teste visual:**
```powershell
cd packages\pbix-web-app
pnpm dev
# abre http://localhost:5173
```

Roda a tab Sales Overview:
- Os actionButtons sumiram do topo? ✅ Bug #2 resolvido
- KPIs ainda mostram 26.4M / 77.3M? ✅ Bug #1 não regrediu
- A tabela embaixo mostra números diferentes de zero? ✅ Bug #1 resolvido
- Clica em Pipeline Trends, tem ComboChart ou Funnel renderizando? ✅ Bug #4 resolvido
- Slicer Forecast Adjustment tem opções? Clica uma, outro visual muda? ✅ Bug #5 resolvido
- Bar chart tem labels legíveis (não empilhados em pixels)? ✅ Bug #3 resolvido

## Cenários possíveis ao acordar

### 🍾 Cenário A — Sucesso (5 bugs OK + 3 novos visuais)
Tira screenshots, comemora, considera postar. O kit virou usável.

### 🎯 Cenário B — Sucesso parcial (3-4 bugs OK)
Olha qual ficou. Se foi #1 (evaluator), foi vitória — é o mais difícil. Se faltou #5 (slicer), são 30 min seus pra ajustar.

### 🤔 Cenário C — Só commits, nada de melhoria visual
Erro de orquestração. Olha `overnight_rodada_b.log` pelas primeiras 2h — provavelmente travou tentando entender o STATE_DUMP. Próxima rodada: dump mais enxuto.

### ⚠️ Cenário D — Quebrou o que funcionava
Worst case. `git reflog` + `git reset --hard <commit antes da rodada B>` recupera. O backup é o repo da Rodada A intacto.

---

## Tunados que apliquei vs Rodada A

| Coisa | Rodada A | Rodada B |
|---|---|---|
| Foco | Construir do zero | 5 bugs nomeados |
| Tempo | 6h | 10h (mais folga) |
| Granularidade de commit | 1 por fase | 1 por padrão DAX + 1 por componente novo |
| Critério de sucesso | "app sobe" | "screenshot bate com Power BI Desktop" |
| Anti-pattern principal | OCR puro / Xpress9 | DAX engine completo |
| Estado inicial | Pasta vazia | Repo funcional + STATE_DUMP |
| Anchor de verdade | Os 3 samples Microsoft | Os screenshots que vc tirou |

Boa noite no trabalho. Boa noite pro agente. 🌙
