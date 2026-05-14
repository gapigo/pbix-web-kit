"""Extract a Storyboard from a parsed IR."""

from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any

from pbix_storyboard.narrative import build_narratives
from pbix_storyboard.schema import (
    MeasureRef,
    PageBrief,
    Storyboard,
    TableSample,
    VisualSummary,
)

logger = logging.getLogger(__name__)

CHROME_TYPES = frozenset({
    "actionButton", "shape", "basicShape", "image", "textbox", "pageNavigator",
})

# Canonical mapping for purpose heuristics
CANONICAL_NAMES: dict[str, str] = {
    "kpi": "Single Value / KPI",
    "barChart": "Bar Chart",
    "columnChart": "Column Chart",
    "clusteredColumnChart": "Column Chart",
    "stackedColumnChart": "Stacked Column Chart",
    "lineChart": "Line Chart",
    "lineStackedColumnComboChart": "Combo Chart (Line + Column)",
    "areaChart": "Area Chart",
    "pie": "Pie / Donut Chart",
    "tableEx": "Table",
    "pivotTable": "Pivot Table",
    "matrix": "Matrix",
    "slicer": "Slicer / Filter",
    "funnel": "Funnel Chart",
    "scatterChart": "Scatter Chart",
    "comboChart": "Combo Chart",
    "ribbonChart": "Ribbon Chart",
    "treemap": "Treemap",
    "gauge": "Gauge / Radial",
    "shapeMap": "Map",
    "map": "Map",
    "FlowVisual_C29F1DCC_81F5_4973_94AD_0517D44CC06A": "Flow / Sankey Diagram",
}


def _resolve_canonical(raw_type: str) -> str:
    return CANONICAL_NAMES.get(raw_type, raw_type)


def _determine_purpose(visual: dict) -> str:
    """Heuristic: determine what this visual communicates."""
    raw_type = visual["raw_type"]
    fields = visual.get("fields", [])
    canonical = CANONICAL_NAMES.get(raw_type, raw_type)
    title = visual.get("title") or ""

    # KPI with indicator
    if raw_type == "kpi":
        indicators = [f for f in fields if f.get("role") == "Indicator"]
        values = [f for f in fields if f.get("role") == "Values"]
        if indicators:
            return f"Show key metric: {indicators[0].get('column', 'unknown')}"
        if values:
            return f"Show {values[0].get('column', 'value')}"
        return "Display a single KPI value"

    # Slicer
    if raw_type == "slicer":
        cats = [f for f in fields if f.get("role") == "Category"]
        if cats:
            return f"Filter by {cats[0].get('column', 'unknown')}"
        return "Interactive slicer / filter"

    # Bar/Column chart
    if raw_type in ("barChart", "columnChart", "clusteredColumnChart", "stackedColumnChart", "bar"):
        cats = [f for f in fields if f.get("role") in ("Category", "Axis")]
        vals = [f for f in fields if f.get("role") in ("Y", "Values")]
        if cats and vals:
            return f"Compare {vals[0].get('column', 'values')} across {cats[0].get('column', 'categories')}"
        return f"Bar chart: {title or canonical}"

    # Line chart
    if raw_type in ("lineChart", "lineStackedColumnComboChart"):
        cats = [f for f in fields if f.get("role") in ("Category", "Axis")]
        vals = [f for f in fields if f.get("role") in ("Y", "Values")]
        if cats:
            return f"Trend of values over {cats[0].get('column', 'time')}"
        return f"Line chart: {title or canonical}"

    # Pie/Donut
    if raw_type == "pie":
        cats = [f for f in fields if f.get("role") == "Category"]
        if cats:
            return f"Distribution by {cats[0].get('column', 'segment')}"
        return "Pie chart showing proportion"

    # Tables
    if raw_type in ("tableEx", "pivotTable", "matrix"):
        rows = [f for f in fields if f.get("role") == "Rows"]
        if rows:
            return f"Tabular breakdown by {rows[0].get('column', 'detail')}"
        return "Data table with detailed values"

    # Funnel
    if raw_type == "funnel":
        return "Funnel chart showing progression"

    # Scatter
    if raw_type == "scatterChart":
        return "Scatter plot comparing two measures"

    # Combo
    if raw_type in ("comboChart", "ribbonChart"):
        return "Combination chart with multiple measure types"

    # Treemap
    if raw_type == "treemap":
        return "Hierarchical treemap showing proportions"

    # Gauge
    if raw_type == "gauge":
        return "Radial gauge showing attainment vs target"

    # Map
    if raw_type in ("shapeMap", "map"):
        return "Geographic map"

    # Flow/Sankey
    if "FlowVisual" in raw_type:
        return "Flow / Sankey diagram"

    return f"Visual: {canonical}"


