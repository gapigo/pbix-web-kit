"""Compare rendered web app against expected IR data."""

import json
import re


def validate(ir_path: str, screenshot_text: str) -> dict:
    """Validate that the screenshot text matches expected content from the IR.
    
    Args:
        ir_path: Path to ir.json file.
        screenshot_text: All text extracted from the screenshot (OCR or HTML text).
    
    Returns:
        A validation report dict with passed/failed/warnings counts.
    """
    with open(ir_path, "r", encoding="utf-8") as f:
        ir = json.load(f)
    
    passed = 0
    failed = 0
    warnings = []
    
    # Check page names appear
    for page in ir["pages"]:
        name = page.get("display_name", page.get("name", ""))
        if name.lower() in screenshot_text.lower():
            passed += 1
        else:
            failed += 1
            warnings.append(f"Page name '{name}' not found in rendered text")
    
    # Check KPI values appear
    for page in ir["pages"]:
        for visual in page["visuals"]:
            if visual["type"] == "kpi":
                computed = visual.get("config", {}).get("computed_values", {})
                for key, val in computed.items():
                    if isinstance(val, (int, float)):
                        formatted = format_number_like(val)
                        # Check if any part of the number appears
                        if formatted[:5] in screenshot_text:
                            passed += 1
                        else:
                            failed += 1
                            warnings.append(f"KPI value '{formatted}' not found for {key}")
    
    # Check field names / column names appear
    for page in ir["pages"]:
        for visual in page["visuals"]:
            for field in visual.get("fields", []):
                col = field.get("column", "")
                if col and len(col) > 3 and col.lower() in screenshot_text.lower():
                    passed += 1
    
    # Check for common rendering elements
    text_to_check = ["2019", "2020", "Total"]
    for t in text_to_check:
        if t in screenshot_text:
            passed += 1
    
    report = {
        "passed": passed,
        "failed": failed,
        "warnings": warnings[:20],
        "total_checks": passed + failed,
    }
    
    return report


def format_number_like(n: float) -> str:
    """Format a number into a string that might appear rendered."""
    if abs(n) >= 1_000_000:
        return f"{(n / 1_000_000):.1f}"
    if abs(n) >= 1_000:
        return f"{(n / 1_000):.1f}"
    return f"{n:.0f}"
