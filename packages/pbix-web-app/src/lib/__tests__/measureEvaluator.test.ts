import { describe, it, expect } from "vitest"
import { evaluateMeasure } from "../measureEvaluator"

// Synthetic test data matching Opportunities structure
const opportunities = [
  { Value: 1000, Status: "Won", Territory: "US-WEST", Region: "West", SalesStage: "5-Close" },
  { Value: 2000, Status: "Won", Territory: "US-EAST",  Region: "East", SalesStage: "5-Close" },
  { Value: 3000, Status: "Open", Territory: "US-WEST", Region: "West", SalesStage: "4-Mandate" },
  { Value: 4000, Status: "Open", Territory: "US-SOUTH", Region: "South", SalesStage: "3-Pipeline" },
  { Value: 5000, Status: "Lost", Territory: "US-WEST", Region: "West", SalesStage: "5-Close" },
  { Value: 6000, Status: "Won", Territory: "US-WEST", Region: "West", SalesStage: "5-Close" },
]

// Measure map matching the actual measures
const allMeasures = new Map([
  ["Opportunities.Revenue Won", "CALCULATE(SUMX(Opportunities, Opportunities[Value]), FILTER(Opportunities, Opportunities[Status] = \"Won\"))"],
  ["Opportunities.Revenue In Pipeline", "skip-complex"],
  ["Opportunities.Revenue Open", "CALCULATE(SUMX(Opportunities, Opportunities[Value]), FILTER(Opportunities, Opportunities[Status] = \"Open\"))"],
  ["Opportunities.Opportunity Count", "COUNTAX(Opportunities,TRUE())"],
  ["Opportunities.Opportunity Count In Pipeline", "CALCULATE(COUNT(Opportunities[Value]), FILTER(Opportunities, Opportunities[Status] = \"Open\"))"],
  ["Opportunities.Count of Won", "skip-count-of-won"],
  ["Opportunities.Forecast", "([Revenue Won]+[Revenue In Pipeline])"],
  ["Opportunities.Close %", "[Count of Won]/([Count of Won]+[Count of Lost])"],
])

describe("evaluateMeasure", () => {
  // Pattern 1: SUM(Table[Column]) → basic aggregation without filter
  it("SUM — computes simple sum of a column", () => {
    const result = evaluateMeasure(
      "SUM(Opportunities[Value])",
      "Opportunities",
      opportunities,
      {},
      allMeasures,
    )
    expect(result).toBe(21000) // 1000+2000+3000+4000+5000+6000
  })

  // Pattern 1b: SUMX(Table, Table[Column]) — same as SUM
  it("SUMX — computes sumx of a column", () => {
    const result = evaluateMeasure(
      "SUMX(Opportunities, Opportunities[Value])",
      "Opportunities",
      opportunities,
      {},
    )
    expect(result).toBe(21000)
  })

  // Pattern 1c: CALCULATE with FILTER
  it("CALCULATE/SUMX/FILTER — Revenue Won (Won status)", () => {
    const result = evaluateMeasure(
      "CALCULATE(SUMX(Opportunities, Opportunities[Value]), FILTER(Opportunities, Opportunities[Status] = \"Won\"))",
      "Opportunities",
      opportunities,
      {},
    )
    // Only rows with Status="Won": Value=1000,2000,6000 → sum=9000
    expect(result).toBe(9000)
  })

  // Pattern 2: AVERAGE(Table[Column])
  it("AVERAGE — computes average of a column", () => {
    const result = evaluateMeasure(
      "AVERAGE(Opportunities[Value])",
      "Opportunities",
      opportunities,
      {},
    )
    expect(result).toBe(3500) // 21000/6
  })

  // Pattern 2b: AVG(Table[Column]) — alias
  it("AVG — computes average via alias", () => {
    const result = evaluateMeasure(
      "AVG(Opportunities[Value])",
      "Opportunities",
      opportunities,
      {},
    )
    expect(result).toBe(3500)
  })

  // Pattern 3: COUNT(Table[Column])
  it("COUNT — counts non-null values in a column", () => {
    const result = evaluateMeasure(
      "COUNT(Opportunities[Value])",
      "Opportunities",
      opportunities,
      {},
    )
    expect(result).toBe(6)
  })

  // Pattern 3b: COUNTROWS(Table)
  it("COUNTROWS — counts all rows in a table", () => {
    const result = evaluateMeasure(
      "COUNTROWS(Opportunities)",
      "Opportunities",
      opportunities,
      {},
    )
    expect(result).toBe(6)
  })

  // Pattern 4: MIN / MAX
  it("MIN — finds minimum value in column", () => {
    const result = evaluateMeasure(
      "MIN(Opportunities[Value])",
      "Opportunities",
      opportunities,
      {},
    )
    expect(result).toBe(1000)
  })

  it("MAX — finds maximum value in column", () => {
    const result = evaluateMeasure(
      "MAX(Opportunities[Value])",
      "Opportunities",
      opportunities,
      {},
    )
    expect(result).toBe(6000)
  })

  // Pattern 5: DISTINCTCOUNT
  it("DISTINCTCOUNT — counts distinct values in column", () => {
    const result = evaluateMeasure(
      "DISTINCTCOUNT(Opportunities[Status])",
      "Opportunities",
      opportunities,
      {},
    )
    expect(result).toBe(3) // Won, Open, Lost
  })

  // Pattern 6: DIVIDE
  it("DIVIDE — divides two expressions", () => {
    const result = evaluateMeasure(
      "DIVIDE(100, 4)",
      "Opportunities",
      opportunities,
      {},
    )
    expect(result).toBe(25)
  })

  it("DIVIDE — returns fallback when denominator is 0", () => {
    const result = evaluateMeasure(
      "DIVIDE(100, 0, 0)",
      "Opportunities",
      opportunities,
      {},
    )
    expect(result).toBe(0)
  })

  // Pattern 7: Measure reference via arithmetic
  it("Measure reference — resolves [Revenue Won] and filters by row context", () => {
    const result = evaluateMeasure(
      "CALCULATE(SUMX(Opportunities, Opportunities[Value]), FILTER(Opportunities, Opportunities[Status] = \"Won\"))",
      "Opportunities",
      opportunities,
      { Territory: ["US-WEST"] },
    )
    // Status="Won" AND Territory="US-WEST": Value=1000,6000 → sum=7000
    expect(result).toBe(7000)
  })

  // COUNT with CALCULATE/FILTER
  it("CALCULATE/COUNT/FILTER — Opportunity Count In Pipeline (Open status)", () => {
    const result = evaluateMeasure(
      "CALCULATE(COUNT(Opportunities[Value]), FILTER(Opportunities, Opportunities[Status] = \"Open\"))",
      "Opportunities",
      opportunities,
      {},
    )
    // Rows with Status="Open": 2 rows
    expect(result).toBe(2)
  })
})
