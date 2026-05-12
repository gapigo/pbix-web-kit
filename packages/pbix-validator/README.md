# pbix-validator

Screenshot-based validation of a rendered pbix-web-app dashboard.

## Usage

```bash
pip install -e packages/pbix-validator
pbix-validator check --ir ../ir/ir.json --url http://localhost:5173
```

Compares rendered text against expected KPI values and page names from the IR.
