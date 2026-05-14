# Page: Win/Loss Ratio Insights

**Narrative**: This page (Win/Loss Ratio Insights) presents key metrics, broken down by Discount), Industry, Status. It features 2 main visuals including KPIs, charts, and tables.
**Hero Metric**: —

## Data sources
- `Avg(Opportunities`
- `Campaigns`
- `Industries`
- `Opportunities`
- `Owners`
- `Products`

## Visuals (sorted by importance)

### `1556020305` — bar (barChart)
**Purpose**: Compare Close % across Product Category
**Importance**: 2

**Measures**:
- `Opportunities.Close %`
  - Expression: `[Count of Won]/([Count of Won]+[Count of Lost])`
  - Plain English: Measure: Close %
**Dimensions**: Products.Product Category
---

### `1556020226` — combo (lineStackedColumnComboChart)
**Purpose**: Trend of values over Product LOB
**Importance**: 3

**Measures**:
- `Opportunities.Revenue Won`
  - Expression: `
 CALCULATE(
     SUMX(Opportunities, Opportunities[Value]),
     FILTER(Opportunities, Opportunities[Status] = "Won")
 )`
  - Plain English: Categorized total of (SUMX(Opportunities)
- `Opportunities.Close %`
  - Expression: `[Count of Won]/([Count of Won]+[Count of Lost])`
  - Plain English: Measure: Close %
**Dimensions**: Products.Product LOB
---

### `1556020227` — unsupported (keyDriversVisual)
**Purpose**: Visual: keyDriversVisual
**Importance**: 5

**Dimensions**: Products.Product, Industries.Industry, Avg(Opportunities.Discount), Opportunities.Status, Campaigns.Name, Opportunities.Purchase Process, Owners.Owner, Owners.Manager
---
