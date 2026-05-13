import React from "react"
import { MapPin } from "lucide-react"

interface MapPlaceholderProps {
  type?: string
  name?: string
  className?: string
}

export function MapPlaceholder({ type = "map", name, className = "" }: MapPlaceholderProps) {
  return (
    <div className={`h-48 flex flex-col items-center justify-center bg-gray-50 border border-dashed border-gray-300 rounded-lg ${className}`}>
      <MapPin className="w-8 h-8 text-gray-300 mb-2" />
      <div className="text-sm text-gray-400 font-medium">
        {name || "Map"}
      </div>
      <div className="text-xs text-gray-300 mt-1">
        {type === "custom" ? "Custom visual" : "Geographic map"}
      </div>
      <div className="text-xs text-gray-300 mt-0.5">unavailable in this environment</div>
    </div>
  )
}
