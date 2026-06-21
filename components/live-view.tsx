"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { CalendarOff, Radio } from "lucide-react"
import type { Tip } from "@/lib/types"
import { findLive, mapLiveStatus, useLiveMatches } from "@/hooks/use-live-matches"
import { getLiveStatus, LIVE_STATUS_CONFIG, worstStatus, type LiveStatus } from "@/lib/utils/live-status"
import { MatchLiveCard, type MatchLiveGroup } from "./match-live-card"
import { EmptyState } from "./ui/empty-state"

// Filtry statusu (client-side, po statusie grupy = worstStatus typów meczu).
type StatusFilter = "all" | "live" | "hit" | "atrisk" | "finished"
const STATUS_FILTERS: { key: StatusFilter; label: string; match: (s: LiveStatus) => boolean }[] = [
  { key: "all", label: "Wszystkie", match: () => true },
  { key: "live", label: "Na żywo", match: (s) => s === "LIVE_OPEN" },
  { key: "hit", label: "Trafione live", match: (s) => s === "LIVE_HIT" },
  { key: "atrisk", label: "Zagrożone", match: (s) => s === "LIVE_AT_RISK" },
  { key: "finished", label: "Zakończone", match: (s) => s === "WON" || s === "LOST" || s === "VOID" },
]

function fmtClock(ms: number | null): string {
  if (ms == null) return "—"
  return new Date(ms).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
}

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
  const reduce = useReducedMotion()
  // wjazd kart od dołu (fadeInUp), stagger; respektuje prefers-reduced-motion
  const reveal = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-40px" },
          transition: { duration: 0.3, delay: Math.min(i, 8) * 0.05 },
          whileHover: { scale: 1.01 },
        }
  const { liveMatches, fetchedAt } = useLiveMatches()
  const [filter, setFilter] = useState<StatusFilter>("all")
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(id)
  }, [])
  const nowMs = now ?? Date.now()

  // Okno czasowe liczy Oracle (/tips/active, -6h/+24h) — front już nie filtruje po czasie.
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

  // filtr statusu działa na CAŁĄ listę (nie tylko sekcję „Aktywne")
  const matchFilter = STATUS_FILTERS.find((f) => f.key === filter)?.match ?? (() => true)
  const filtered = filter === "all" ? groups : groups.filter((g) => matchFilter(g.status))

  const active = filtered.filter((g) => LIVE_STATUS_CONFIG[g.status].group === "active")
  const upcoming = filtered
    .filter((g) => LIVE_STATUS_CONFIG[g.status].group === "upcoming")
    .sort((a, b) => (a.kickoff_utc ?? "").localeCompare(b.kickoff_utc ?? ""))
  const finished = filtered.filter((g) => LIVE_STATUS_CONFIG[g.status].group === "finished")
  // sekcja „Na żywo" pokazuje placeholder tylko gdy użytkownik oczekuje live
  const showActive = active.length > 0 || filter === "all" || filter === "live"

  if (tips.length === 0) {
    return (
      <EmptyState
        icon={CalendarOff}
        title="Brak typów w oknie czasowym"
        description="Brak meczów w ostatnich 6 h i najbliższych 24 h. Sprawdź zakładkę Typy."
        cta={{ label: "Przejdź do typów", href: "/typy" }}
      />
    )
  }

  const nothingForFilter = filter !== "all" && active.length === 0 && upcoming.length === 0 && finished.length === 0

  return (
    <div className="space-y-6">
      {/* PASEK: ostatnia aktualizacja + filtry statusu */}
      <div className="space-y-3">
        <p className="text-xs text-[color:var(--text-muted)] tnum">
          Aktualizacja: {fmtClock(fetchedAt)} · odświeżanie co 60s
        </p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {STATUS_FILTERS.map((f) => {
            const on = filter === f.key
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                  on
                    ? "border-[color:var(--cyan)] bg-[var(--cyan-soft)] text-[color:var(--text-primary)]"
                    : "border-[color:var(--border-soft)] bg-[var(--surface-1)] text-[color:var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[color:var(--text-primary)]"
                }`}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      {nothingForFilter && (
        <p className="flex items-center gap-2 rounded-[var(--radius-card)] border border-[color:var(--border-soft)] bg-[var(--surface-1)] p-4 text-sm text-[color:var(--text-muted)]">
          <Radio className="h-4 w-4" /> Brak meczów dla wybranego filtra.
        </p>
      )}

      {/* NA ŻYWO */}
      {showActive && (
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
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {active.map((g, i) => (
                <motion.div key={g.key} {...reveal(i)}>
                  <MatchLiveCard group={g} />
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* DZIŚ */}
      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">Dziś</h2>
          {/* Mobile: lista pionowa. Desktop: grid 2 kolumny (bez karuzeli dla długich list). */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {upcoming.map((g) => (
              <MatchLiveCard key={g.key} group={g} />
            ))}
          </div>
        </section>
      )}

      {/* ZAKOŃCZONE */}
      {finished.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">Zakończone</h2>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {finished.map((g) => <MatchLiveCard key={g.key} group={g} />)}
          </div>
        </section>
      )}
    </div>
  )
}
