import {
  KpiCard,
  BarChartVisual,
  LineChartVisual,
  DataTableVisual,
  DashboardShell,
} from "@pbix/runtime"
import type { QueryEngine } from "@pbix/runtime"
import type { UseBoundStore, StoreApi } from "zustand"
import type { DashboardStore } from "@pbix/runtime"

// ═══════════════════════════════════════════════════════════
// Generator Mode — reference template page
//
// ── Sections ──────────────────────────────────────────────
// 1. KPI row   — 4 aggregated metrics from v_opportunities
// 2. Chart row — bar chart (product) + line chart (trend)
// 3. Table row — territory + revenue detail breakdown
//
// ── Data ──────────────────────────────────────────────────
// • View: v_opportunities — Opportunities × Products ×
//   Accounts × Territories × Owners × Industries
// • Columns: Value, Status, Sales Stage, Product, Product LOB,
//   Territory, Region, Owner, Manager, Industry, CloseDate,
//   Discount, Weeks Open, DaysToClose, Account Name, State/Prov
//
// ── Patterns shown ───────────────────────────────────────
// • Visual components: KpiCard, BarChartVisual,
//   LineChartVisual, DataTableVisual
// • Filter definitions for Won / Open
// • 12-column CSS grid layout
// ═══════════════════════════════════════════════════════════

interface Props {
  engine: QueryEngine | null
  store: UseBoundStore<StoreApi<DashboardStore>>
}

// ── Shared filters ────────────────────────────────────────
const wonFilter = [{ column: "Status", op: "eq" as const, values: ["Won"] }]
const openFilter = [{ column: "Status", op: "eq" as const, values: ["Open"] }]

// ═══════════════════════════════════════════════════════════
// Page component
// ═══════════════════════════════════════════════════════════

export default function Template({ engine, store }: Props) {
  return (
    <DashboardShell>
      {/* ════════════════════════════════════════════════════
          SECTION 1: KPI Cards
          ════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <KpiCard
            measure={{ table: "v_opportunities", column: "Value", agg: "sum" }}
            label="Revenue Won"
            engine={engine}
            filters={wonFilter}
            format="currency"
          />
        </div>
        <div className="col-span-3">
          <KpiCard
            measure={{ table: "v_opportunities", column: "Value", agg: "sum" }}
            label="Pipeline Revenue"
            engine={engine}
            filters={openFilter}
            format="currency"
          />
        </div>
        <div className="col-span-3">
          <KpiCard
            measure={{ table: "v_opportunities", column: "Value", agg: "avg" }}
            label="Avg Deal Size"
            engine={engine}
            format="currency"
          />
        </div>
        <div className="col-span-3">
          <KpiCard
            measure={{ table: "v_opportunities", column: "OpportunitySeq", agg: "count" }}
            label="Total Opportunities"
            engine={engine}
            format="compact"
          />
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          SECTION 2: Charts — Bar + Line
          ════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-4">
        {/* ── Bar: Revenue by Product (top 10) ──────────── */}
        <div className="col-span-7">
          <BarChartVisual
            table="v_opportunities"
            category={{ column: "Product", maxItems: 10 }}
            values={[{ column: "Value", agg: "sum", label: "Revenue" }]}
            engine={engine}
          />
        </div>

        {/* ── Line: Revenue trend by CloseDate ──────────── */}
        <div className="col-span-5">
          <LineChartVisual
            table="v_opportunities"
            category={{ column: "CloseDate" }}
            values={[{ column: "Value", agg: "sum", label: "Revenue" }]}
            engine={engine}
          />
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          SECTION 3: Data table — Territory breakdown
          ════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12">
          <DataTableVisual
            table="v_opportunities"
            columns={[
              { column: "Territory", role: "row" },
              { column: "Product", role: "row" },
              { column: "Owner", role: "row" },
              { column: "Value", agg: "sum", role: "value", format: "currency", label: "Revenue" },
              { column: "Value", agg: "count", role: "value", format: "compact", label: "Deals" },
            ]}
            engine={engine}
          />
        </div>
      </div>
    </DashboardShell>
  )
}
