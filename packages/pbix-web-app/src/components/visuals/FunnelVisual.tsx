import { FunnelChart, Funnel, Tooltip, LabelList, ResponsiveContainer } from "recharts"
import { useMemo } from "react"
import type { Visual } from "./types"


interface FunnelVisualProps {
  visual: Visual
  data: Record<string, any[]>
}

export function FunnelVisual({ visual, data }: FunnelVisualProps) {
  const categoryFields = visual.fields.filter(f => f.role === "Category")
  const valueFields = visual.fields.filter(f => f.role === "Values" || f.role === "Y")

  const usedTables = [...new Set(visual.fields.map(f => f.table))]
  let tableData: any[] | null = null
  for (const t of usedTables) {
    if (data[t] && data[t].length > 0) { tableData = data[t]; break }
  }

  if (!tableData || tableData.length === 0) {
    return <div className="text-muted-foreground text-xs p-4">No data available</div>
  }

  let catCol = categoryFields[0]?.column || (tableData[0] ? Object.keys(tableData[0]).find(k => typeof tableData[0][k] === 'string') : null)
  let valCol = valueFields[0]?.column || (tableData[0] ? Object.keys(tableData[0]).find(k => typeof tableData[0][k] === 'number') : null)

  if (!catCol || !valCol) {
    return <div className="text-muted-foreground text-xs p-4">No data available</div>
  }

  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {}
    for (const row of tableData!) {
      const cat = String(row[catCol!] ?? 'N/A')
      grouped[cat] = (grouped[cat] ?? 0) + Number(row[valCol!] ?? 0)
    }
    return Object.entries(grouped).slice(0, 10).map(([name, value]) => ({ name, value }))
  }, [tableData, catCol, valCol])

  return (
    <div className="w-full h-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <FunnelChart>
          <Tooltip />
          <Funnel data={chartData} dataKey="value" nameKey="name">
            <LabelList dataKey="name" position="right" fill="#666" stroke="none" fontSize={10} />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </div>
  )
}
