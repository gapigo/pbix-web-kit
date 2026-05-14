export const PBI_PALETTE = [
  "#118DFF", "#12239E", "#E66C37", "#6B007B",
  "#E044A7", "#744EC2", "#D9B300", "#D64550",
] as const

export const theme = {
  colors: PBI_PALETTE,
  semantic: {
    success: "#0F9D58",
    warning: "#F4B400",
    danger: "#DB4437",
    muted: "#605E5C",
  },
  fontFamily: {
    sans: "Segoe UI, system-ui, sans-serif",
    mono: "Consolas, monospace",
  },
  spacing: {
    card: "1rem",
    gap: "1rem",
    page: "1.5rem",
  },
  radius: {
    card: "0.5rem",
    chip: "9999px",
  },
} as const

export type Theme = typeof theme
