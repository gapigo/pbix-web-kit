import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import type { Visual } from "./types"
import { resolveData } from "./dataResolver"
import { useMemo } from "react"
import { evaluateField, buildMeasureMap } from "@/lib/measureEvaluator"
import irData from "@/data/ir.json"


const PBI_PALETTE = ["#118DFF", "#12239E", "#E66C37", "#6B007B", "#E044A7", "#744EC2", "#D9B300", "#D64550"]

interface BarChartVisualProps {
  visual: Visual
  data: Record<string, any[]>
}

export function BarChartVisual({ visual, data }: BarChartVisualProps) {
  const { tableData, categoryCol, valueCols, empty } = resolveData(visual, data, "bar")
  const measureMap = useMemo(() => buildMeasureMap((irData as any).measures || []), [])

  if (empty) {
    return <div className="text-muted-foreground text-xs p-4">No data available</div>
  }

  // Aggregate data using evaluator for measures
  const grouped = useMemo(() => {
    const valueFields = visual.fields.filter(f => f.role === "Y" || f.role === "Values")

    const result: Record<string, Record<string, number>> = {}
    for (const row of tableData!) {
      const cat = String(row[categoryCol ?? ""] ?? "N/A")
      if (!result[cat]) result[cat] = {}
      for (let vi = 0; vi < valueFields.length; vi++) {
        const vf = valueFields[vi]
        const col = valueCols![vi] || vf.column
        const measureKey = `${vf.table}.${vf.column}`
        const isMeasure = measureMap.has(measureKey)
        if (isMeasure) {
          if (result[cat][col] !== undefined) continue // already computed
          const rowFilters: Record<string, string[]> = {}
          rowFilters[categoryCol ?? ""] = [cat]
          const evalVal = evaluateField(vf, data, rowFilters, measureMap)
          if (evalVal !== null) {
            result[cat][col] = evalVal
          } else {
            const val = Number(row[vf.column] ?? 0)
            result[cat][col] = (result[cat][col] ?? 0) + val
          }
        } else {
          const val = Number(row[col] ?? 0)
          result[cat][col] = (result[cat][col] ?? 0) + val
        }
      }
    }
    return result
  }, [tableData, categoryCol, valueCols, visual.fields, data, measureMap])

  const chartData = Object.entries(grouped).map(([key, vals]) => ({
    name: key,
    ...vals,
  }))


  const isVertical = visual.raw_type === "barChart"
  return (
    <div className="w-full h-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout={isVertical ? "vertical" : "horizontal"} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          {isVertical ? (
            <>
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} tickFormatter={truncate(20)} />
            </>
          ) : (
            <>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} tickFormatter={truncate(20)} />
              <YAxis tick={{ fontSize: 10 }} />
            </>
          )}
          <Tooltip />
          {valueCols && valueCols.length > 1 && <Legend wrapperStyle={{ fontSize: "10px" }} />}
          {valueCols!.map((col, i) => (
            <Bar
              key={col}
              dataKey={col}
              fill={PBI_PALETTE[i % PBI_PALETTE.length]}
              name={col}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

const truncate = (n: number) => (s: any) => {
  const str = String(s);
  return str.length > n ? str.slice(0, n) + '…' : str;
};


