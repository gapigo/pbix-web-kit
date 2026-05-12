import type { Visual } from "./types"

interface UnsupportedVisualProps {
  visual: Visual
}

export function UnsupportedVisual({ visual }: UnsupportedVisualProps) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-muted/20 border border-dashed border-muted-foreground/30 rounded">
      <div className="text-center p-2">
        <div className="text-[10px] font-mono text-muted-foreground">
          {visual.raw_type}
        </div>
        <div className="text-[9px] text-muted-foreground/60 mt-1">
          Unsupported visual type
        </div>
      </div>
    </div>
  )
}
