import { format } from "date-fns"

// ═══════════════════════════════════════════
// Design Tokens — pbix-web-kit Generator
// ═══════════════════════════════════════════

export const colors = {
  brand:    "#0F52BA",
  navy:     "#0A2342",
  electric: "#1B6FEB",
  success:  "#1A7A4A",
  warning:  "#C17D00",
  danger:   "#B91C1C",
  neutral:  "#6B7280",
  bgPage:   "#F8FAFC",
  bgCard:   "#FFFFFF",
  bgHover:  "#F1F5F9",
  border:   "#E2E8F0",
  text:     "#1F2937",
  textSoft: "#6B7280",
  chart: [
    "#0F52BA", "#1A7A4A", "#C17D00", "#7C3AED",
    "#0891B2", "#BE185D", "#92400E", "#374151",
  ] as string[],
} as const

// ── Tailwind class bundles ────────────────

export const cardClass =
  "bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.10)] transition-shadow"

export const kpiValueClass =
  "text-[2rem] font-bold leading-none tracking-[-0.02em]"

export const kpiLabelClass =
  "text-[11px] font-medium uppercase tracking-[0.06em] text-[#6B7280]"

export const sectionLabelClass =
  "text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-3"

export const tableHeaderClass =
  "text-[12px] font-semibold uppercase tracking-[0.04em] text-[#374151] px-3 py-2.5 text-left border-b border-[#E2E8F0]"

export const tableCellClass =
  "px-3 py-2.5 text-[14px] text-[#1F2937] border-b border-[#F1F5F9]"

export const filterChipClass = (active: boolean) =>
  `px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
    active
      ? "bg-[#0F52BA1A] border-[#0F52BA] text-[#0F52BA]"
      : "bg-white border-[#E2E8F0] text-[#6B7280] hover:border-[#0F52BA] hover:text-[#0F52BA]"
  }`

// ── Format helpers ────────────────────────

export function fmtCurrency(n: number | null | undefined): string {
  if (n == null || isNaN(Number(n))) return "\u2014"
  const v = Number(n)
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(0)}K`
  return `$${v.toLocaleString()}`
}

export function fmtNum(n: number | null | undefined): string {
  if (n == null || isNaN(Number(n))) return "\u2014"
  const v = Number(n)
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}K`
  return v.toLocaleString()
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null || isNaN(Number(n))) return "\u2014"
  const v = Number(n)
  // If already 0-100 range, use as-is; if 0-1 decimal, multiply
  const pct = v >= 0 && v <= 1 ? v * 100 : v
  return `${Math.min(100, Math.max(0, pct)).toFixed(1)}%`
}

export function fmtDate(v: any): string {
  try {
    const d = new Date(v)
    if (isNaN(d.getTime())) return String(v ?? "")
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
  } catch {
    return String(v ?? "")
  }
}

// ── Chart helpers ─────────────────────────

export const CHART_HEIGHT = {
  large: 280,
  small: 200,
  donut: 220,
  scatter: 260,
  funnel: 180,
} as const

/** Grid config for chart axes */
export const axisStyle = { fontSize: 11, fill: "#9CA3AF" }
export const gridStyle = { stroke: "#F1F5F9", strokeDasharray: "3 3" }

// ── Tooltip component ─────────────────────

export function CustomTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[6px] px-3 py-2 shadow-md text-sm">
      <p className="text-[11px] uppercase tracking-[0.04em] text-[#6B7280] mb-1">
        {label}
      </p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-semibold text-[14px]" style={{ color: p.color }}>
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

// ── Axis tick formatters ──────────────────

export const currencyTick = (v: number) => {
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(0)}M`
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(0)}K`
  return `$${v}`
}

export const numTick = (v: number) => {
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(0)}M`
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(0)}K`
  return String(v)
}

export const pctTick = (v: number) => {
  const pct = v >= 0 && v <= 1 ? v * 100 : v
  return `${Math.round(pct)}%`
}
