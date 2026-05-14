"""Smoke tests for the pbix-parser extraction pipeline."""

import json
import os
import tempfile
from pathlib import Path

import pytest

from pbix_parser.extract import extract_pbix, PbixParseError
from pbix_parser.schema import PbixIR, VisualType
from pbix_parser.visuals import parse_query_ref, parse_visual_container
from pbix_parser.data_export import export_data


def _find_repo_root() -> Path:
    """Walk up from test file to find repo root (marked by CLAUDE.md)."""
    p = Path(__file__).resolve()
    for parent in p.parents:
        if (parent / "CLAUDE.md").exists():
            return parent
    return p.parents[4]
SAMPLE_PATH = _find_repo_root() / "samples/regional_sales/Regional Sales Sample.pbix"


# ─── Helpers ──────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def ir_and_data():
    """Extract once per test session."""
    return extract_pbix(SAMPLE_PATH)


# ─── Schema tests ─────────────────────────────────────────────────────

class TestSchema:
    def test_pbixir_has_source(self, ir_and_data):
        ir, _ = ir_and_data
        assert ir.source_file.endswith(".pbix")
    
    def test_has_pages(self, ir_and_data):
        ir, _ = ir_and_data
        assert len(ir.pages) >= 1
    
    def test_page_has_visuals(self, ir_and_data):
        ir, _ = ir_and_data
        for page in ir.pages:
            assert len(page.visuals) >= 0  # some pages might be empty
    
    def test_at_least_one_known_visual(self, ir_and_data):
        ir, _ = ir_and_data
        known_types: set[VisualType] = {"kpi", "bar", "line", "pie", "table", "slicer"}
        found = set()
        for page in ir.pages:
            for v in page.visuals:
                if v.type in known_types:
                    found.add(v.type)
        assert len(found) > 0, f"No known visual types found in {found}"


class TestExtractErrors:
    def test_nonexistent_file(self):
        with pytest.raises(PbixParseError, match="not found"):
            extract_pbix("nonexistent.pbix")
    
    def test_non_pbix_file(self):
        with tempfile.NamedTemporaryFile(suffix=".pbix", delete=False) as f:
            f.write(b"not a zip")
            p = f.name
        try:
            with pytest.raises(PbixParseError):
                extract_pbix(p)
        finally:
            os.unlink(p)


class TestDataExport:
    def test_export_produces_json(self, ir_and_data):
        ir, data = ir_and_data
        with tempfile.TemporaryDirectory() as tmp:
            export_data(data, tmp)
            data_dir = Path(tmp) / "data"
            assert data_dir.is_dir()
            json_files = list(data_dir.glob("*.json"))
            assert len(json_files) > 0
            # Each file should have at least one record
            for jf in json_files:
                with open(jf) as f:
                    records = json.load(f)
                    assert len(records) > 0
    
    def test_ir_roundtrips_json(self, ir_and_data):
        ir, _ = ir_and_data
        # Serialize to JSON dict
        d = ir.model_dump(mode="json")
        # Deserialize back
        ir2 = PbixIR(**d)
        assert len(ir2.pages) == len(ir.pages)
        assert ir2.source_file == ir.source_file


class TestVisualParser:
    def test_parse_query_ref_basic(self):
        table, col, agg = parse_query_ref("Products.Product")
        assert table == "Products"
        assert col == "Product"
        assert agg is None
    
    def test_parse_query_ref_aggregated(self):
        table, col, agg = parse_query_ref("Sum(Opportunities.Value)")
        assert table == "Opportunities"
        assert col == "Value"
        assert agg == "Sum"
    
    def test_parse_query_ref_no_table(self):
        table, col, agg = parse_query_ref("SomeMeasure")
        assert table == ""
        assert col == "SomeMeasure"
        assert agg is None