def _determine_importance(visual: dict) -> int:
    """Determine visual importance: 1=hero, 5=peripheral."""
    raw_type = visual["raw_type"]
    pos = visual.get("position", {})
    y = pos.get("y", 500)

    # KPIs at the top are hero
    if raw_type == "kpi" and y < 150:
        return 1
    if raw_type == "kpi":
        return 2

    # Main charts
    if raw_type in ("columnChart", "barChart", "lineChart", "clusteredColumnChart"):
        return 2 if y < 300 else 3

    # Tables
    if raw_type in ("tableEx", "pivotTable", "matrix"):
        return 2 if y < 200 else 3

    # Slicers
    if raw_type == "slicer":
        return 4

    # Combos, treemaps, funnels
    if raw_type in ("lineStackedColumnComboChart", "treemap", "funnel", "gauge", "pie"):
        return 3

    # Map, flow, scatter
    if raw_type in ("shapeMap", "map", "scatterChart", "comboChart"):
        return 3

    # Chrome
    if raw_type in CHROME_TYPES:
        return 5

    # Everything else
    return 5


def _extract_measures_and_dimensions(
    visual: dict,
    all_measures: list[dict],
) -> tuple[list[MeasureRef], list[str]]:
    """Extract measure refs and dimension names from a visual's fields."""
    fields = visual.get("fields", [])
    measures: list[MeasureRef] = []
    dimensions: list[str] = []

    for field in fields:
        table = field.get("table", "")
        column = field.get("column", "")
        role = field.get("role", "")
        agg = field.get("aggregation")

        # Find measure expression if this references a measure
        expr = ""
        measure_match = next(
            (m for m in all_measures if m["table"] == table and m["name"] == column),
            None,
        )
        if measure_match:
            expr = measure_match["expression"]

        if agg or expr:
            # This is a measure
            plain = _plain_english(expr, column, agg)
            measures.append(MeasureRef(
                name=f"{table}.{column}",
                expression=expr or f"{agg}({table}[{column}])",
                plain_english=plain,
            ))
        else:
            # This is a dimension
            dimensions.append(f"{table}.{column}")

    return measures, list(set(dimensions))


def _plain_english(expr: str, column: str, agg: str | None) -> str:
    """Convert a measure expression to plain English."""
    if not expr:
        if agg:
            return f"{agg} of {column}"
        return column

    # Simple patterns
    if "SUM(" in expr and "CALCULATE" not in expr and "FILTER" not in expr:
        return f"Total of {column}"
    if "AVERAGE(" in expr or "AVG(" in expr:
        return f"Average of {column}"
    if "COUNTROWS" in expr or "COUNTAX" in expr:
        return f"Count of rows in {column}"
    if "DISTINCTCOUNT" in expr:
        return f"Count of distinct {column}"

    # CALCULATE with simple filter
    if "CALCULATE" in expr and "FILTER" in expr:
        # Very basic extraction
        parts = expr.replace("CALCULATE(", "").split(",", 1)
        inner = parts[0].strip() if parts else ""
        return f"Categorized total of ({inner})"

    # Division pattern
    if "DIVIDE" in expr:
        return f"Ratio calculated as ({column})"

    return f"Measure: {column}"


def _compute_table_samples(
    tables: list[dict],
    data_dir: Path | None,
    max_cat_values: int = 20,
) -> list[TableSample]:
    """Build TableSample entries from IR table metadata and data files."""
    samples: list[TableSample] = []

    for table in tables:
        name = table["name"]
        row_count = table.get("row_count", 0)
        columns = table.get("columns", {})

        # Try to load data for this table
        rows: list[dict] = []
        if data_dir and data_dir.exists():
            data_path = data_dir / f"{name}.json"
            if data_path.exists():
                try:
                    with open(data_path, encoding="utf-8") as f:
                        rows = json.load(f)
                except (json.JSONDecodeError, OSError) as e:
                    logger.warning("Failed to load %s: %s", data_path, e)

        sample_rows = rows[:5]
        distinct_values: dict[str, list] = {}
        # For categorical columns (string type), collect distinct values
        for col_name, dtype in columns.items():
            if dtype and isinstance(dtype, str) and dtype.startswith(("string", "text", "varchar", "char")):
                vals = sorted(set(
                    str(r[col_name]) for r in rows if col_name in r and r[col_name] is not None
                ))
                distinct_values[col_name] = vals[:max_cat_values]

        samples.append(TableSample(
            name=name,
            row_count=row_count,
            columns=columns,
            sample_rows=sample_rows,
            distinct_values=distinct_values,
        ))

    return samples


