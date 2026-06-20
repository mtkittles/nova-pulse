"use client"

import { useEffect, useState } from "react"
import { Zap } from "lucide-react"
import type { Scorer } from "@/lib/extra-types"
import { Skeleton } from "./ui/skeleton"

const norm = (s: string) => (s || "").toLowerCase().replace(/\s+/g, " ").trim()

// Sekcja [I] — top strzelcy ligi. Client-fetch (osobny request → skeleton).
// Podświetla zawodników z drużyn grających w tym meczu (jak w bocie Telegram).
// Gdy brak danych → null (sekcja ukryta, nie EmptyState).
export function TopScorers({
  leagueCode,
  leagueName,
  homeName,
  awayName,
}: {
  leagueCode: string
  leagueName: string
  homeName: string
  awayName: string
}) {
  const [rows, setRows] = useState<Scorer[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetch(`/api/league/${encodeURIComponent(leagueCode)}/scorers`)
      .then((r) => r.json())
      .then((d) => active && setRows(Array.isArray(d?.scorers) ? d.scorers : []))
      .catch(() => active && setRows([]))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [leagueCode])

  if (loading) {
    return (
      <section className="mt-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">Top strzelcy</h2>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </section>
    )
  }

  if (!rows || rows.length === 0) return null

  const h = norm(homeName)
  const a = norm(awayName)
  const inMatch = (team: string) => {
    const t = norm(team)
    return !!t && (t === h || t === a || t.includes(h) || h.includes(t) || t.includes(a) || a.includes(t))
  }

  const visible = expanded ? rows : rows.slice(0, 10)
  const th = "px-2 py-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]"

  return (
    <section className="mt-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
        Top strzelcy{leagueName ? ` — ${leagueName}` : ""}
      </h2>
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--border-soft)] bg-[var(--surface-1)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[color:var(--border-soft)]">
            <tr>
              <th className={`${th} text-left`}>#</th>
              <th className={`${th} text-left`}>Zawodnik</th>
              <th className={`${th} text-left`}>Klub</th>
              <th className={`${th} text-center`}>G</th>
              <th className={`${th} text-center`}>A</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((s, i) => {
              const hot = inMatch(s.team)
              return (
                <tr
                  key={`${s.player}-${i}`}
                  className={`border-b border-l-2 border-[color:var(--border-soft)] last:border-b-0 ${
                    hot ? "border-l-[color:var(--cyan)] bg-[var(--cyan-soft)]" : "border-l-transparent"
                  }`}
                >
                  <td className="px-2 py-2 text-[color:var(--text-muted)] tnum">{i + 1}</td>
                  <td className="px-2 py-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      {hot && <Zap className="h-3.5 w-3.5 shrink-0 text-[color:var(--cyan)]" />}
                      <span className="truncate font-medium">{s.player}</span>
                    </span>
                  </td>
                  <td className="px-2 py-2 max-w-[8rem] truncate text-[color:var(--text-secondary)]">{s.team}</td>
                  <td className="px-2 py-2 text-center font-semibold tnum text-[color:var(--cyan)]">{s.goals}</td>
                  <td className="px-2 py-2 text-center tnum text-[color:var(--text-secondary)]">{s.assists}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {rows.length > 10 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 w-full rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-1)] py-2 text-sm font-medium text-[color:var(--text-secondary)] transition hover:bg-[var(--surface-2)] hover:text-[color:var(--text-primary)]"
        >
          {expanded ? "Pokaż mniej" : `Pokaż więcej (${rows.length - 10})`}
        </button>
      )}
    </section>
  )
}
