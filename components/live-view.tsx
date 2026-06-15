"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarOff, Radio } from "lucide-react"
import type { Tip } from "@/lib/types"
import { findLive, mapLiveStatus, useLiveMatches } from "@/hooks/use-live-matches"
import { getLiveStatus, LIVE_STATUS_CONFIG, worstStatus } from "@/lib/utils/live-status"
import { MatchLiveCard, type MatchLiveGroup } from "./match-live-card"
import { EmptyState } from "./ui/empty-state"

// "Za 2h 15min" gdy < 3h, inaczej godzina lokalna "21:00".
function countdown(iso: string | null, nowMs: number): string {
  if (!iso) return "wkrótce"
  const k = new Date(iso).getTime()
  if (!Number.isFinite(k)) return "wkrótce"
  const diff = k - nowMs
  if (diff <= 0) return "lada chwila"
  const mins = Math.floor(diff / 60000)
  if (mins >= 180) return new Date(iso).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `Za ${h}h ${m}min` : `Za ${m}min`
}

export function LiveView({ tips }: { tips: Tip[] }) {
  const { liveMatches } = useLiveMatches()
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(id)
  }, [])
  const nowMs = now ?? Date.now()

  // grupuj typy per mecz (event_id; sieroty po home|away|kickoff)
  const groups = useMemo<MatchLiveGroup[]>(() => {
    const order: string[] = []
    const map = new Map<string, MatchLiveGroup>()
    for (const tip of tips) {
      const key = tip.event_id != null && tip.event_id !== "" ? `id:${tip.event_id}` : `m:${tip.home}|${tip.away}|${tip.kickoff_utc ?? ""}`
      const live = findLive(liveMatches, tip.event_id)
      const liveSt = live ? mapLiveStatus(live.status_short) : null
      const homeScore = live ? live.home_score : tip.home_score ?? null
      const awayScore = live ? live.away_score : tip.away_score ?? null
      const statusStr =
        liveSt === "finished" ? "FINISHED" : liveSt === "live" || liveSt === "halftime" ? "IN_PLAY" : tip.match_status ?? ""
      const status = getLiveStatus({
        match_status: statusStr,
        home_score: homeScore,
        away_score: awayScore,
        bet_type: tip.bet_type_raw ?? tip.bet_type,
        bet_side: tip.bet_side_raw ?? tip.bet_side,
        actual_result: tip.actual_result,
      })
      const grp = LIVE_STATUS_CONFIG[status].group
      const minute = liveSt === "halftime" ? "PRZERWA" : live?.minute != null ? `${live.minute}'` : "LIVE"
      const right = grp === "active" ? minute : grp === "finished" ? "koniec" : countdown(tip.kickoff_utc, nowMs)

      let g = map.get(key)
      if (!g) {
        g = {
          key,
          event_id: tip.event_id,
          home: tip.home,
          away: tip.away,
          homeLogo: tip.homeLogo,
          awayLogo: tip.awayLogo,
          league: tip.league,
          kickoff_utc: tip.kickoff_utc,
          homeScore,
          awayScore,
          right,
          status,
          tips: [],
        }
        map.set(key, g)
        order.push(key)
      }
      g.homeScore = homeScore
      g.awayScore = awayScore
      g.right = right
      g.tips.push({ tip, status })
    }
    // status meczu = najgorszy z typów (border + sekcja)
    for (const g of map.values()) g.status = worstStatus(g.tips.map((t) => t.status))
    return order.map((k) => map.get(k)!)
  }, [tips, liveMatches, nowMs])

  const active = groups.filter((g) => LIVE_STATUS_CONFIG[g.status].group === "active")
  const upcoming = groups
    .filter((g) => LIVE_STATUS_CONFIG[g.status].group === "upcoming")
    .sort((a, b) => (a.kickoff_utc ?? "").localeCompare(b.kickoff_utc ?? ""))
  const finished = groups.filter((g) => LIVE_STATUS_CONFIG[g.status].group === "finished")

  if (tips.length === 0) {
    return (
      <EmptyState
        icon={CalendarOff}
        title="Brak typów na dziś"
        description="Sprawdź jutro lub wejdź w zakładkę Typy."
        cta={{ label: "Przejdź do typów", href: "/typy" }}
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* NA ŻYWO */}
      <section className="space-y-3">
        <header className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--danger)] opacity-70" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--danger)]" />
          </span>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">Na żywo</h2>
          <span className="rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-2)] px-2 py-0.5 text-xs font-semibold tnum text-[color:var(--text-secondary)]">
            {active.length}
          </span>
        </header>
        {active.length === 0 ? (
          <p className="flex items-center gap-2 rounded-[var(--radius-card)] border border-[color:var(--border-soft)] bg-[var(--surface-1)] p-4 text-sm text-[color:var(--text-muted)]">
            <Radio className="h-4 w-4" /> Brak meczów na żywo w tej chwili.
          </p>
        ) : (
          active.map((g) => <MatchLiveCard key={g.key} group={g} />)
        )}
      </section>

      {/* DZIŚ */}
      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">Dziś</h2>
          {upcoming.map((g) => <MatchLiveCard key={g.key} group={g} />)}
        </section>
      )}

      {/* ZAKOŃCZONE */}
      {finished.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">Zakończone</h2>
          {finished.map((g) => <MatchLiveCard key={g.key} group={g} />)}
        </section>
      )}
    </div>
  )
}
