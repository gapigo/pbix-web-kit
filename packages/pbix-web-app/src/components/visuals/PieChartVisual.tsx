import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import type { Visual } from "./types"

const PBI_PALETTE = ["#118DFF", "#12239E", "#E66C37", "#6B007B", "#E044A7", "#744EC2", "#D9B300", "#D64550"]

interface PieChartVisualProps {
  visual: Visual
  data: Record<string, any[]>
}

export function PieChartVisual({ visual, data }: PieChartVisualProps) {
  const categoryFields = visual.fields.filter(f => f.role === "Category")
  const valueFields = visual.fields.filter(f => f.role === "Values" || f.role === "Y")

  // Find data table
  const usedTables = [...new Set(visual.fields.map(f => f.table))]
  let tableData: any[] | null = null
  for (const t of usedTables) {
    if (data[t] && data[t].length > 0) { tableData = data[t]; break }
  }

  if (!tableData || tableData.length === 0) {
    return <div className="text-muted-foreground text-xs p-4">No data available</div>
  }

  // Resolve category column
  let catCol: string | null = null
  if (categoryFields.length > 0) {
    const lastCat = categoryFields[categoryFields.length - 1].column
    if (lastCat in tableData[0]) catCol = lastCat
    else {
      for (const cf of categoryFields) {
        if (cf.column in tableData[0]) { catCol = cf.column; break }
      }
    }
  }
  if (!catCol) {
    for (const [k, v] of Object.entries(tableData[0])) {
      if (typeof v === "string") { catCol = k; break }
    }
  }

  // Resolve value column
  let valCol: string | null = null
  if (valueFields.length > 0) {
    const firstVal = valueFields[0].column
    if (firstVal in tableData[0]) valCol = firstVal
  }
  if (!valCol) {
    for (const [k, v] of Object.entries(tableData[0])) {
      if (typeof v === "number" && k !== catCol) { valCol = k; break }
    }
  }

  if (!catCol || !valCol) {
    return <div className="text-muted-foreground text-xs p-4">No data available</div>
  }

  const grouped = aggregateData(tableData, catCol, valCol)
  const chartData = Object.entries(grouped).map(([name, value]) => ({ name, value }))

  const isDonut = visual.raw_type === "donutChart"

  return (
    <div className="w-full h-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={isDonut ? 50 : 0}
            label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
            labelLine={true}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={PBI_PALETTE[i % PBI_PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

function aggregateData(rows: any[], catCol: string, valCol: string): Record<string, number> {
  const result: Record<string, number> = {}
  for (const row of rows) {
    const cat = String(row[catCol] ?? "N/A")
    result[cat] = (result[cat] ?? 0) + Number(row[valCol] ?? 0)
  }
  return result
}
