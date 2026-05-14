import { Treemap, ResponsiveContainer } from "recharts"
import { useMemo } from "react"
import type { Visual } from "./types"

const PBI_PALETTE = ["#118DFF", "#12239E", "#E66C37", "#6B007B", "#E044A7", "#744EC2", "#D9B300", "#D64550"]

interface TreemapVisualProps {
  visual: Visual
  data: Record<string, any[]>
}

export function TreemapVisual({ visual, data }: TreemapVisualProps) {
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

  const treeData = useMemo(() => {
    const grouped: Record<string, number> = {}
    for (const row of tableData!) {
      const cat = String(row[catCol!] ?? 'N/A')
      grouped[cat] = (grouped[cat] ?? 0) + Number(row[valCol!] ?? 0)
    }
    return Object.entries(grouped).slice(0, 30).map(([name, size], i) => ({ name, size, fill: PBI_PALETTE[i % PBI_PALETTE.length] }))
  }, [tableData, catCol, valCol])

  return (
    <div className="w-full h-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={treeData}
          dataKey="size"
          aspectRatio={4 / 3}
          stroke="#fff"
          fill="#118DFF"
        />
      </ResponsiveContainer>
    </div>
  )
}

