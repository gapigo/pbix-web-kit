"""Generate markdown briefs from a Storyboard."""

from __future__ import annotations

from pathlib import Path

from pbix_storyboard.schema import PageBrief, Storyboard


def page_brief_to_markdown(brief: PageBrief) -> str:
    """Serialize a single PageBrief to a markdown string."""
    lines: list[str] = []
    lines.append(f"# Page: {brief.display_name}")
    lines.append("")
    lines.append(f"**Narrative**: {brief.narrative}")
    lines.append(f"**Hero Metric**: {brief.hero_metric or '—'}")
    lines.append("")

    # Data sources from visuals
    tables_seen: set[str] = set()
    for v in brief.visuals:
        for m in v.measures:
            tbl = m.name.split(".")[0] if "." in m.name else ""
            if tbl:
                tables_seen.add(tbl)
        for d in v.dimensions:
            tbl = d.split(".")[0] if "." in d else ""
            if tbl:
                tables_seen.add(tbl)

    lines.append("## Data sources")
    for tbl in sorted(tables_seen):
        lines.append(f"- `{tbl}`")
    lines.append("")

    if brief.page_filters:
        lines.append("## Filters available on this page")
        for pf in brief.page_filters:
            lines.append(f"- `{pf.get('table', '?')}.{pf.get('column', '?')}` ({pf.get('type', 'filter')})")
        lines.append("")

    lines.append("## Visuals (sorted by importance)")
    for v in brief.visuals:
        lines.append("")
        lines.append(f"### `{v.id}` — {v.canonical_type} ({v.raw_type})")
        lines.append(f"**Purpose**: {v.purpose}")
        lines.append(f"**Importance**: {v.importance}")
        if v.chrome:
            lines.append("_Chrome / decorative_")
        lines.append("")
        if v.measures:
            lines.append("**Measures**:")
            for m in v.measures:
                lines.append(f"- `{m.name}`")
                lines.append(f"  - Expression: `{m.expression}`")
                lines.append(f"  - Plain English: {m.plain_english}")
        if v.dimensions:
            lines.append(f"**Dimensions**: {', '.join(v.dimensions)}")
        lines.append("---")

    return "\n".join(lines) + "\n"


def generate_briefs(
    storyboard: Storyboard,
    out_dir: str | Path,
) -> list[Path]:
    """Generate one markdown brief per page.

    Returns list of file paths written.
    """
    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    written: list[Path] = []
    for brief in storyboard.pages:
        # Use display_name for filename, sanitize
        safe_name = "".join(
            c if c.isalnum() or c in (" ", "-", "_") else "_"
            for c in brief.display_name
        ).strip().replace(" ", "_")
        file_path = out_path / f"{safe_name}.md"
        content = page_brief_to_markdown(brief)
        file_path.write_text(content, encoding="utf-8")
        written.append(file_path)

    return written
