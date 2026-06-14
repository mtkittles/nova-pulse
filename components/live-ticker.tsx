"use client"

import Link from "next/link"
import { mapLiveStatus, useLiveMatches } from "@/hooks/use-live-matches"

// Pasek meczów na żywo — poziomy, przewijalny. Renderuje tylko mecze w trakcie
// (live / przerwa). Pusty zbiór = nic nie renderujemy.
export function LiveTicker() {
  const { liveMatches } = useLiveMatches()

  const live = liveMatches.filter((m) => {
    const s = mapLiveStatus(m.status_short)
    return s === "live" || s === "halftime"
  })

  if (live.length === 0) return null

  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1" aria-label="Mecze na żywo">
      {live.map((m) => {
        const halftime = mapLiveStatus(m.status_short) === "halftime"
        const minuteTxt = halftime ? "HT" : m.minute != null ? `${m.minute}'` : "LIVE"
        return (
          <Link
            key={m.event_id}
            href={`/mecz/${m.event_id}`}
            className="group flex shrink-0 items-center gap-2.5 rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-1)] px-4 py-2 text-sm transition hover:border-[color:var(--border-strong)] hover:bg-[var(--surface-2)]"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--danger)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--danger)]" />
            </span>
            <span className="font-semibold tnum text-[color:var(--danger)]">{minuteTxt}</span>
            <span className="text-[color:var(--text-primary)]">
              <span className="text-[color:var(--text-secondary)]">{m.home_team}</span>{" "}
              <span className="font-bold tnum">
                {m.home_score}:{m.away_score}
              </span>{" "}
              <span className="text-[color:var(--text-secondary)]">{m.away_team}</span>
            </span>
          </Link>
        )
      })}
    </div>
  )
}
