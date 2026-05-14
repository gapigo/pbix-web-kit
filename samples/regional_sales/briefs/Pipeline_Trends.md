# Page: Pipeline Trends

**Narrative**: This page (Pipeline Trends) presents Opportunities.Opportunity Count, broken down by Discount), Industry, YEAR MONTH. It features 6 main visuals including KPIs, charts, and tables.
**Hero Metric**: Opportunities.Opportunity Count

## Data sources
- `Accounts`
- `Avg(Opportunities`
- `Industries`
- `Opportunities`
- `Opportunity Calendar`
- `Owners`
- `Products`
- `Territories`

## Visuals (sorted by importance)

### `1556020051` — kpi (kpi)
**Purpose**: Show key metric: Opportunity Count
**Importance**: 1

**Measures**:
- `Opportunities.Opportunity Count`
  - Expression: `
COUNTAX(Opportunities,TRUE())`
  - Plain English: Count of rows in Opportunity Count
**Dimensions**: Opportunities.Blank
---

### `1556020053` — kpi (kpi)
**Purpose**: Show key metric: Days Remaining In Pipeline)
**Importance**: 1

**Dimensions**: Avg(Opportunities.Days Remaining In Pipeline), Opportunities.Blank
---

### `1556020055` — kpi (kpi)
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

### `1556020057` — kpi (kpi)
**Purpose**: Show key metric: Revenue In Pipeline
**Importance**: 1

**Measures**:
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
**Dimensions**: Opportunities.Blank
---

### `1556020043` — bar (barChart)
**Purpose**: Compare Revenue Open across Product LOB
**Importance**: 2

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
- `Opportunities.Opportunity Count In Pipeline`
  - Expression: `
    CALCULATE (
        COUNT( Opportunities[Value] ),
        FILTER (
            Opportunities,
            Opportunities[Status] = "Open"
              --  && Opportunities[PipelineStep] IN { "3-Pipeline", "4-Mandate", "5-Close" }
        )
    )
`
  - Plain English: Categorized total of (CALCULATE (
        COUNT( Opportunities[Value] ))
**Dimensions**: Products.Product LOB, Products.Product, Territories.Territory
---

### `1556020042` — table (tableEx)
**Purpose**: Data table with detailed values
**Importance**: 3

**Measures**:
- `Opportunities.Weeks Open`
  - Expression: `Sum(Opportunities[Weeks Open])`
  - Plain English: Sum of Weeks Open
- `Opportunities.Value`
  - Expression: `Sum(Opportunities[Value])`
  - Plain English: Sum of Value
**Dimensions**: Territories.Territory, Products.Product, Industries.Industry, Avg(Opportunities.Discount), Avg(Opportunities.Days Remaining In Pipeline), Accounts.Account Name, Opportunities.Rating, Opportunities.PipelineStep, Owners.Owner
---

### `1556020128` — bar (ribbonChart)
**Purpose**: Combination chart with multiple measure types
**Importance**: 5

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
**Dimensions**: Industries.Industry, Opportunity Calendar.YEAR MONTH
---
