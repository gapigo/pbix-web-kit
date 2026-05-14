"""Convert PBI data JSON files to Parquet format for DuckDB consumption."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

logger = logging.getLogger(__name__)


def json_to_parquet(
    json_path: str | Path,
    parquet_path: str | Path,
    table_name: str | None = None,
) -> tuple[str, int]:
    """Convert a single JSON data file to Parquet.

    Returns (table_name, row_count).
    """
    json_path = Path(json_path)
    parquet_path = Path(parquet_path)
    parquet_path.parent.mkdir(parents=True, exist_ok=True)

    if table_name is None:
        table_name = json_path.stem

    # Load JSON
    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)

    if not data:
        logger.warning("Empty data for %s, writing empty parquet", table_name)
        empty = pa.table({})
        pq.write_table(empty, str(parquet_path))
        return table_name, 0

    # Convert to DataFrame with explicit types
    df = pd.json_normalize(data)

    # Convert to PyArrow table with preservation of types
    # pandas dtypes map reasonably to arrow
    table = pa.Table.from_pandas(df, preserve_index=False)

    # Write as Parquet with snappy compression (default)
    pq.write_table(table, str(parquet_path), compression="snappy")

    row_count = len(data)
    file_size = parquet_path.stat().st_size
    logger.info(
        "Wrote %s → %s (%d rows, %.1f KB)",
        json_path.name, parquet_path.name, row_count, file_size / 1024,
    )
    return table_name, row_count


def data_to_parquet(
    ir_dir: str | Path,
    out_dir: str | Path,
) -> dict[str, int]:
    """Convert all JSON data files in an IR directory to Parquet.

    Returns dict of table_name -> row_count.
    """
    ir_path = Path(ir_dir)
    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    data_dir = ir_path / "data"
    if not data_dir.exists():
        logger.error("Data directory not found: %s", data_dir)
        return {}

    results: dict[str, int] = {}
    json_files = sorted(data_dir.glob("*.json"))
    if not json_files:
        logger.warning("No JSON files found in %s", data_dir)
        return {}

    for json_file in json_files:
        table_name = json_file.stem
        parquet_file = out_path / f"{table_name}.parquet"
        name, count = json_to_parquet(json_file, parquet_file, table_name)
        results[name] = count

    logger.info("Converted %d tables to Parquet in %s", len(results), out_path)
    return results
