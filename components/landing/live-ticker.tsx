"use client"

import { useMemo } from "react"
import type { Tip } from "@/lib/types"
import { useLiveMatches, mapLiveStatus } from "@/hooks/use-live-matches"
import { mapMatchStatus } from "@/lib/tip-utils"

interface TickerItem {
  key: string
  league: string
  home: string
  away: string
  right: string
  live: boolean
}

function fmtTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" }).format(d)
}

function TickerRow({ item }: { item: TickerItem }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-5 text-sm">
      {/* wskaźnik "na żywo" — cyan, nie czerwony: poza sekcją "Ostatnio rozliczone"
          czerwień/zieleń jest z palety wyłączona, cyan zostaje jedynym akcentem */}
      {item.live && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--cyan)] opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--cyan)]" />
        </span>
      )}
      <span className="text-[color:var(--text-muted)]">{item.league}</span>
      <span className="text-[color:var(--cyan)]">·</span>
      <span className="font-medium text-[color:var(--text-primary)]">
        {item.home} vs {item.away}
      </span>
      <span className="text-[color:var(--cyan)]">·</span>
      <span className={`tnum font-semibold ${item.live ? "text-[color:var(--cyan)]" : "text-[color:var(--text-secondary)]"}`}>
        {item.right}
      </span>
    </span>
  )
}

/**
 * Pasek pod hero — ciągły marquee (CSS, nie JS) z meczami live i najbliższymi.
 *
 * Live ma DWA źródła:
 *  1. hook /api/live — autorytatywny, ma minutę/wynik na żywo.
 *  2. `tip.match_status` (z propsa `tips`, ten sam adapter co reszta strony) —
 *     fallback dla meczów, których (1) nie pokrywa. Bez tego drugiego źródła
 *     tryb demo (gdzie /api/live NIE jest podpięty pod generator) pokazywałby
 *     ticker zawsze pusty, mimo że `tips` już niosą `IN_PLAY`/`LIVE` w danych.
 *     Ta sama funkcja `mapMatchStatus`, której używa `MatchTipCard`.
 */
export function LiveTicker({ tips }: { tips: Tip[] }) {
  const { liveMatches } = useLiveMatches()

  const items = useMemo<TickerItem[]>(() => {
    const live: TickerItem[] = liveMatches
      .filter((m) => ["live", "halftime"].includes(mapLiveStatus(m.status_short)))
      .map((m) => ({
        key: `live-${m.event_id}`,
        league: m.league,
        home: m.home_team,
        away: m.away_team,
        right: mapLiveStatus(m.status_short) === "halftime" ? "PRZERWA" : m.minute != null ? `${m.minute}'` : "LIVE",
        live: true,
      }))

    const liveIds = new Set(liveMatches.map((m) => m.event_id))

    // fallback — mecze live wg tips, których hook (1) nie zwrócił (np. demo)
    const seenLiveFallback = new Set<string>()
    for (const t of tips) {
      const id = String(t.event_id ?? "")
      if (!id || liveIds.has(id) || seenLiveFallback.has(id)) continue
      if (mapMatchStatus(t.match_status) !== "live") continue
      seenLiveFallback.add(id)
      live.push({ key: `live-tip-${id}`, league: t.league, home: t.home, away: t.away, right: "LIVE", live: true })
    }

    const coveredIds = new Set([...liveIds, ...seenLiveFallback])
    const now = Date.now()
    const seen = new Set<string>()
    const upcoming: TickerItem[] = []
    for (const t of [...tips].sort((a, b) => (a.kickoff_utc ?? "").localeCompare(b.kickoff_utc ?? ""))) {
      const id = String(t.event_id ?? "")
      if (!id || seen.has(id) || coveredIds.has(id) || !t.kickoff_utc) continue
      const k = Date.parse(t.kickoff_utc)
      if (!Number.isFinite(k) || k <= now) continue
      seen.add(id)
      upcoming.push({
        key: `up-${id}`,
        league: t.league,
        home: t.home,
        away: t.away,
        right: fmtTime(t.kickoff_utc),
        live: false,
      })
      if (upcoming.length >= 10) break
    }

    return [...live, ...upcoming]
  }, [liveMatches, tips])

  if (items.length === 0) return null

  // dłuższa lista = wolniejsza pętla (stała prędkość czytania, nie stały czas)
  const duration = Math.max(18, items.length * 4)

  return (
    <div
      className="ticker-viewport border-y border-[color:var(--border-subtle)] bg-[var(--bg-1)]"
      aria-label="Mecze na żywo i najbliższe"
    >
      <div className="ticker-track h-12 items-center" style={{ animationDuration: `${duration}s` }}>
        {items.map((it) => (
          <TickerRow key={it.key} item={it} />
        ))}
        {/* kopia do bezszwowej pętli — niewidoczna dla czytników i reduced-motion */}
        <span aria-hidden className="ticker-dup contents">
          {items.map((it) => (
            <TickerRow key={`dup-${it.key}`} item={it} />
          ))}
        </span>
      </div>
    </div>
  )
}
