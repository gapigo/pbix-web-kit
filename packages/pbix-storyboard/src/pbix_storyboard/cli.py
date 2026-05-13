"""CLI for pbix-storyboard using Typer."""

from __future__ import annotations

import json
import logging
from pathlib import Path

import typer
from rich.console import Console
from rich.logging import RichHandler

from pbix_storyboard.brief import generate_briefs
from pbix_storyboard.extract import build_storyboard
from pbix_storyboard.narrative import build_narratives
from pbix_storyboard.parquet_writer import data_to_parquet

app = typer.Typer(
    name="pbix-storyboard",
    help="Transform Power BI IR into Storyboard artifacts.",
)
console = Console()
err_console = Console(stderr=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",
    datefmt="[%X]",
    handlers=[RichHandler(rich_tracebacks=True, console=err_console)],
)
logger = logging.getLogger("pbix_storyboard")


@app.command()
def extract(
    ir_dir: str = typer.Argument(
        ..., help="Directory containing ir.json and data/ subdirectory."
    ),
    out: str = typer.Option(
        ".", "--out", "-o", help="Output directory for storyboard.json and STORYBOARD.md."
    ),
    data_dir: str | None = typer.Option(
        None, "--data-dir", help="Custom data directory (defaults to <ir_dir>/data)."
    ),
) -> None:
    """Extract a Storyboard from an IR directory."""
    ir_path = Path(ir_dir)
    out_path = Path(out)
    out_path.mkdir(parents=True, exist_ok=True)

    data_path = Path(data_dir) if data_dir else None

    console.print(f"[bold]Extracting storyboard from:[/] {ir_path}")
    storyboard = build_storyboard(ir_path, data_path)

    # Write JSON
    sb_json = out_path / "storyboard.json"
    sb_json.write_text(
        storyboard.model_dump_json(indent=2, exclude_none=True),
        encoding="utf-8",
    )
    console.print(f"[green][OK][/] Wrote {sb_json}")

    # Generate STORYBOARD.md overview
    sb_md = _storyboard_to_markdown(storyboard)
    sb_md_path = out_path / "STORYBOARD.md"
    sb_md_path.write_text(sb_md, encoding="utf-8")
    console.print(f"[green][OK][/] Wrote {sb_md_path}")

    console.print(f"[bold]Storyboard complete:[/] {len(storyboard.pages)} pages, {len(storyboard.tables)} tables")


@app.command(name="data-to-parquet")
def data_to_parquet_cli(
    ir_dir: str = typer.Argument(
        ..., help="Directory containing data/ subdirectory."
    ),
    out: str = typer.Option(
        "parquet", "--out", "-o", help="Output directory for Parquet files."
    ),
) -> None:
    """Convert JSON data files to Parquet format."""
    ir_path = Path(ir_dir)
    out_path = Path(out)

    console.print(f"[bold]Converting data to Parquet from:[/] {ir_path}")
    results = data_to_parquet(ir_path, out_path)

    total_rows = sum(results.values())
    console.print(f"[green][OK][/] {len(results)} tables ({total_rows} rows) -> {out_path}")


@app.command()
def brief(
    storyboard_file: str = typer.Argument(
        ..., help="Path to storyboard.json."
    ),
    out: str = typer.Option(
        "briefs", "--out", "-o", help="Output directory for brief markdown files."
    ),
) -> None:
    """Generate per-page markdown briefs from a storyboard."""
    sb_path = Path(storyboard_file)
    out_path = Path(out)

    console.print(f"[bold]Reading storyboard from:[/] {sb_path}")
    with open(sb_path, encoding="utf-8") as f:
        data = json.load(f)

    from pbix_storyboard.schema import Storyboard
    storyboard = Storyboard.model_validate(data)

    # Rebuild narratives if empty (allows regeneration)
    if not storyboard.pages[0].narrative:
        storyboard.pages = build_narratives(storyboard.pages, storyboard.dashboard_name)

    written = generate_briefs(storyboard, out_path)
    console.print(f"[green][OK][/] Generated {len(written)} briefs in {out_path}")


def _storyboard_to_markdown(storyboard) -> str:
    """Convert a Storyboard to a markdown overview document."""
    lines: list[str] = []
    lines.append(f"# {storyboard.dashboard_name} — Storyboard")
    lines.append("")
    lines.append(f"**Source**: `{storyboard.source_file}`")
    lines.append(f"**Pages**: {len(storyboard.pages)}")
    lines.append(f"**Tables**: {len(storyboard.tables)}")
    lines.append(f"**Measures tracked**: {len(storyboard.measures_glossary)}")
    lines.append(f"**Generated at**: {storyboard.generated_at}")
    lines.append("")
    lines.append("## Overall Narrative")
    lines.append(storyboard.overall_narrative)
    lines.append("")
    lines.append("## Pages")
    for p in storyboard.pages:
        non_chrome = [v for v in p.visuals if not v.chrome]
        hero = p.hero_metric
        lines.append(f"- **{p.display_name}** — {p.narrative[:120]}…")
        lines.append(f"  - {len(non_chrome)} visuals, hero: {hero or 'N/A'}")

    lines.append("")
    lines.append("## Tables")
    for t in storyboard.tables:
        lines.append(f"- **{t.name}**: {t.row_count} rows, {len(t.columns)} columns")
        col_list = ", ".join(f"`{k}`: {v}" for k, v in list(t.columns.items())[:5])
        lines.append(f"  - Columns: {col_list}{'…' if len(t.columns) > 5 else ''}")

    lines.append("")
    lines.append("## Measures Glossary")
    for name, expr in sorted(storyboard.measures_glossary.items()):
        lines.append(f"- **{name}**: `{expr[:100]}{'…' if len(expr) > 100 else ''}`")

    lines.append("")
    return "\n".join(lines)


if __name__ == "__main__":
    app()
