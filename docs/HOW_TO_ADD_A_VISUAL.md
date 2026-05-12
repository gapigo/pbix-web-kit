# How to Add Support for a New Visual Type

Each Power BI visual type passes through three layers in pbix-web-kit:

1. **Python parser** — extract the visual's config into the canonical `Visual` IR
2. **IR schema** — the visual's type appears in the `PbixIR` JSON
3. **React component** — render the visual from IR + data

## Step 1: Identify the raw type

From a `spike_explore.py` run or from the `raw_layout.json`, find the `visualType` string for the visual you want to support (e.g. `"ribbonChart"`, `"scatterChart"`, `"funnel"`).

## Step 2: Map to canonical type

Edit `packages/pbix-parser/src/pbix_parser/visuals.py`.

Add an entry to `RAW_TO_CANONICAL`:

```python
"ribbonChart": "bar",  # renders as a bar chart variant
"scatterChart": "scatter",
```

Choose from the existing canonical types or create a new one by adding to the `VisualType` literal in `schema.py`.

## Step 3: Handle special field roles (if needed)

If the visual uses projection roles not yet handled (e.g. `"Size"` for scatter charts), update `parse_projections()` in `visuals.py`.

## Step 4: Create the React component

In `packages/pbix-web-app/src/components/visuals/`, create e.g. `ScatterChartVisual.tsx`:

```tsx
import type { Visual } from "./types"
import { resolveData } from "./dataResolver"

interface Props { visual: Visual; data: Record<string, any[]> }

export function ScatterChartVisual({ visual, data }: Props) {
  const { tableData, categoryCol, valueCols, empty } = resolveData(visual, data, "bar")
  if (empty) return <div className="text-muted-foreground p-4">No data</div>
  // ... render using Recharts or d3
}
```

## Step 5: Register in the visual registry

Edit `packages/pbix-web-app/src/components/visuals/VisualRegistry.tsx`:

```tsx
import { ScatterChartVisual } from "./ScatterChartVisual"
// ...
case "scatter":
  return <ScatterChartVisual visual={visual} data={data} />
```

## Step 6: Test

1. Re-extract: `bash scripts/01_extract.sh samples/your-sample.pbix`
2. Rebuild: `cd packages/pbix-web-app && pnpm build`
3. Check that the new visual renders correctly

## Pattern: fallback strategy

If you're unsure how a visual should render, fall back gracefully:

- For **chart-like** visuals → use the generic bar/line data resolver
- For **card-like** visuals → use `KpiCard` template
- For **table-like** visuals → use `DataTable` template
- For everything else → `UnsupportedVisual` with the `raw_type` label
