const SUFFIXES = ["", "K", "M", "B", "T"] as const

/** Format a number with locale separators. */
export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—"
  return new Intl.NumberFormat("en-US").format(n)
}

/** Format as USD currency. */
export function formatCurrency(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

/** Format as percentage. */
export function formatPercent(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—"
  // Handle both decimal (0.496) and pre-multiplied (49.6) values
  const value = n > 1 ? n / 100 : n
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

/** Compact number format: 1.2K, 3.4M, 5.6B. */
export function formatCompact(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—"

  let tier = 0
  let value = Math.abs(n)
  while (value >= 1000 && tier < SUFFIXES.length - 1) {
    value /= 1000
    tier++
  }

  const sign = n < 0 ? "-" : ""
  const formatted = value >= 100
    ? value.toFixed(0)
    : value.toFixed(1)

  return `${sign}${formatted}${SUFFIXES[tier]}`
}
