import { Card, CardContent } from "@/components/ui/card"
import type { Visual } from "./types"
import { evaluateField, buildMeasureMap } from "@/lib/measureEvaluator"
import irData from "@/data/ir.json"

interface KpiCardProps {
  visual: Visual
  data: Record<string, any[]>
}

export function KpiCard({ visual, data }: KpiCardProps) {
  const computedValues = visual.config?.computed_values as Record<string, number> | undefined

  // Get the first indicator field
  const indicatorField = visual.fields.find(f => f.role === "Indicator")
  const indicatorKey = indicatorField ? `${indicatorField.table}.${indicatorField.column}` : null

  let value: number | null = null
  let label = ""

  // Try computed values first
  if (indicatorKey && computedValues?.[indicatorKey] !== undefined) {
    value = computedValues[indicatorKey]
  }
  // Measure evaluator fallback: try to evaluate the field as a DAX measure
  if (value === null && indicatorField) {
    const measureMap = buildMeasureMap((irData as any).measures || []);
    value = evaluateField(indicatorField, data, {}, measureMap);
  }


  // Fallback: try to compute from raw data (simple sum)
  if (value === null && indicatorField) {
    const tableData = data[indicatorField.table]
    if (tableData && tableData.length > 0) {
      const col = indicatorField.column
      // Check if column exists in raw data
      if (col in tableData[0]) {
        value = tableData.reduce((sum: number, row: any) => sum + (Number(row[col]) || 0), 0)
      }
    }
  }

  if (indicatorField) {
    label = indicatorField.column
  }

  const displayValue = value !== null
    ? formatNumber(value)
    : "—"

  return (
    <Card className="h-full w-full flex flex-col justify-center items-center p-3">
      <CardContent className="p-0 text-center">
        <div className="text-2xl font-bold tabular-nums">{displayValue}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </CardContent>
    </Card>
  )
}

function formatNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) {
    return (n / 1_000_000_000).toFixed(1) + "B"
  }
  if (Math.abs(n) >= 1_000_000) {
    return (n / 1_000_000).toFixed(1) + "M"
  }
  if (Math.abs(n) >= 1_000) {
    return (n / 1_000).toFixed(1) + "K"
  }
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 })
}
