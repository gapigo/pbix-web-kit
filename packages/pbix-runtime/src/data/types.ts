/** Storyboard types for the runtime — mirrors pbix-storyboard schema. */

export interface TableSample {
  name: string
  row_count: number
  columns: Record<string, string>
  sample_rows: Record<string, any>[]
  distinct_values: Record<string, string[]>
}

export interface MeasureRef {
  name: string
  expression: string
  plain_english: string
}

export interface VisualSummary {
  id: string
  purpose: string
  canonical_type: string
  raw_type: string
  measures: MeasureRef[]
  dimensions: string[]
  importance: number
  chrome: boolean
}

export interface PageBrief {
  name: string
  display_name: string
  narrative: string
  hero_metric: string | null
  visuals: VisualSummary[]
  page_filters: Record<string, any>[]
  cross_filters: Record<string, any>[]
}

export interface Storyboard {
  source_file: string
  dashboard_name: string
  overall_narrative: string
  pages: PageBrief[]
  tables: TableSample[]
  measures_glossary: Record<string, string>
  generated_at: string
}
