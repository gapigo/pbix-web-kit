# Page: Win/Loss Ratio Overview

**Narrative**: This page (Win/Loss Ratio Overview) presents Opportunities.Revenue Open, broken down by YEAR MONTH, Blank, Product. It features 9 main visuals including KPIs, charts, and tables.
**Hero Metric**: Opportunities.Revenue Open

## Data sources
- `Opportunities`
- `Opportunity Calendar`
- `Owners`
- `Products`

## Visuals (sorted by importance)

### `1556019943` — kpi (kpi)
**Purpose**: Show key metric: Revenue Open
**Importance**: 1

**Measures**:
- `Opportunities.Revenue Open`
  - Expression: `
VAR Revenue =
    CALCULATE (
        SUMX ( Opportunities, Opportunities[Value] ),
        FILTER (
            Opportunities,
            Opportunities[Status] = "Open"
        )
    )
RETURN
    Revenue + ( Revenue * ( 'Opportunity Forecast Adjustment'[Forecast Adjustment Value] / 100 ) )`
  - Plain English: Categorized total of (VAR Revenue =
    CALCULATE (
        SUMX ( Opportunities)
**Dimensions**: Opportunities.Blank
---

### `1556019945` — kpi (kpi)
**Purpose**: Show key metric: Forecast by Win/Loss Ratio
**Importance**: 1

**Measures**:
- `Opportunities.Forecast by Win/Loss Ratio`
  - Expression: `[Revenue Open] * [Close %]`
  - Plain English: Measure: Forecast by Win/Loss Ratio
**Dimensions**: Opportunities.Blank
---

### `1556019956` — kpi (kpi)
**Purpose**: Show key metric: Revenue Won
**Importance**: 1

**Measures**:
- `Opportunities.Revenue Won`
  - Expression: `
 CALCULATE(
     SUMX(Opportunities, Opportunities[Value]),
     FILTER(Opportunities, Opportunities[Status] = "Won")
 )`
  - Plain English: Categorized total of (SUMX(Opportunities)
**Dimensions**: Opportunities.Blank
---

### `1556019957` — kpi (kpi)
**Purpose**: Show key metric: Close %
**Importance**: 1

**Measures**:
- `Opportunities.Close %`
  - Expression: `[Count of Won]/([Count of Won]+[Count of Lost])`
  - Plain English: Measure: Close %
**Dimensions**: Opportunities.Blank
---

### `1556019950` — bar (barChart)
**Purpose**: Compare Close % across Product LOB
**Importance**: 2

**Measures**:
- `Opportunities.Close %`
  - Expression: `[Count of Won]/([Count of Won]+[Count of Lost])`
  - Plain English: Measure: Close %
- `Opportunities.Revenue In Pipeline`
  - Expression: `
VAR Revenue =
    CALCULATE (
        SUMX ( Opportunities, Opportunities[Value] ),
        FILTER (
            Opportunities,
            Opportunities[Status] = "Open"
            && VALUE(LEFT(Opportunities[Sales Stage],1)) >=2
        )
    )
RETURN
    Revenue + ( Revenue * ( 'Opportunity Forecast Adjustment'[Forecast Adjustment Value] / 100 ) )
`
  - Plain English: Categorized total of (VAR Revenue =
    CALCULATE (
        SUMX ( Opportunities)
**Dimensions**: Products.Product LOB, Products.Product
---

### `1556019952` — bar (clusteredColumnChart)
**Purpose**: Compare Close % across Manager
**Importance**: 2

**Measures**:
- `Opportunities.Close %`
  - Expression: `[Count of Won]/([Count of Won]+[Count of Lost])`
  - Plain English: Measure: Close %
**Dimensions**: Owners.Owner, Owners.Manager
---

### `1556019946` — table (tableEx)
**Purpose**: Data table with detailed values
**Importance**: 3

**Measures**:
- `Opportunities.Revenue Open`
  - Expression: `
VAR Revenue =
    CALCULATE (
        SUMX ( Opportunities, Opportunities[Value] ),
        FILTER (
            Opportunities,
            Opportunities[Status] = "Open"
        )
    )
RETURN
    Revenue + ( Revenue * ( 'Opportunity Forecast Adjustment'[Forecast Adjustment Value] / 100 ) )`
  - Plain English: Categorized total of (VAR Revenue =
    CALCULATE (
        SUMX ( Opportunities)
- `Opportunities.Close %`
  - Expression: `[Count of Won]/([Count of Won]+[Count of Lost])`
  - Plain English: Measure: Close %
- `Opportunities.Forecast by Win/Loss Ratio`
  - Expression: `[Revenue Open] * [Close %]`
  - Plain English: Measure: Forecast by Win/Loss Ratio
**Dimensions**: Owners.Owner, Owners.Manager
---

### `1556019947` — table (pivotTable)
**Purpose**: Tabular breakdown by Product LOB
**Importance**: 3

**Measures**:
- `Opportunities.Revenue Won`
  - Expression: `
 CALCULATE(
     SUMX(Opportunities, Opportunities[Value]),
     FILTER(Opportunities, Opportunities[Status] = "Won")
 )`
  - Plain English: Categorized total of (SUMX(Opportunities)
- `Opportunities.Revenue In Pipeline`
  - Expression: `
VAR Revenue =
    CALCULATE (
        SUMX ( Opportunities, Opportunities[Value] ),
        FILTER (
            Opportunities,
            Opportunities[Status] = "Open"
            && VALUE(LEFT(Opportunities[Sales Stage],1)) >=2
        )
    )
RETURN
    Revenue + ( Revenue * ( 'Opportunity Forecast Adjustment'[Forecast Adjustment Value] / 100 ) )
`
  - Plain English: Categorized total of (VAR Revenue =
    CALCULATE (
        SUMX ( Opportunities)
- `Opportunities.Forecast %`
  - Expression: `(([Revenue Won]+[Revenue In Pipeline]))/ [Rev Goal]`
  - Plain English: Measure: Forecast %
**Dimensions**: Products.Product LOB, Products.Product
---

### `1556019949` — line (lineChart)
**Purpose**: Trend of values over YEAR MONTH
**Importance**: 3

**Measures**:
- `Opportunities.Close %`
  - Expression: `[Count of Won]/([Count of Won]+[Count of Lost])`
  - Plain English: Measure: Close %
**Dimensions**: Opportunity Calendar.YEAR MONTH
---

### `1556019951` — unsupported (FlowVisual_C29F1DCC_81F5_4973_94AD_0517D44CC06A)
**Purpose**: Flow / Sankey diagram
**Importance**: 5

**Dimensions**: Owners.systemuserid
---
