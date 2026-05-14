import { format } from "date-fns"

export type ColType = "currency" | "percent" | "date" | "number" | "text"

// Detecta o tipo da coluna pelo nome e pelo valor
export function detectColType(colName: string, sampleValue: any): ColType {
  const name = colName.toLowerCase()
  if (name.includes("date") || name.includes("month") || name.includes("year")) return "date"
  if (name.includes("%") || name.includes("rate") || name.includes("pct") || name.includes("percent")) return "percent"
  if (
    name.includes("revenue") ||
    name.includes("value") ||
    name.includes("amount") ||
    name.includes("price") ||
    name.includes("deal")
  )
    return "currency"
  if (typeof sampleValue === "number") return "number"
  return "text"
}

export function autoFormat(value: any, colName: string, sampleValue?: any): string {
  if (value == null) return "\u2014"
  const type = detectColType(colName, sampleValue ?? value)
  switch (type) {
    case "currency": {
      const n = Number(value)
      if (isNaN(n)) return String(value)
      if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
      if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
      if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
      return `$${n.toLocaleString()}`
    }
    case "percent": {
      const n = Number(value)
      if (isNaN(n)) return String(value)
      // If value is 0-1 decimal, multiply by 100
      if (n >= 0 && n <= 1) return `${(n * 100).toFixed(1)}%`
      return `${n.toFixed(1)}%`
    }
    case "date": {
      try {
        return format(new Date(value), "MMM yy")
      } catch {
        return String(value)
      }
    }
    case "number": {
      const n = Number(value)
      if (isNaN(n)) return String(value)
      if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
      if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
      if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K`
      return n.toLocaleString()
    }
    default:
      return String(value)
  }
}

// Formatter para eixo X de line/bar charts com datas
export const dateAxisFormatter = (v: any) => {
  try {
    return format(new Date(v), "MMM yy")
  } catch {
    return String(v)
  }
}

// Formatter para tooltip de currency
export const currencyTooltipFormatter = (value: any, name: string) => [autoFormat(value, name), name]
