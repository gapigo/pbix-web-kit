export interface VisualPosition {
  x: number
  y: number
  width: number
  height: number
  z: number
}

export interface Field {
  table: string
  column: string
  aggregation: string | null
  role: string
}

export interface Visual {
  id: string
  type: string
  raw_type: string
  title: string | null
  position: VisualPosition
  fields: Field[]
  config: Record<string, any>
}

export interface Page {
  name: string
  display_name: string
  width: number
  height: number
  visuals: Visual[]
}

export interface PbixIR {
  source_file: string
  pages: Page[]
  tables: { name: string; columns: Record<string, string>; row_count: number }[]
  measures: { table: string; name: string; expression: string }[]
  relationships: Record<string, any>[]
}