def _find_page_filters(visuals: list[dict]) -> list[dict]:
    """Extract page-level filters from slicer visuals."""
    filters = []
    for vis in visuals:
        if vis.get("raw_type") == "slicer":
            fields = vis.get("fields", [])
            for f in fields:
                if f.get("role") in ("Category", "Axis", "Values"):
                    filters.append({
                        "visual_id": vis["id"],
                        "table": f.get("table", ""),
                        "column": f.get("column", ""),
                        "type": "slicer",
                    })
    return filters


def _find_cross_filters(visuals: list[dict]) -> list[dict]:
    """Extract cross-filter relationships (e.g., clicking a chart filters others)."""
    # PBI doesn't expose cross-filter in IR directly.
    # Heuristic: any chart with interactions towards another visual.
    cross = []
    for vis in visuals:
        if vis["type"] in ("bar", "line", "pie", "kpi") and vis["type"] != "chrome":
            # Assume charts cross-filter each other
            for other in visuals:
                if other["id"] != vis["id"] and other["type"] not in ("chrome",):
                    cross.append({
                        "source": vis["id"],
                        "target": other["id"],
                        "type": "cross-filter",
                    })
                    break
    return cross[:5]  # cap to avoid noise


def build_storyboard(
    ir_dir: str | Path,
    data_dir: str | Path | None = None,
) -> Storyboard:
    """Read an IR directory and build a complete Storyboard."""
    ir_dir = Path(ir_dir)
    with open(ir_dir / "ir.json", encoding="utf-8") as f:
        ir = json.load(f)

    if data_dir:
        data_dir = Path(data_dir)
    else:
        data_dir = ir_dir / "data" if (ir_dir / "data").exists() else None

    source_file = ir.get("source_file", "unknown")
    dashboard_name = Path(source_file).stem if source_file != "unknown" else "Dashboard"

    # Tables
    tables_raw = ir.get("tables", [])
    table_samples = _compute_table_samples(tables_raw, data_dir)

    # Measures glossary
    all_measures = ir.get("measures", [])
    measures_glossary: dict[str, str] = {
        f"{m['table']}.{m['name']}": m.get("expression", "")
        for m in all_measures
    }

    # Build page briefs
    pages_raw = ir.get("pages", [])
    page_briefs: list[PageBrief] = []

    for p in pages_raw:
        visuals_raw = p.get("visuals", [])
        # Filter chrome
        data_visuals = [v for v in visuals_raw if v.get("raw_type") not in CHROME_TYPES]

        visual_summaries: list[VisualSummary] = []
        for v in data_visuals:
            measures, dimensions = _extract_measures_and_dimensions(v, all_measures)
            raw_type = v.get("raw_type", "unknown")
            canonical_type = v.get("type", "unsupported")
            purpose = _determine_purpose(v)
            importance = _determine_importance(v)
            is_chrome = v.get("raw_type") in CHROME_TYPES

            visual_summaries.append(VisualSummary(
                id=v.get("id", "unknown"),
                purpose=purpose,
                canonical_type=canonical_type,
                raw_type=raw_type,
                measures=measures,
                dimensions=dimensions,
                importance=importance,
                chrome=is_chrome,
            ))

        # Sort by importance
        visual_summaries.sort(key=lambda vs: (vs.importance, vs.id))

        # Determine hero metric
        hero = next(
            (vs.measures[0].name for vs in visual_summaries if vs.importance == 1 and vs.measures),
            None,
        )

        page_filters = _find_page_filters(visuals_raw)
        cross_filters = _find_cross_filters(data_visuals)

        page_briefs.append(PageBrief(
            name=p.get("name", ""),
            display_name=p.get("display_name", ""),
            narrative="",  # filled by build_narratives
            hero_metric=hero,
            visuals=visual_summaries,
            page_filters=page_filters,
            cross_filters=cross_filters,
        ))

    # Build narratives
    page_briefs = build_narratives(page_briefs, dashboard_name)

    # Build overall narrative
    page_names = [p.display_name for p in page_briefs]
    first_hero = page_briefs[0].hero_metric if page_briefs else None
    overall_narrative = (
        f"Dashboard {dashboard_name} contains {len(page_briefs)} pages "
        f"covering: {', '.join(page_names)}. "
        f"The primary metric tracked is {first_hero or 'N/A'}."
    )

    return Storyboard(
        source_file=source_file,
        dashboard_name=dashboard_name,
        overall_narrative=overall_narrative,
        pages=page_briefs,
        tables=table_samples,
        measures_glossary=measures_glossary,
        generated_at=datetime.utcnow().isoformat(),
    )
