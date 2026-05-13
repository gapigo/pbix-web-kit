# Page: Revenue Source Breakdown

**Narrative**: This page (Revenue Source Breakdown) presents key metrics, broken down by Industry, Campaign, Product. It features 2 main visuals including KPIs, charts, and tables.
**Hero Metric**: —

## Data sources
- `Campaigns`
- `Industries`
- `Opportunities`
- `Owners`
- `Products`
- `Territories`

## Visuals (sorted by importance)

### `1556020473` — bar (barChart)
**Purpose**: Compare Opportunity Count across Territory
**Importance**: 2

**Measures**:
- `Opportunities.Opportunity Count`
  - Expression: `
COUNTAX(Opportunities,TRUE())`
  - Plain English: Count of rows in Opportunity Count
**Dimensions**: Territories.Territory
---

### `1556020472` — bar (barChart)
**Purpose**: Compare Opportunity Count across Manager
**Importance**: 3

**Measures**:
- `Opportunities.Opportunity Count`
  - Expression: `
COUNTAX(Opportunities,TRUE())`
  - Plain English: Count of rows in Opportunity Count
**Dimensions**: Owners.Owner, Owners.Manager
---

### `1556020474` — unsupported (decompositionTreeVisual)
**Purpose**: Visual: decompositionTreeVisual
**Importance**: 5

**Measures**:
- `Opportunities.Value`
  - Expression: `Sum(Opportunities[Value])`
  - Plain English: Sum of Value
**Dimensions**: Products.Product, Territories.Territory, Industries.Industry, Campaigns.Campaign, Products.Product LOB, Owners.Owner
---
