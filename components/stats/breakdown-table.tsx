"use client"

import { useMemo, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { BreakdownData, BreakdownRow } from "@/lib/demo-tips"

type TabKey = "market" | "league" | "qscore"
const TABS: { key: TabKey; label: string }[] = [
  { key: "market", label: "Wg rynku" },
  { key: "league", label: "Wg ligi" },
  { key: "qscore", label: "Wg Q-Score" },
]

type SortKey = "label" | "tips" | "winRate" | "avgOdds" | "roi"
const COLUMNS: { key: SortKey; label: string; align: "left" | "center" | "right" }[] = [
  { key: "label", label: "Nazwa", align: "left" },
  { key: "tips", label: "Typy", align: "center" },
  { key: "winRate", label: "% trafień", align: "center" },
  { key: "avgOdds", label: "Śr. kurs", align: "center" },
  { key: "roi", label: "ROI", align: "right" },
]

const TOP_ROI_COUNT = 3

/**
 * Tabela rozbicia skuteczności — gęsty, płaski layout (opensea-style: małe
 * odstępy, dane w centrum, bez otoczek karty). Trzy przełączalne wymiary
 * grupowania, sortowanie po kliknięciu nagłówka.
 */
export function BreakdownTable({ data }: { data: BreakdownData }) {
  const [tab, setTab] = useState<TabKey>("market")
  const [sortKey, setSortKey] = useState<SortKey>("roi")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const rows = data[tab]

  const topRoiKeys = useMemo(() => {
    const sorted = [...rows].filter((r) => r.tips > 0).sort((a, b) => b.roi - a.roi)
    return new Set(sorted.slice(0, TOP_ROI_COUNT).map((r) => r.key))
  }, [rows])

  const sorted = useMemo(() => {
    const out = [...rows]
    out.sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number)
      return sortDir === "asc" ? cmp : -cmp
    })
    return out
  }, [rows, sortKey, sortDir])

  function onSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  if (rows.length === 0) {
    return (
      <div className="grid h-40 place-items-center rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-1)] text-sm text-[color:var(--text-muted)]">
        Brak danych rozbicia
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-1)]">
      <div className="flex gap-1 border-b border-[color:var(--border-subtle)] p-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
              tab === t.key
                ? "bg-[var(--cyan-soft)] text-[color:var(--cyan)]"
                : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[color:var(--border-subtle)] text-[11px] uppercase tracking-wide text-[color:var(--text-muted)]">
              {COLUMNS.map((c) => (
                <th key={c.key} className={`px-3 py-2 font-medium ${c.align === "left" ? "text-left" : c.align === "right" ? "text-right" : "text-center"}`}>
                  <button
                    type="button"
                    onClick={() => onSort(c.key)}
                    className={`inline-flex items-center gap-0.5 transition-colors duration-150 hover:text-[color:var(--text-primary)] ${
                      c.align === "right" ? "flex-row-reverse" : c.align === "center" ? "justify-center" : ""
                    }`}
                  >
                    {c.label}
                    {sortKey === c.key &&
                      (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <BreakdownRowLine key={r.key} row={r} highlight={topRoiKeys.has(r.key)} />
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-[color:var(--border-subtle)] px-3 py-2 text-[11px] text-[color:var(--text-muted)]">
        Podświetlone wiersze — najwyższe ROI w tym zestawieniu.
      </p>
    </div>
  )
}

function BreakdownRowLine({ row, highlight }: { row: BreakdownRow; highlight: boolean }) {
  return (
    <tr
      className={`border-b border-[color:var(--border-subtle)] text-[13px] last:border-0 ${
        highlight ? "border-l-2 border-l-[color:var(--cyan)] bg-[var(--cyan-soft)]/30" : ""
      }`}
    >
      <td className="px-3 py-1.5 font-medium text-[color:var(--text-primary)]">{row.label}</td>
      <td className="px-3 py-1.5 text-center tnum text-[color:var(--text-secondary)]">{row.tips}</td>
      <td className="px-3 py-1.5 text-center tnum font-semibold">{Math.round(row.winRate * 100)}%</td>
      <td className="px-3 py-1.5 text-center tnum text-[color:var(--text-secondary)]">{row.avgOdds.toFixed(2)}</td>
      <td className={`px-3 py-1.5 text-right tnum font-semibold ${row.roi >= 0 ? "text-[color:var(--cyan)]" : "text-[color:var(--text-muted)]"}`}>
        {row.roi >= 0 ? "+" : ""}
        {(row.roi * 100).toFixed(1)}%
      </td>
    </tr>
  )
}
