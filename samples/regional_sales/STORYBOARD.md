# Regional Sales Sample — Storyboard

**Source**: `samples\regional_sales\Regional Sales Sample.pbix`
**Pages**: 11
**Tables**: 9
**Measures tracked**: 15
**Generated at**: 2026-05-13T01:24:25.065913

## Overall Narrative
Dashboard Regional Sales Sample contains 11 pages covering: Sales Overview, Win/Loss Ratio Overview, Industries Overview, Pipeline Trends, Trend Analytics, Win/Loss Ratio Insights, Days to Close Insights, Sales Discounting Insights, Revenue Source Breakdown, Q&A Query, Template. The primary metric tracked is Opportunities.Revenue Won.

## Pages
- **Sales Overview** — This page (Sales Overview) presents Opportunities.Revenue Won, broken down by Owner Goal, State or Province, Forecast Ad…
  - 12 visuals, hero: Opportunities.Revenue Won
- **Win/Loss Ratio Overview** — This page (Win/Loss Ratio Overview) presents Opportunities.Revenue Open, broken down by YEAR MONTH, Blank, Product. It f…
  - 10 visuals, hero: Opportunities.Revenue Open
- **Industries Overview** — This page (Industries Overview) presents key metrics, broken down by Industry, YEAR MONTH, Product. It features 5 main v…
  - 5 visuals, hero: N/A
- **Pipeline Trends** — This page (Pipeline Trends) presents Opportunities.Opportunity Count, broken down by Discount), Industry, YEAR MONTH. It…
  - 7 visuals, hero: Opportunities.Opportunity Count
- **Trend Analytics** — This page (Trend Analytics) presents Opportunities.Count of Won, broken down by Discount), RELATIVE 30 DAY PERIOD, YEAR …
  - 8 visuals, hero: Opportunities.Count of Won
- **Win/Loss Ratio Insights** — This page (Win/Loss Ratio Insights) presents key metrics, broken down by Discount), Industry, Status. It features 2 main…
  - 3 visuals, hero: N/A
- **Days to Close Insights** — This page (Days to Close Insights) presents key metrics, broken down by Region, Industry, DaysToClose. It features 2 mai…
  - 3 visuals, hero: N/A
- **Sales Discounting Insights** — This page (Sales Discounting Insights) presents key metrics, broken down by Region, Discount), Industry. It features 2 m…
  - 3 visuals, hero: N/A
- **Revenue Source Breakdown** — This page (Revenue Source Breakdown) presents key metrics, broken down by Industry, Campaign, Product. It features 2 mai…
  - 3 visuals, hero: N/A
- **Q&A Query** — This page (Q&A Query) presents key metrics, broken down by Region, Industry, Discount. It features 0 main visuals includ…
  - 1 visuals, hero: N/A
- **Template** — This page (Template) presents key metrics. It features 0 main visuals including KPIs, charts, and tables.…
  - 0 visuals, hero: N/A

## Tables
- **Accounts**: 300 rows, 9 columns
  - Columns: `Account Name`: string, `State or Province`: string, `Country`: string, `AccountID`: string, `AccountSeq`: Int64…
- **Campaigns**: 12 rows, 3 columns
  - Columns: `CampaignSeq`: Int64, `Campaign Type`: string, `Campaign`: string
- **Contacts**: 1 rows, 4 columns
  - Columns: `Contact`: string, `Job Title`: string, `ContactSeq`: Int64, `AccountSeq`: Int64
- **Industries**: 45 rows, 2 columns
  - Columns: `Industry`: string, `IndustrySeq`: Int64
- **Opportunities**: 20000 rows, 22 columns
  - Columns: `Purchase Process`: string, `Decision Maker Identified`: bool, `Status`: string, `Sales Stage`: string, `Value`: Int64…
- **Opportunity Forecast Adjustment**: 11 rows, 1 columns
  - Columns: `Blank`: object
- **Owners**: 20 rows, 4 columns
  - Columns: `Owner`: string, `Manager`: string, `SystemUserSeq`: Int64, `systemuserid`: string
- **Products**: 9 rows, 3 columns
  - Columns: `Product`: string, `ProductSeq`: Int64, `Product Category`: string
- **Territories**: 51 rows, 5 columns
  - Columns: `Region`: string, `Territory`: string, `Country`: string, `TerritorySeq`: string, `State Or Province`: string

## Measures Glossary
- **Opportunities.Close %**: `[Count of Won]/([Count of Won]+[Count of Lost])`
- **Opportunities.Count of Lost**: `
COUNTAX(
    FILTER(
        KEEPFILTERS(Opportunities),Opportunities[Status] = "Lost"
        ),
 …`
- **Opportunities.Count of Won**: `
COUNTAX(
    FILTER(
        KEEPFILTERS(Opportunities),Opportunities[Status] = "Won"
        ),
  …`
- **Opportunities.Forecast**: `([Revenue Won]+[Revenue In Pipeline])`
- **Opportunities.Forecast %**: `(([Revenue Won]+[Revenue In Pipeline]))/ [Rev Goal]`
- **Opportunities.Forecast by Win/Loss Ratio**: `[Revenue Open] * [Close %]`
- **Opportunities.Opportunity Count**: `
COUNTAX(Opportunities,TRUE())`
- **Opportunities.Opportunity Count In Pipeline**: `
    CALCULATE (
        COUNT( Opportunities[Value] ),
        FILTER (
            Opportunities,
…`
- **Opportunities.Revenue In Pipeline**: `
VAR Revenue =
    CALCULATE (
        SUMX ( Opportunities, Opportunities[Value] ),
        FILTER …`
- **Opportunities.Revenue Open**: `
VAR Revenue =
    CALCULATE (
        SUMX ( Opportunities, Opportunities[Value] ),
        FILTER …`
- **Opportunities.Revenue Won**: `
 CALCULATE(
     SUMX(Opportunities, Opportunities[Value]),
     FILTER(Opportunities, Opportunitie…`
- **Opportunities.Revenue Won Average Deal Size**: `AVERAGEX(Opportunities,[Revenue Won])`
- **Opportunity Forecast Adjustment.Fcst adj slicer alt text**: `CONCATENATE("Use the slicer to adjust the forecast, current value is ", 'Opportunity Forecast Adjust…`
- **Opportunity Forecast Adjustment.Forecast Adjustment Value**: `SELECTEDVALUE('Opportunity Forecast Adjustment'[Forecast Adjustment], 0)`
- **Owners.Rev Goal**: `
VAR RevenueInPipeline =
    CALCULATE (
        SUMX ( Opportunities, Opportunities[Value] ),
     …`
