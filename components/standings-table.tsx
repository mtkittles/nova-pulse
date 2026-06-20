"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Table2 } from "lucide-react"
import type { StandingRow } from "@/lib/extra-types"
import { TeamBadge } from "./team-badge"
import { Skeleton } from "./ui/skeleton"
import { EmptyState } from "./ui/empty-state"

const norm = (s: string) => (s || "").toLowerCase().replace(/\s+/g, " ").trim()

// Sekcja [G] — tabela ligowa. Fetch po stronie klienta (osobny request → skeleton).
// Podświetla wiersze drużyn z aktualnego meczu. Deduplikacja po nazwie (pierwszy rekord).
export function StandingsTable({
  leagueCode,
  homeName,
  awayName,
}: {
  leagueCode: string
  homeName: string
  awayName: string
}) {
  const [rows, setRows] = useState<StandingRow[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetch(`/api/league/${encodeURIComponent(leagueCode)}/standings`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return
        const list: StandingRow[] = Array.isArray(d?.standings) ? d.standings : []
        // dedup po nazwie drużyny (zostaw pierwszy rekord)
        const seen = new Set<string>()
        const deduped = list.filter((r) => {
          const k = norm(r.team)
          if (seen.has(k)) return false
          seen.add(k)
          return true
        })
        setRows(deduped)
      })
      .catch(() => active && setRows([]))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [leagueCode])

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    )
  }

  if (!rows || rows.length === 0) {
    return <EmptyState icon={Table2} title="Brak tabeli ligowej" description="Tabela niedostępna dla tej rozgrywki." />
  }

  const h = norm(homeName)
  const a = norm(awayName)
  const isMatch = (team: string) => {
    const t = norm(team)
    return t === h || t === a || t.includes(h) || h.includes(t) || t === a || t.includes(a) || a.includes(t)
  }
  const th = "px-2 py-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]"

  return (
    <div className="max-h-[28rem] overflow-y-auto overflow-x-auto rounded-[var(--radius-card)] border border-[color:var(--border-soft)] bg-[var(--surface-1)]">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 border-b border-[color:var(--border-soft)] bg-[var(--surface-1)]">
          <tr>
            <th className={`${th} text-left`}>#</th>
            <th className={`${th} text-left`}>Drużyna</th>
            <th className={`${th} text-center`}>M</th>
            <th className={`${th} text-center`}>Pkt</th>
            <th className={`${th} text-center`}>GF</th>
            <th className={`${th} text-center`}>GA</th>
            <th className={`${th} text-center`}>GD</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 20).map((r) => {
            const gd = r.gf - r.ga
            const hot = isMatch(r.team)
            const nameCell = (
              <span className="flex min-w-0 items-center gap-2">
                <TeamBadge teamName={r.team} logoUrl={r.logo} size="sm" />
                <span className="truncate font-medium">{r.team}</span>
              </span>
            )
            return (
              <tr
                key={`${r.position}-${r.team}`}
                className={`border-b border-l-2 border-[color:var(--border-soft)] last:border-b-0 ${
                  hot ? "border-l-[color:var(--cyan)] bg-[var(--cyan-soft)]" : "border-l-transparent"
                }`}
              >
                <td className="px-2 py-2 text-[color:var(--text-muted)] tnum">{r.position}</td>
                <td className="px-2 py-2">
                  {r.team_id != null ? (
                    <Link href={`/druzyna/${r.team_id}`} className="transition hover:text-[color:var(--cyan)]">
                      {nameCell}
                    </Link>
                  ) : (
                    nameCell
                  )}
                </td>
                <td className="px-2 py-2 text-center tnum text-[color:var(--text-secondary)]">{r.played}</td>
                <td className="px-2 py-2 text-center font-semibold tnum text-[color:var(--cyan)]">{r.points}</td>
                <td className="px-2 py-2 text-center tnum text-[color:var(--text-secondary)]">{r.gf}</td>
                <td className="px-2 py-2 text-center tnum text-[color:var(--text-secondary)]">{r.ga}</td>
                <td className={`px-2 py-2 text-center font-medium tnum ${gd > 0 ? "text-[color:var(--success)]" : gd < 0 ? "text-[color:var(--danger)]" : "text-[color:var(--text-muted)]"}`}>
                  {gd > 0 ? "+" : ""}{gd}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
