# Page: Days to Close Insights

**Narrative**: This page (Days to Close Insights) presents key metrics, broken down by Region, Industry, DaysToClose. It features 2 main visuals including KPIs, charts, and tables.
**Hero Metric**: —

## Data sources
- `Campaigns`
- `Industries`
- `Opportunities`
- `Owners`
- `Products`
- `Territories`

## Visuals (sorted by importance)

### `1556020387` — bar (barChart)
**Purpose**: Compare DaysToClose across Owner
**Importance**: 2

**Measures**:
- `Opportunities.DaysToClose`
  - Expression: `Sum(Opportunities[DaysToClose])`
  - Plain English: Sum of DaysToClose
**Dimensions**: Owners.Owner
---

### `1556020388` — bar (barChart)
**Purpose**: Compare DaysToClose across Industry
**Importance**: 3

**Measures**:
- `Opportunities.DaysToClose`
  - Expression: `Sum(Opportunities[DaysToClose])`
  - Plain English: Sum of DaysToClose
**Dimensions**: Industries.Industry
---

### `1556020386` — unsupported (keyDriversVisual)
**Purpose**: Visual: keyDriversVisual
**Importance**: 5

**Measures**:
- `Opportunities.Value`
  - Expression: `Sum(Opportunities[Value])`
  - Plain English: Sum of Value
**Dimensions**: Opportunities.Decision Maker Identified, Territories.Territory, Products.Product, Industries.Industry, Campaigns.Campaign, Owners.Owner, Territories.Region, Opportunities.Purchase Process, Opportunities.DaysToClose, Campaigns.Campaign Type, Owners.Manager
---
