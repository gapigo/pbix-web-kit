# pbix-parser

Extract Power BI Desktop `.pbix` files into the canonical PbixIR format.

## Usage

```bash
pip install -e packages/pbix-parser
pbix-parser --in report.pbix --out ./ir/
```

Output: `ir/ir.json` (metadata) + `ir/data/*.json` (table rows).

## API

```python
from pbix_parser import extract_pbix

ir, data_frames = extract_pbix("report.pbix")
# ir: PbixIR — pages, visuals, tables schema, measures
# data_frames: dict[str, DataFrame] — raw table data
```
