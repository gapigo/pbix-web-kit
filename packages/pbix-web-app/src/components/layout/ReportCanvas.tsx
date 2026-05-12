import { useMemo, useRef, useEffect, useState } from "react"
import type { Page } from "@/components/visuals/types"
import { VisualRenderer } from "@/components/visuals/VisualRegistry"
import { useFilters } from "./FilterContext"

interface ReportCanvasProps {
  page: Page
  allData: Record<string, any[]>
}

const CANVAS_WIDTH = 1280
const CANVAS_HEIGHT = 720

export function ReportCanvas({ page, allData }: ReportCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const { filters, setFilter } = useFilters()

  // Scale the canvas to fit the container
  useEffect(() => {
    const checkSize = () => {
      if (!containerRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      const sx = w / CANVAS_WIDTH
      const sy = h / CANVAS_HEIGHT
      setScale(Math.min(sx, sy, 1))
    }
    checkSize()
    window.addEventListener("resize", checkSize)
    return () => window.removeEventListener("resize", checkSize)
  }, [])

  // Filter slicer visuals and text/shapes out for regular rendering
  const slicers = useMemo(() => 
    page.visuals.filter(v => v.type === "slicer").sort((a, b) => a.position.z - b.position.z),
    [page.visuals]
  )

  const contentVisuals = useMemo(() =>
    page.visuals.filter(v => v.type !== "slicer").sort((a, b) => a.position.z - b.position.z),
    [page.visuals]
  )

  return (
    <div className="flex gap-4 h-full">
      {/* Slicer sidebar */}
      {slicers.length > 0 && (
        <div className="w-48 shrink-0 border-r p-2 overflow-y-auto space-y-2">
          <div className="text-xs font-medium text-muted-foreground mb-2">Filters</div>
          {slicers.map(v => (
            <div key={v.id} className="border rounded p-1">
              <div className="text-[10px] font-mono text-muted-foreground mb-1 truncate">
                {v.fields[0]?.column || v.raw_type}
              </div>
              <VisualRenderer
                visual={v}
                data={allData}
                onFilter={setFilter}
                activeFilters={filters}
              />
            </div>
          ))}
        </div>
      )}

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative bg-white rounded border shadow-sm"
        style={{ minHeight: 400 }}
      >
        <div
          className="relative origin-top-left"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `scale(${scale})`,
          }}
        >
          {contentVisuals.map(v => (
            <div
              key={v.id}
              className="absolute overflow-hidden"
              style={{
                left: v.position.x,
                top: v.position.y,
                width: v.position.width,
                height: v.position.height,
                zIndex: v.position.z,
              }}
            >
              <VisualRenderer
                visual={v}
                data={allData}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
