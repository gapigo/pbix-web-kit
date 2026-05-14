"""Extract a .pbix file into PbixIR + data DataFrames."""

import json
import logging
import re
import zipfile
from pathlib import Path

import pandas as pd
from pbixray import PBIXRay

from pbix_parser.schema import PbixIR, Page, TableSchema
from pbix_parser.visuals import parse_visual_container

logger = logging.getLogger(__name__)


class PbixParseError(Exception):
    """Raised when a .pbix file cannot be parsed."""


def _compute_measure(expr: str, data_frames: dict[str, pd.DataFrame]) -> float | int | None:
    """Try to compute a DAX measure expression from available data.
    
    Handles simple patterns: SUMX, COUNTAX, COUNT, AVERAGEX, CALCULATE with FILTER.
    Returns None if expression can't be evaluated.
    """
    # Pattern: CALCULATE(SUMX(Table, Table[Column]), FILTER(Table, Table[Status] = "Value"))
    calc_match = re.search(
        r"CALCULATE\(\s*(SUMX|COUNTAX|COUNT|SUM|AVERAGEX)\(\s*(\w+)\s*,\s*\2\[(\w+)\]",
        expr
    )
    if calc_match:
        agg_fn = calc_match.group(1)
        table_name = calc_match.group(2)
        column = calc_match.group(3)
        
        if table_name not in data_frames:
            return None
        df = data_frames[table_name]
        
        # Check for FILTER condition
        filter_match = re.search(r"FILTER\(\s*\w+\s*,\s*\w+\[(\w+)\]\s*=\s*\"(\w+)\"", expr)
        if filter_match:
            filter_col = filter_match.group(1)
            filter_val = filter_match.group(2)
            if filter_col in df.columns:
                df = df[df[filter_col] == filter_val]
        
        if agg_fn in ("SUMX", "SUM"):
            if column in df.columns:
                return float(df[column].sum()) if pd.notna(df[column].sum()) else 0.0
        elif agg_fn in ("COUNTAX", "COUNT"):
            return float(len(df))
        elif agg_fn == "AVERAGEX":
            if column in df.columns:
                return float(df[column].mean()) if pd.notna(df[column].mean()) else 0.0
    
    # Simple SUMX(table, table[column]) without CALCULATE wrapper
    sumx_match = re.search(r"SUMX\(\s*(\w+)\s*,\s*\1\[(\w+)\]", expr)
    if sumx_match:
        table_name = sumx_match.group(1)
        column = sumx_match.group(2)
        if table_name in data_frames and column in data_frames[table_name].columns:
            val = data_frames[table_name][column].sum()
            return float(val) if pd.notna(val) else 0.0
    
    # VAR Revenue = CALCULATE(SUMX(...), FILTER(...)) pattern
    var_match = re.search(
        r"VAR\s+\w+\s*=\s*CALCULATE\s*\(\s*SUMX\s*\(\s*(\w+)\s*,\s*\1\[(\w+)\]",
        expr, re.IGNORECASE
    )
    if var_match:
        table_name = var_match.group(1)
        column = var_match.group(2)
        if table_name in data_frames and column in data_frames[table_name].columns:
            # Check for FILTER
            filter_match = re.search(r"FILTER\(\s*\w+\s*,\s*\w+\[(\w+)\]\s*=\s*\"(\w+)\"", expr)
            df = data_frames[table_name]
            if filter_match:
                filter_col = filter_match.group(1)
                filter_val = filter_match.group(2)
                if filter_col in df.columns:
                    df = df[df[filter_col] == filter_val]
            val = df[column].sum()
            return float(val) if pd.notna(val) else 0.0
    
    # Simple SELECTEDVALUE(table[col], default)
    sel_match = re.search(r"SELECTEDVALUE\(\s*'?(\w+)\[(\w+)\]", expr)
    if sel_match:
        return 0.0  # No filter context, return default
    
    return None


