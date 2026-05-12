"""CLI for pbix-parser: extract .pbix files to canonical IR."""

import json
import sys
from pathlib import Path

import typer
from rich.console import Console
from rich.progress import Progress

from pbix_parser.extract import extract_pbix, PbixParseError
from pbix_parser.data_export import export_data

app = typer.Typer(
    name="pbix-parser",
    help="Extract Power BI .pbix files to canonical PbixIR intermediate representation",
)
console = Console()


@app.command()
def extract(
    infile: str = typer.Option(..., "--in", help="Path to input .pbix file"),
    outdir: str = typer.Option("", "--out", help="Output directory for IR files"),
):
    """Extract a .pbix file into the PbixIR format."""
    src = Path(infile)
    dst = Path(outdir) if outdir else src.with_name("ir")
    
    console.print(f"[bold]Extracting:[/] {src}")
    
    with Progress() as progress:
        task = progress.add_task("[cyan]Parsing...", total=None)
        
        try:
            ir, data_frames = extract_pbix(src)
        except PbixParseError as e:
            console.print(f"[red]Error:[/] {e}")
            sys.exit(1)
        except Exception as e:
            console.print(f"[red]Unexpected error:[/] {e}")
            sys.exit(1)
        
        progress.update(task, description="[cyan]Exporting...")
        
        # Create output directory
        dst.mkdir(parents=True, exist_ok=True)
        
        # Write IR JSON
        ir_path = dst / "ir.json"
        ir_dict = ir.model_dump(mode="json")
        with open(ir_path, "w", encoding="utf-8") as f:
            json.dump(ir_dict, f, indent=2, ensure_ascii=False)
        
        # Export data
        export_data(data_frames, dst)
        
        progress.update(task, description="[green]Done!")
    
    console.print(f"\nOK: IR written to {ir_path}")
    console.print(f"OK: {len(data_frames)} tables exported to {dst / 'data'}")
    console.print(f"\n   Pages: {len(ir.pages)}")
    
    total_visuals = sum(len(p.visuals) for p in ir.pages)
    console.print(f"   Visuals: {total_visuals}")
    
    supported = sum(
        1 for p in ir.pages for v in p.visuals if v.type != "unsupported"
    )
    unsupported = total_visuals - supported
    console.print(f"   Supported types: {supported}")
    console.print(f"   Unsupported types: {unsupported}")
    
    if unsupported > 0:
        unsup_types = sorted(set(
            v.raw_type for p in ir.pages for v in p.visuals if v.type == "unsupported"
        ))
        console.print(f"   Unknown types: {unsup_types}")


if __name__ == "__main__":
    app()
