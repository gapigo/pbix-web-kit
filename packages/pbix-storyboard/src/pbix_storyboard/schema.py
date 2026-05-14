"""Pydantic models for the Storyboard intermediate representation."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel


class TableSample(BaseModel):
    """Sampled data from a table for LLM context."""

    name: str
    row_count: int
    columns: dict[str, str]  # col_name -> dtype
    sample_rows: list[dict]  # first 5 rows
    distinct_values: dict[str, list]  # top 20 distinct values per cat col


class MeasureRef(BaseModel):
    """Reference to a measure with plain-English description."""

    name: str
    expression: str
    plain_english: str  # e.g. "Sum of Revenue when Status='Won'"


class VisualSummary(BaseModel):
    """Describes INTENTION, not position. For LLMs to read."""

    id: str
    purpose: str
    canonical_type: str
    raw_type: str
    measures: list[MeasureRef]
    dimensions: list[str]
    importance: int  # 1=hero, 5=peripheral
    chrome: bool  # True = skip in rendering


class PageBrief(BaseModel):
    """Brief for a single page / tab."""

    name: str
    display_name: str
    narrative: str
    hero_metric: str | None = None
    visuals: list[VisualSummary]
    page_filters: list[dict] = []
    cross_filters: list[dict] = []


class Storyboard(BaseModel):
    """Complete storyboard for a dashboard."""

    source_file: str
    dashboard_name: str
    overall_narrative: str
    pages: list[PageBrief]
    tables: list[TableSample]
    measures_glossary: dict[str, str]
    generated_at: str
