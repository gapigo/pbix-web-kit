import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useMemo } from "react"
import type { Visual } from "./types"
import { resolveData } from "./dataResolver"
import { evaluateField, buildMeasureMap } from "@/lib/measureEvaluator"
import irData from "@/data/ir.json"

const PBI_PALETTE = ["#118DFF", "#12239E", "#E66C37", "#6B007B", "#E044A7", "#744EC2", "#D9B300", "#D64550"]

interface ComboChartVisualProps {
  visual: Visual
  data: Record<string, any[]>
}

const truncate = (n: number) => (s: any) => {
  const str = String(s);
  return str.length > n ? str.slice(0, n) + '\u2026' : str;
};

export function ComboChartVisual({ visual, data }: ComboChartVisualProps) {
  const { tableData, categoryCol, valueCols, empty } = resolveData(visual, data, "bar")
  const measureMap = useMemo(() => buildMeasureMap((irData as any).measures || []), [])

  if (empty || !tableData || !categoryCol) {
    return <div className="text-muted-foreground text-xs p-4">No data available</div>
  }

  const valueFields = visual.fields.filter(f => f.role === "Y" || f.role === "Values")

  const chartData = useMemo(() => {
    const grouped: Record<string, Record<string, number>> = {}
    for (const row of tableData) {
      const cat = String(row[categoryCol] ?? "N/A")
      if (!grouped[cat]) grouped[cat] = {}
      for (let vi = 0; vi < valueFields.length; vi++) {
        const vf = valueFields[vi]
        const col = valueCols?.[vi] || vf.column
        const measureKey = `${vf.table}.${vf.column}`
        const isMeasure = measureMap.has(measureKey)
        if (isMeasure) {
          if (grouped[cat][col] !== undefined) continue
          const rowFilters: Record<string, string[]> = {}
          rowFilters[categoryCol] = [cat]
          const evalVal = evaluateField(vf, data, rowFilters, measureMap)
          grouped[cat][col] = evalVal !== null ? evalVal : 0
        } else {
          grouped[cat][col] = (grouped[cat][col] ?? 0) + Number(row[col] ?? 0)
        }
      }
    }
    return Object.entries(grouped).map(([name, vals]) => ({ name, ...vals }))
  }, [tableData, categoryCol, valueCols, valueFields, data, measureMap])

  return (
    <div className="w-full h-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} tickFormatter={truncate(20)} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          {valueCols && valueCols.length > 1 && <Legend wrapperStyle={{ fontSize: "10px" }} />}
          {valueCols?.map((col, i) =>
            i % 2 === 0 ? (
              <Bar key={col} dataKey={col} fill={PBI_PALETTE[i % PBI_PALETTE.length]} name={col} />
            ) : (
              <Line key={col} type="monotone" dataKey={col} stroke={PBI_PALETTE[i % PBI_PALETTE.length]} strokeWidth={2} dot={false} name={col} />
            )
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
