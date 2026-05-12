"""Extract a .pbix file into PbixIR + data DataFrames."""

import json
import logging
import zipfile
from pathlib import Path

import pandas as pd
from pbixray import PBIXRay

from pbix_parser.schema import PbixIR, Page, TableSchema
from pbix_parser.visuals import parse_visual_container

logger = logging.getLogger(__name__)


class PbixParseError(Exception):
    """Raised when a .pbix file cannot be parsed."""


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
        # Verify it's a valid zip
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
            # DataFrame
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
        # Canvas size — try to get from layout metadata
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
    
    ir = PbixIR(
        source_file=str(path),
        pages=pages,
        tables=tables_meta,
        measures=measures,
        relationships=relationships,
    )
    
    return ir, data_frames
