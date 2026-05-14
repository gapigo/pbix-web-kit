# Page: Sales Overview

**Narrative**: This page (Sales Overview) presents Opportunities.Revenue Won, broken down by Owner Goal, State or Province, Forecast Adjustment. It features 11 main visuals including KPIs, charts, and tables.
**Hero Metric**: Opportunities.Revenue Won

## Data sources
- `Accounts`
- `Forecast Adjustment`
- `Opportunities`
- `Opportunity Forecast Adjustment`
- `Owners`
- `Products`
- `Territories`

## Filters available on this page
- `Forecast Adjustment.Forecast Adjustment` (slicer)

## Visuals (sorted by importance)

### `1556019845` — kpi (kpi)
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

### `1556019847` — kpi (kpi)
**Purpose**: Show key metric: Rev Goal
**Importance**: 1

**Measures**:
- `Owners.Rev Goal`
  - Expression: `
VAR RevenueInPipeline =
    CALCULATE (
        SUMX ( Opportunities, Opportunities[Value] ),
        FILTER (
            Opportunities,
            Opportunities[Status] = "Open"
            && VALUE(LEFT(Opportunities[Sales Stage],1)) >=2
        )
    )
VAR BaseGoal =  
MROUND(([Revenue Won]+ (RevenueInPipeline*.60)),1000000)    
RETURN
IF(BaseGoal > 0, BaseGoal, MROUND(([Revenue Won]+ (RevenueInPipeline*.60)),100000))`
  - Plain English: Categorized total of (VAR RevenueInPipeline =
    CALCULATE (
        SUMX ( Opportunities)
**Dimensions**: Opportunities.Blank
---

### `1556019849` — kpi (kpi)
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

### `1556019851` — kpi (kpi)
**Purpose**: Show key metric: Forecast %
**Importance**: 1

**Measures**:
- `Opportunities.Forecast %`
  - Expression: `(([Revenue Won]+[Revenue In Pipeline]))/ [Rev Goal]`
  - Plain English: Measure: Forecast %
**Dimensions**: Opportunities.Blank
---

### `1556019769` — bar (columnChart)
**Purpose**: Compare Blank across Forecast Adjustment
**Importance**: 2

**Measures**:
- `Opportunity Forecast Adjustment.Blank`
  - Expression: `Sum(Opportunity Forecast Adjustment[Blank])`
  - Plain English: Sum of Blank
**Dimensions**: Opportunity Forecast Adjustment.Forecast Adjustment
---

### `1556019858` — bar (barChart)
**Purpose**: Compare Revenue Won across Product LOB
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

### `1556019852` — map (shapeMap)
**Purpose**: Geographic map
**Importance**: 3

**Measures**:
- `Accounts.Street Hierarchy.State or Province`
  - Expression: `Min(Accounts.Street Hierarchy[State or Province])`
  - Plain English: Min of State or Province
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
- `Owners.Rev Goal`
  - Expression: `
VAR RevenueInPipeline =
    CALCULATE (
        SUMX ( Opportunities, Opportunities[Value] ),
        FILTER (
            Opportunities,
            Opportunities[Status] = "Open"
            && VALUE(LEFT(Opportunities[Sales Stage],1)) >=2
        )
    )
VAR BaseGoal =  
MROUND(([Revenue Won]+ (RevenueInPipeline*.60)),1000000)    
RETURN
IF(BaseGoal > 0, BaseGoal, MROUND(([Revenue Won]+ (RevenueInPipeline*.60)),100000))`
  - Plain English: Categorized total of (VAR RevenueInPipeline =
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
**Dimensions**: Accounts.Street Hierarchy.State or Province
---

### `1556019853` — table (pivotTable)
**Purpose**: Tabular breakdown by Territory
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
**Dimensions**: Accounts.State or Province, Territories.Territory
---

### `1556019856` — table (pivotTable)
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

### `1556019857` — combo (lineStackedColumnComboChart)
**Purpose**: Trend of values over Manager
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
- `Opportunities.Revenue Won`
  - Expression: `
 CALCULATE(
     SUMX(Opportunities, Opportunities[Value]),
     FILTER(Opportunities, Opportunities[Status] = "Won")
 )`
  - Plain English: Categorized total of (SUMX(Opportunities)
**Dimensions**: Owners.Owner Goal, Owners.Owner, Owners.Manager
---

### `1556019859` — funnel (funnel)
**Purpose**: Funnel chart showing progression
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
**Dimensions**: Opportunities.PipelineStep
---

### `1556019768` — slicer (slicer)
**Purpose**: Interactive slicer / filter
**Importance**: 4

**Dimensions**: Forecast Adjustment.Forecast Adjustment
---
