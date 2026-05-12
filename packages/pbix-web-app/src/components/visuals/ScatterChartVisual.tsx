import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useMemo } from "react"
import type { Visual } from "./types"
import { resolveData } from "./dataResolver"

const PBI_PALETTE = ["#118DFF", "#12239E", "#E66C37", "#6B007B", "#E044A7", "#744EC2", "#D9B300", "#D64550"]

interface ScatterChartVisualProps {
  visual: Visual
  data: Record<string, any[]>
}

const truncate = (n: number) => (s: any) => {
  const str = String(s);
  return str.length > n ? str.slice(0, n) + '\u2026' : str;
};

export function ScatterChartVisual({ visual, data }: ScatterChartVisualProps) {
  const { tableData, categoryCol, valueCols, empty } = resolveData(visual, data, "bar")
  // No measure evaluation needed for scatter (uses raw columns)

  if (empty || !tableData || !categoryCol) {
    return <div className="text-muted-foreground text-xs p-4">No data available</div>
  }

  const chartData = useMemo(() => {
    return tableData.slice(0, 200).map((row, i) => ({
      x: Number(row[valueCols?.[0] ?? ''] ?? 0),
      y: Number(row[valueCols?.[1] ?? valueCols?.[0] ?? ''] ?? 0),
      name: String(row[categoryCol] ?? i),
      z: 1,
    }))
  }, [tableData, categoryCol, valueCols])

  return (
    <div className="w-full h-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="x" tick={{ fontSize: 10 }} tickFormatter={truncate(15)} />
          <YAxis dataKey="y" tick={{ fontSize: 10 }} tickFormatter={truncate(15)} />
          <Tooltip />
          <Scatter name="Data" data={chartData} fill={PBI_PALETTE[0]} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
