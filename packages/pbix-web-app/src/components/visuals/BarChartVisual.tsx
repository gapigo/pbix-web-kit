import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import type { Visual } from "./types"
import { resolveData } from "./dataResolver"

const PBI_PALETTE = ["#118DFF", "#12239E", "#E66C37", "#6B007B", "#E044A7", "#744EC2", "#D9B300", "#D64550"]

interface BarChartVisualProps {
  visual: Visual
  data: Record<string, any[]>
}

export function BarChartVisual({ visual, data }: BarChartVisualProps) {
  const { tableData, categoryCol, valueCols, empty } = resolveData(visual, data, "bar")
  
  if (empty) {
    return <div className="text-muted-foreground text-xs p-4">No data available</div>
  }

  // Aggregate data
  const grouped = aggregateData(tableData!, categoryCol!, valueCols!)

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
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
            </>
          ) : (
            <>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
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

function aggregateData(
  rows: any[],
  categoryCol: string,
  valueCols: string[]
): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {}
  for (const row of rows) {
    const cat = String(row[categoryCol] ?? "N/A")
    if (!result[cat]) result[cat] = {}
    for (const col of valueCols) {
      const val = Number(row[col] ?? 0)
      result[cat][col] = (result[cat][col] ?? 0) + val
    }
  }
  return result
}
