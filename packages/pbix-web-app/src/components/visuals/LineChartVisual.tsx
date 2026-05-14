import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import type { Visual } from "./types"
import { resolveData } from "./dataResolver"
import { useMemo } from "react"
import { evaluateField, buildMeasureMap } from "@/lib/measureEvaluator"
import irData from "@/data/ir.json"
import { useFilteredData } from "@/components/layout/FilterContext"


const PBI_PALETTE = ["#118DFF", "#12239E", "#E66C37", "#6B007B", "#E044A7", "#744EC2", "#D9B300", "#D64550"]

interface LineChartVisualProps {
  visual: Visual
  data: Record<string, any[]>
}

export function LineChartVisual({ visual, data }: LineChartVisualProps) {
  const { tableData, categoryCol, valueCols, empty } = resolveData(visual, data, "line")
  
  if (empty) {
    return <div className="text-muted-foreground text-xs p-4">No data available</div>
  }
  const filteredData = useFilteredData(tableData)

  // Build measure map for evaluation
  const measureMap = useMemo(() => buildMeasureMap((irData as any).measures || []), [])
  const valueFields = visual.fields.filter(f => f.role === "Y" || f.role === "Values")
  const grouped = useMemo(() => {
    const result: Record<string, Record<string, number>> = {}
    for (const row of filteredData) {
      const cat = String(row[categoryCol ?? ""] ?? "N/A")
      if (!result[cat]) result[cat] = {}
      for (let vi = 0; vi < valueFields.length; vi++) {
        const vf = valueFields[vi]
        const col = valueCols![vi] || vf.column
        const measureKey = `${vf.table}.${vf.column}`
        const isMeasure = measureMap.has(measureKey)
        if (isMeasure) {
          if (result[cat][col] !== undefined) continue
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
  }, [filteredData, categoryCol, valueCols, valueFields, data, measureMap])

  const chartData = Object.entries(grouped).map(([key, vals]) => ({
    name: key,
    ...vals,
  }))

  return (
    <div className="w-full h-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} tickFormatter={truncate(20)} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          {valueCols!.length > 1 && <Legend wrapperStyle={{ fontSize: "10px" }} />}
          {valueCols!.map((col, i) => (
            <Line
              key={col}
              type="monotone"
              dataKey={col}
              stroke={PBI_PALETTE[i % PBI_PALETTE.length]}
              strokeWidth={2}
              dot={false}
              name={col}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

const truncate = (n: number) => (s: any) => {
  const str = String(s);
  return str.length > n ? str.slice(0, n) + '…' : str;
};

