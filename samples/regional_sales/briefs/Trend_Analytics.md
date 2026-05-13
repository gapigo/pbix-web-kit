# Page: Trend Analytics

**Narrative**: This page (Trend Analytics) presents Opportunities.Count of Won, broken down by Discount), RELATIVE 30 DAY PERIOD, YEAR MONTH. It features 8 main visuals including KPIs, charts, and tables.
**Hero Metric**: Opportunities.Count of Won

## Data sources
- `Avg(Opportunities`
- `Opportunities`
- `Opportunity Calendar`

## Visuals (sorted by importance)

### `1556020207` — kpi (kpi)
**Purpose**: Show key metric: Count of Won
**Importance**: 1

**Measures**:
- `Opportunities.Count of Won`
  - Expression: `
COUNTAX(
    FILTER(
        KEEPFILTERS(Opportunities),Opportunities[Status] = "Won"
        ),
    Opportunities[OpportunitySeq]
    ) `
  - Plain English: Count of rows in Count of Won
**Dimensions**: Opportunity Calendar.RELATIVE 30 DAY PERIOD
---

### `1556020208` — kpi (kpi)
**Purpose**: Show key metric: Close %
**Importance**: 1

**Measures**:
- `Opportunities.Close %`
  - Expression: `[Count of Won]/([Count of Won]+[Count of Lost])`
  - Plain English: Measure: Close %
**Dimensions**: Opportunity Calendar.RELATIVE MONTH
---

### `1556020209` — kpi (kpi)
**Purpose**: Show key metric: Discount)
**Importance**: 1

**Dimensions**: Avg(Opportunities.Discount), Opportunity Calendar.RELATIVE MONTH
---

### `1556020210` — kpi (kpi)
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
**Dimensions**: Opportunity Calendar.RELATIVE MONTH
---

### `1556020204` — line (lineChart)
**Purpose**: Trend of values over Date
**Importance**: 2

**Measures**:
- `Opportunities.Revenue Won`
  - Expression: `
 CALCULATE(
     SUMX(Opportunities, Opportunities[Value]),
     FILTER(Opportunities, Opportunities[Status] = "Won")
 )`
  - Plain English: Categorized total of (SUMX(Opportunities)
**Dimensions**: Opportunity Calendar.Date
---

### `1556020205` — line (lineChart)
**Purpose**: Trend of values over YEAR MONTH
**Importance**: 2

**Measures**:
- `Opportunities.Close %`
  - Expression: `[Count of Won]/([Count of Won]+[Count of Lost])`
  - Plain English: Measure: Close %
**Dimensions**: Opportunity Calendar.YEAR MONTH
---

### `1556020206` — line (lineChart)
**Purpose**: Trend of values over Date
**Importance**: 3

**Measures**:
- `Opportunities.Revenue Won`
  - Expression: `
 CALCULATE(
     SUMX(Opportunities, Opportunities[Value]),
     FILTER(Opportunities, Opportunities[Status] = "Won")
 )`
  - Plain English: Categorized total of (SUMX(Opportunities)
**Dimensions**: Opportunity Calendar.Date
---

### `1556020222` — line (lineChart)
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
