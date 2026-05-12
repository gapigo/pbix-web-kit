import type { Visual } from "./types"

interface MapPlaceholderProps {
  visual: Visual
}

export function MapPlaceholder({ visual }: MapPlaceholderProps) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-blue-50/30 border border-dashed border-blue-200 rounded">
      <div className="text-center p-4">
        <div className="text-xs text-blue-400 font-medium mb-1">Map unavailable</div>
        <div className="text-[10px] text-blue-300">
          {visual.raw_type} not rendered in web
        </div>
        <div className="text-[9px] text-muted-foreground/50 mt-2">
          Power BI map visuals require external tile service
        </div>
      </div>
    </div>
  )
}
