"""Parse Power BI visual containers into canonical Visual objects."""

import json
import logging
import re
from pbix_parser.schema import Field, Visual, VisualPosition, VisualType

logger = logging.getLogger(__name__)

# Mapping from Power BI raw visual types to canonical types
RAW_TO_CANONICAL: dict[str, VisualType] = {
    "kpi": "kpi",
    "multiRowCard": "kpi",
    "card": "kpi",
    "barChart": "bar",
    "columnChart": "bar",
    "clusteredBarChart": "bar",
    "clusteredColumnChart": "bar",
    "stackedBarChart": "bar",
    "stackedColumnChart": "bar",
    "lineChart": "line",
    "areaChart": "line",
    "stackedAreaChart": "line",
    "pieChart": "pie",
    "donutChart": "pie",
    "tableEx": "table",
    "pivotTable": "table",
    "matrix": "table",
    "slicer": "slicer",
    "textbox": "text",
    "image": "image",
    "shape": "shape",
}
# Chrome types (navigation, decorative, non-data visuals)
CHROME_TYPES = {'actionButton', 'shape', 'basicShape', 'image', 'textbox', 'pageNavigator'}


# Aggregation functions that may appear in queryRefs
AGGREGATION_RE = re.compile(r"^(Sum|Count|Average|Min|Max|DistinctCount)\((.+)\)$")


def parse_query_ref(query_ref: str) -> tuple[str, str, str | None]:
    """Parse a queryRef like 'Table.Column' or 'Sum(Table.Column)'.
    
    Returns (table, column, aggregation).
    """
    agg = None
    m = AGGREGATION_RE.match(query_ref)
    if m:
        agg = m.group(1)
        query_ref = m.group(2)
    
    if "." in query_ref:
        parts = query_ref.rsplit(".", 1)
        return parts[0], parts[1], agg
    return "", query_ref, agg


def extract_title(single_visual: dict) -> str | None:
    """Extract the title from a singleVisual object."""
    titles = single_visual.get("titles")
    if titles and isinstance(titles, list) and len(titles) > 0:
        first = titles[0]
        if isinstance(first, dict):
            return first.get("text", "")
        return str(first)
    
    # Also check objects section
    objs = single_visual.get("objects", {})
    title_obj = objs.get("title", {})
    if isinstance(title_obj, list) and len(title_obj) > 0:
        props = title_obj[0].get("properties", {})
        title_text_prop = props.get("title", {})
        if isinstance(title_text_prop, dict):
            expr = title_text_prop.get("expr", {})
            lit = expr.get("Literal", {})
            return lit.get("Value", "")
    return None


def parse_projections(single_visual: dict) -> list[Field]:
    """Extract fields from singleVisual.projections."""
    fields: list[Field] = []
    projections = single_visual.get("projections", {})
    if not projections:
        return fields
    
    for role, entries in projections.items():
        if not isinstance(entries, list):
            continue
        for entry in entries:
            if not isinstance(entry, dict):
                continue
            query_ref = entry.get("queryRef", "")
            if not query_ref:
                continue
            table, column, agg = parse_query_ref(query_ref)
            fields.append(Field(
                table=table,
                column=column,
                aggregation=agg,
                role=role,
            ))
    
    return fields


def extract_position(config: dict, visual_container: dict) -> VisualPosition:
    """Extract position from layout or from top-level vc keys."""
    # Try layouts first
    layouts = config.get("layouts", [])
    if layouts and isinstance(layouts, list) and len(layouts) > 0:
        pos = layouts[0].get("position", {})
        if pos.get("x") is not None:
            return VisualPosition(
                x=float(pos.get("x", 0)),
                y=float(pos.get("y", 0)),
                width=float(pos.get("width", 200)),
                height=float(pos.get("height", 200)),
                z=int(pos.get("z", 0)),
            )
    
    # Fallback to top-level vc
    return VisualPosition(
        x=float(visual_container.get("x", 0)),
        y=float(visual_container.get("y", 0)),
        width=float(visual_container.get("width", 200)),
        height=float(visual_container.get("height", 200)),
        z=int(visual_container.get("z", 0)),
    )


def parse_visual_container(visual_container: dict[str, object]) -> Visual | None:
    """Parse a single visualContainer dict into a canonical Visual object.
    
    Returns None if the container is entirely empty/unparseable.
    """
    # The config is a JSON string inside the visualContainer
    config_raw = visual_container.get("config", "{}")
    if isinstance(config_raw, str):
        try:
            config: dict = json.loads(config_raw)
        except json.JSONDecodeError:
            logger.warning("Failed to parse config JSON")
            return None
    elif isinstance(config_raw, dict):
        config = config_raw
    else:
        config = {}
    
    single_visual = config.get("singleVisual", {})
    if not single_visual:
        return None
    
    raw_type = single_visual.get("visualType", "unknown")
    # Chrome types (navigation, decorative) → type='chrome'
    if raw_type in CHROME_TYPES:
        canonical_type = "chrome"
    else:
        canonical_type = RAW_TO_CANONICAL.get(raw_type, "unsupported")
    
    vid = str(visual_container.get("id", ""))
    title = extract_title(single_visual)
    position = extract_position(config, visual_container)
    fields = parse_projections(single_visual)
    
    # Gather extra config (colors, formatting)
    extra_config: dict[str, object] = {}
    objects = single_visual.get("objects", {})
    if isinstance(objects, dict):
        # Extract dataPoint colors if present
        data_points = objects.get("dataPoint")
        if data_points:
            extra_config["dataPoint"] = data_points
    
    return Visual(
        id=vid,
        type=canonical_type,
        raw_type=raw_type,
        title=title,
        position=position,
        fields=fields,
        config=extra_config,
    )
