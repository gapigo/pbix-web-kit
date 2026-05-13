# Page: Industries Overview

**Narrative**: This page (Industries Overview) presents key metrics, broken down by Industry, YEAR MONTH, Product. It features 5 main visuals including KPIs, charts, and tables.
**Hero Metric**: —

## Data sources
- `Accounts`
- `Industries`
- `Opportunities`
- `Opportunity Calendar`
- `Owners`
- `Products`

## Visuals (sorted by importance)

### `1556020037` — table (pivotTable)
**Purpose**: Tabular breakdown by Industry
**Importance**: 2

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
- `Opportunities.Close %`
  - Expression: `[Count of Won]/([Count of Won]+[Count of Lost])`
  - Plain English: Measure: Close %
- `Opportunities.Revenue Won Average Deal Size`
  - Expression: `AVERAGEX(Opportunities,[Revenue Won])`
  - Plain English: Measure: Revenue Won Average Deal Size
**Dimensions**: Industries.Industry
---

### `1556020033` — table (pivotTable)
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

### `1556020038` — table (tableEx)
**Purpose**: Data table with detailed values
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
**Dimensions**: Owners.Manager, Owners.Owner, Accounts.Account Name
---

### `1556020039` — scatter (scatterChart)
**Purpose**: Scatter plot comparing two measures
**Importance**: 3

**Measures**:
- `Opportunities.Opportunity Count`
  - Expression: `
COUNTAX(Opportunities,TRUE())`
  - Plain English: Count of rows in Opportunity Count
- `Opportunities.Revenue Won`
  - Expression: `
 CALCULATE(
     SUMX(Opportunities, Opportunities[Value]),
     FILTER(Opportunities, Opportunities[Status] = "Won")
 )`
  - Plain English: Categorized total of (SUMX(Opportunities)
- `Opportunities.Revenue Won Average Deal Size`
  - Expression: `AVERAGEX(Opportunities,[Revenue Won])`
  - Plain English: Measure: Revenue Won Average Deal Size
**Dimensions**: Industries.Industry, Opportunity Calendar.YEAR MONTH
---

### `1556020041` — line (lineChart)
**Purpose**: Trend of values over YEAR MONTH
**Importance**: 3

**Measures**:
- `Opportunities.Revenue Won`
  - Expression: `
 CALCULATE(
     SUMX(Opportunities, Opportunities[Value]),
     FILTER(Opportunities, Opportunities[Status] = "Won")
 )`
  - Plain English: Categorized total of (SUMX(Opportunities)
**Dimensions**: Opportunity Calendar.YEAR MONTH
---
