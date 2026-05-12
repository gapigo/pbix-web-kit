"""Pydantic models for the PbixIR intermediate representation."""

from pydantic import BaseModel
from typing import Any, Literal


class Field(BaseModel):
    """A single field in a visual (column or measure reference)."""
    table: str
    column: str
    aggregation: str | None = None  # "Sum", "Count", "Average", "Min", "Max", None
    role: str = "Values"  # "Category", "Y", "Values", "Legend", "Indicator", etc.


class VisualPosition(BaseModel):
    """Position and size of a visual on the canvas."""
    x: float
    y: float
    width: float
    height: float
    z: int = 0


VisualType = Literal[
    "kpi", "bar", "line", "pie", "table", "slicer",
    "text", "image", "shape", "chrome", "unsupported",
]


class Visual(BaseModel):
    """A single visual on a page."""
    id: str
    type: VisualType
    raw_type: str
    title: str | None = None
    position: VisualPosition
    fields: list[Field] = []
    config: dict[str, Any] = {}  # raw config extras (colors, format strings, etc.)


class Page(BaseModel):
    """A single page (tab) in the report."""
    name: str
    display_name: str
    width: float = 1280.0
    height: float = 720.0
    visuals: list[Visual] = []


class TableSchema(BaseModel):
    """Metadata about a table in the data model."""
    name: str
    columns: dict[str, str]  # column_name -> pandas dtype string
    row_count: int = 0


class PbixIR(BaseModel):
    """Canonical Intermediate Representation of a .pbix file."""
    source_file: str
    pages: list[Page] = []
    tables: list[TableSchema] = []
    measures: list[dict[str, str]] = []  # [{table, name, expression}]
    relationships: list[dict[str, Any]] = []
