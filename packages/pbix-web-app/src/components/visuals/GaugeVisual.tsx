import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts"
import { useMemo } from "react"
import type { Visual } from "./types"

const PBI_PALETTE = ["#118DFF", "#12239E", "#E66C37", "#6B007B", "#E044A7", "#744EC2", "#D9B300", "#D64550"]

interface GaugeVisualProps {
  visual: Visual
  data: Record<string, any[]>
}

export function GaugeVisual({ visual, data }: GaugeVisualProps) {
  const valueFields = visual.fields.filter(f => f.role === "Values" || f.role === "Y")

  const usedTables = [...new Set(visual.fields.map(f => f.table))]
  let tableData: any[] | null = null
  for (const t of usedTables) {
    if (data[t] && data[t].length > 0) { tableData = data[t]; break }
  }

  if (!tableData || tableData.length === 0) {
    return <div className="text-muted-foreground text-xs p-4">No data available</div>
  }

  let valCol = valueFields[0]?.column || (tableData[0] ? Object.keys(tableData[0]).find(k => typeof tableData[0][k] === 'number') : null)

  if (!valCol) {
    return <div className="text-muted-foreground text-xs p-4">No data available</div>
  }

  const total = useMemo(() => {
    return tableData!.reduce((s: number, r: any) => s + (Number(r[valCol!]) || 0), 0)
  }, [tableData, valCol])

  const data1 = useMemo(() => [
    { name: 'Value', value: total, fill: PBI_PALETTE[0] },
    { name: 'Max', value: total * 1.5 || 1, fill: '#eee' },
  ], [total])

  return (
    <div className="w-full h-full p-2 flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="80%">
        <RadialBarChart innerRadius="20%" outerRadius="100%" data={data1} startAngle={180} endAngle={0}>
          <RadialBar dataKey="value" cornerRadius={10} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="text-lg font-bold tabular-nums mt-2">{total.toLocaleString()}</div>
      <div className="text-xs text-muted-foreground">{valCol}</div>
    </div>
  )
}
