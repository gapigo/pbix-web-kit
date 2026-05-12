# pbix-web-app

Vite + React + Recharts app that renders a PBIX dashboard from the PbixIR format.

## Usage

```bash
cd packages/pbix-web-app
pnpm install
pnpm dev
```

Place `ir.json` in `src/data/` and table data in `public/data/`.

## Stack

- Vite 8 + React 19 + TypeScript 6
- Tailwind CSS v4
- Recharts 3
- shadcn/ui (Button, Card, Select)
