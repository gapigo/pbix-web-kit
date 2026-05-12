# pbix-web-kit

> Convert Power BI `.pbix` files into functional web dashboards using React.  
> No Power BI Embedded, no iframes — native React rendering from extracted data.

## Architecture

```
.pbix ──► pbix-parser ──► PbixIR (JSON) ──► pbix-web-app (React)
              │                                  │
              ▼                                  ▼
         Data JSON files                  Recharts + shadcn/ui
```

## Quick Start

```bash
# 1. Bootstrap
bash scripts/00_bootstrap.sh

# 2. Extract a sample
bash scripts/01_extract.sh samples/regional_sales/Regional\ Sales\ Sample.pbix

# 3. Run the web app
bash scripts/02_run_web.sh
```

Open http://localhost:5173 to see the dashboard.

## Packages

| Package | Description |
|---------|-------------|
| `pbix-parser` | Python lib to extract `.pbix` → canonical PbixIR |
| `pbix-web-app` | Vite + React + Recharts app to render the IR |
| `pbix-validator` | Playwright-based validation of rendered output |

## PbixIR Schema

See [docs/IR_SCHEMA.md](docs/IR_SCHEMA.md) for the full intermediate representation schema.

## Adding Visuals

See [docs/HOW_TO_ADD_A_VISUAL.md](docs/HOW_TO_ADD_A_VISUAL.md) for extending support to new visual types.

## Supported Visual Types

- KPI cards (single number)
- Bar/Column charts
- Line/Area charts
- Pie/Donut charts
- Tables (sortable)
- Slicers (checkbox filter)
- Text boxes, images, shapes (pass-through)

## License

MIT — built for automation by LLMs.