def extract_pbix(path: str | Path) -> tuple[PbixIR, dict[str, pd.DataFrame]]:
    """Extract a .pbix file into a PbixIR and a dict of DataFrames.
    
    Args:
        path: Path to the .pbix file.
    
    Returns:
        (PbixIR, {table_name: DataFrame}) — the IR and per-table data.
    
    Raises:
        PbixParseError: If the file cannot be parsed or is not a valid .pbix.
    """
    path = Path(path)
    if not path.exists():
        raise PbixParseError(f"File not found: {path}")
    
    if path.suffix.lower() not in (".pbix", ".pbit"):
        raise PbixParseError(f"Not a .pbix file: {path}")
    
    try:
        with zipfile.ZipFile(path) as z:
            if "Report/Layout" not in z.namelist():
                raise PbixParseError("Not a valid .pbix: missing Report/Layout")
    except zipfile.BadZipFile:
        raise PbixParseError(f"Not a valid zip file: {path}")
    
    # --- Data Model via PBIXRay ---
    try:
        model = PBIXRay(str(path))
    except Exception as e:
        raise PbixParseError(f"PBIXRay failed: {e}")
    
    tables_meta: list[TableSchema] = []
    data_frames: dict[str, pd.DataFrame] = {}
    
    if model.tables is not None:
        for table_name in model.tables:
            df = model.get_table(table_name)
            data_frames[table_name] = df
            
            col_dtypes: dict[str, str] = {}
            if model.schema is not None:
                tbl_schema = model.schema[
                    model.schema["TableName"] == table_name
                ]
                for _, row in tbl_schema.iterrows():
                    col_dtypes[row["ColumnName"]] = str(row["PandasDataType"])
            
            tables_meta.append(TableSchema(
                name=table_name,
                columns=col_dtypes,
                row_count=len(df),
            ))
    
    # Measures
    measures: list[dict[str, str]] = []
    if model.dax_measures is not None:
        if isinstance(model.dax_measures, list):
            for md in model.dax_measures:
                if isinstance(md, dict):
                    measures.append({
                        "table": str(md.get("TableName", "")),
                        "name": str(md.get("Name", "")),
                        "expression": str(md.get("Expression", "")),
                    })
        elif hasattr(model.dax_measures, "to_dict"):
            for _, row in model.dax_measures.iterrows():
                measures.append({
                    "table": str(row.get("TableName", "")),
                    "name": str(row.get("Name", "")),
                    "expression": str(row.get("Expression", "")),
                })
    
    # Relationships
    relationships: list[dict] = []
    if model.relationships is not None and hasattr(model.relationships, "to_dict"):
        try:
            relationships = model.relationships.to_dict(orient="records")
        except Exception:
            pass
    
    # --- Layout via zipfile ---
    pages: list[Page] = []
    try:
        with zipfile.ZipFile(path) as z:
            with z.open("Report/Layout") as f:
                layout = json.loads(f.read().decode("utf-16-le"))
        
        sections = layout.get("sections", [])
        canvas_width = 1280.0
        canvas_height = 720.0
        layout_info = layout.get("layout", {})
        if layout_info:
            cw = layout_info.get("width", layout_info.get("Width"))
            ch = layout_info.get("height", layout_info.get("Height"))
            if cw:
                canvas_width = float(cw)
            if ch:
                canvas_height = float(ch)
        
        for section in sections:
            page_name = section.get("name", "Page")
            page_display = section.get("displayName", page_name)
            vcs = section.get("visualContainers", [])
            
            page_visuals = []
            for vc in vcs:
                try:
                    vis = parse_visual_container(vc)
                    if vis is not None:
                        page_visuals.append(vis)
                except Exception as e:
                    logger.warning(f"Failed to parse visual: {e}")
            
            pages.append(Page(
                name=page_name,
                display_name=page_display,
                width=canvas_width,
                height=canvas_height,
                visuals=page_visuals,
            ))
    except Exception as e:
        raise PbixParseError(f"Failed to parse Report/Layout: {e}")
    
    # --- Compute measure values for visuals ---
    measure_map: dict[str, str] = {}
    for m in measures:
        measure_map[f"{m['table']}.{m['name']}"] = m['expression']
    
    for page in pages:
        for vis in page.visuals:
            computed: dict[str, object] = {}
            for f in vis.fields:
                key = f"{f.table}.{f.column}"
                if key in measure_map:
                    val = _compute_measure(measure_map[key], data_frames)
                    if val is not None:
                        computed[key] = val
            if computed:
                vis.config["computed_values"] = computed
    
    ir = PbixIR(
        source_file=str(path),
        pages=pages,
        tables=tables_meta,
        measures=measures,
        relationships=relationships,
    )
    
    return ir, data_frames
