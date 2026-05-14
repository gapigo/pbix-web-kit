"""Export DataFrames to JSON files for the web app."""

import json
import os
from pathlib import Path

import pandas as pd


def export_data(data_frames: dict[str, pd.DataFrame], out_dir: str | Path) -> None:
    """Export DataFrames as JSON record files.
    
    Each table becomes data/<table_name>.json in the output directory.
    """
    out_dir = Path(out_dir)
    data_dir = out_dir / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    
    for table_name, df in data_frames.items():
        # Sanitize filename: replace non-alphanumeric chars
        safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in table_name)
        path = data_dir / f"{safe_name}.json"
        
        # Convert to records format
        # Handle non-serializable types (numpy ints, datetimes)
        records = df.to_dict(orient="records")
        
        # Convert to JSON-safe types
        cleaned = _clean_records(records)
        
        with open(path, "w", encoding="utf-8") as f:
            json.dump(cleaned, f, indent=1, ensure_ascii=False)
    
    print(f"Exported {len(data_frames)} tables to {data_dir}")


def _clean_val(val: object) -> object:
    """Convert a value to a JSON-safe type."""
    if val is None:
        return None
    if pd.isna(val):
        return None
    if isinstance(val, (int, float, bool, str)):
        return val
    if hasattr(val, "item"):  # numpy scalars
        return val.item()
    if hasattr(val, "isoformat"):  # datetime
        return val.isoformat()
    return str(val)


def _clean_records(records: list[dict]) -> list[dict]:
    """Clean all values in a list of dict records for JSON serialization."""
    return [{k: _clean_val(v) for k, v in rec.items()} for rec in records]
