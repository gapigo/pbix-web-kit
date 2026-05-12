# PbixIR Schema Reference

PbixIR (Power BI Intermediate Representation) is the canonical format for describing a Power BI report. Every `.pbix` file is extracted into this format by the `pbix-parser` package.

## File Structure

```
ir/
├── ir.json          # PbixIR (metadata, pages, visuals)
└── data/
    ├── Table1.json  # Row data per table (JSON records)
    ├── Table2.json
    └── ...
```

## ir.json Schema

```json
{
  "source_file": "path/to/report.pbix",
  "pages": [ Page ],
  "tables": [ TableSchema ],
  "measures": [ Measure ],
  "relationships": [ Relationship ]
}
```

### Page

```json
{
  "name": "ReportSection1",
  "display_name": "Sales Overview",
  "width": 1280,
  "height": 720,
  "visuals": [ Visual ]
}
```

### Visual

```json
{
  "id": "1556019845",
  "type": "kpi",
  "raw_type": "kpi",
  "title": null,
  "position": { "x": 17.1, "y": 91.0, "width": 300.0, "height": 67.8, "z": 11000 },
  "fields": [ Field ],
  "config": {}
}
```

**Canonical `type` values:**

| type | Description | Raw types mapped |
|------|-------------|-----------------|
| `kpi` | Single number card | `kpi`, `multiRowCard`, `card` |
| `bar` | Bar/column chart | `barChart`, `columnChart`, `clusteredBarChart`, `clusteredColumnChart`, etc. |
| `line` | Line/area chart | `lineChart`, `areaChart`, `stackedAreaChart` |
| `pie` | Pie/donut chart | `pieChart`, `donutChart` |
| `table` | Table/matrix | `tableEx`, `pivotTable`, `matrix` |
| `slicer` | On-canvas filter | `slicer` |
| `text` | Static textbox | `textbox` |
| `image` | Image | `image` |
| `shape` | Decorative shape | `shape` |
| `unsupported` | Placeholder | Everything else |

### Field

```json
{
  "table": "Opportunities",
  "column": "Revenue Won",
  "aggregation": null,
  "role": "Indicator"
}
```

**Common roles by visual type:**

| Visual type | Common roles |
|------------|-------------|
| `kpi` | `Indicator`, `TrendLine` |
| `bar`, `line` | `Category`, `Y`, `Tooltips`, `Legend` |
| `pie` | `Category`, `Values` |
| `table` | `Rows`, `Values` |
| `slicer` | `Values` |

### VisualPosition

```json
{
  "x": 17.1, "y": 91.0,
  "width": 300.0, "height": 67.8,
  "z": 11000
}
```

All values are in logical pixels. Default canvas is 1280×720.

### TableSchema

```json
{
  "name": "Opportunities",
  "columns": { "Value": "Int64", "Status": "string", "CloseDate": "datetime64[ns]" },
  "row_count": 20000
}
```

### Measure

```json
{
  "table": "Opportunities",
  "name": "Revenue Won",
  "expression": "CALCULATE(SUMX(Opportunities, ...), FILTER(...))"
}
```

### Relationship

Columns match the PBIXRay output format for relationships between tables.

## Data Files

Each table's rows are exported as JSON arrays in `data/<sanitized_name>.json`:

```json
[
  { "Account Name": "A. Datum Corporation", "Country": "United States", ... },
  { "Account Name": "Other Corp", "Country": "United States", ... }
]
```

Numeric values are plain numbers, nulls are `null`, datetimes are ISO strings.
