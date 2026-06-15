"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CalendarOff, Radio } from "lucide-react"
import type { Tip } from "@/lib/types"
import { getMarketLabel } from "@/lib/market-label"
import { findLive, mapLiveStatus, useLiveMatches } from "@/hooks/use-live-matches"
import { getLiveStatus, LIVE_STATUS_CONFIG, type LiveStatus } from "@/lib/utils/live-status"
import { LiveTipCard } from "./live-tip-card"
import { TeamBadge } from "./team-badge"
import { StatusPill, type PillStatus } from "./ui/status-pill"
import { EmptyState } from "./ui/empty-state"

interface Row {
  tip: Tip
  status: LiveStatus
  homeScore: number | null
  awayScore: number | null
  minute: string
}

// "Za 2h 15min" gdy < 3h, inaczej godzina lokalna "21:00".
function countdown(iso: string | null, nowMs: number): string {
  if (!iso) return "wkrótce"
  const k = new Date(iso).getTime()
  if (!Number.isFinite(k)) return "wkrótce"
  const diff = k - nowMs
  if (diff <= 0) return "lada chwila"
  const mins = Math.floor(diff / 60000)
  if (mins >= 180) {
    const d = new Date(iso)
    return d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
  }
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

  const rows = useMemo<Row[]>(() => {
    return tips.map((tip) => {
      const live = findLive(liveMatches, tip.event_id)
      const liveSt = live ? mapLiveStatus(live.status_short) : null
      const homeScore = live ? live.home_score : tip.home_score ?? null
      const awayScore = live ? live.away_score : tip.away_score ?? null
      // efektywny match_status: dane live nadpisują pole z /tips/today
      const statusStr =
        liveSt === "finished" ? "FINISHED"
        : liveSt === "live" || liveSt === "halftime" ? "IN_PLAY"
        : tip.match_status ?? ""
      const status = getLiveStatus({
        match_status: statusStr,
        home_score: homeScore,
        away_score: awayScore,
        bet_type: tip.bet_type_raw ?? tip.bet_type,
        bet_side: tip.bet_side_raw ?? tip.bet_side,
        actual_result: tip.actual_result,
      })
      const minute = liveSt === "halftime" ? "PRZERWA" : live?.minute != null ? `${live.minute}'` : "LIVE"
      return { tip, status, homeScore, awayScore, minute }
    })
  }, [tips, liveMatches])

  const active = rows.filter((r) => LIVE_STATUS_CONFIG[r.status].group === "active")
  const upcoming = rows
    .filter((r) => LIVE_STATUS_CONFIG[r.status].group === "upcoming")
    .sort((a, b) => (a.tip.kickoff_utc ?? "").localeCompare(b.tip.kickoff_utc ?? ""))
  const finished = rows.filter((r) => LIVE_STATUS_CONFIG[r.status].group === "finished")

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
      {/* AKTYWNE */}
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
          active.map((r) => (
            <LiveTipCard key={String(r.tip.event_id)} tip={r.tip} status={r.status} homeScore={r.homeScore} awayScore={r.awayScore} minute={r.minute} />
          ))
        )}
      </section>

      {/* NADCHODZĄCE DZIŚ */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">Dziś</h2>
          <div className="space-y-2">
            {upcoming.map((r) => (
              <Link
                key={String(r.tip.event_id)}
                href={r.tip.event_id ? `/mecz/${r.tip.event_id}` : "/typy"}
                className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[color:var(--border-soft)] bg-[var(--surface-1)] p-3 transition hover:bg-[var(--surface-2)]"
              >
                <div className="flex shrink-0 items-center gap-1">
                  <TeamBadge teamName={r.tip.home} logoUrl={r.tip.homeLogo} size="sm" />
                  <TeamBadge teamName={r.tip.away} logoUrl={r.tip.awayLogo} size="sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.tip.home} – {r.tip.away}</p>
                  <p className="text-xs text-[color:var(--text-muted)] tnum">{countdown(r.tip.kickoff_utc, nowMs)}</p>
                </div>
                <MarketBadge tip={r.tip} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ZAKOŃCZONE DZIŚ */}
      {finished.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">Zakończone</h2>
          <div className="divide-y divide-[color:var(--border-soft)] overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--border-soft)] bg-[var(--surface-1)]">
            {finished.map((r) => (
              <Link
                key={String(r.tip.event_id)}
                href={r.tip.event_id ? `/mecz/${r.tip.event_id}` : "/typy"}
                className="flex items-center gap-3 p-3 text-sm transition hover:bg-[var(--surface-2)]"
              >
                <span className="w-12 shrink-0 text-center font-bold tnum text-[color:var(--text-secondary)]">
                  {r.homeScore ?? "-"}:{r.awayScore ?? "-"}
                </span>
                <span className="min-w-0 flex-1 truncate">{r.tip.home} – {r.tip.away}</span>
                <MarketBadge tip={r.tip} />
                <StatusPill status={r.status as PillStatus} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function MarketBadge({ tip }: { tip: Tip }) {
  const m = getMarketLabel(tip.bet_type_raw ?? tip.bet_type, tip.bet_side_raw ?? tip.bet_side, tip.home, tip.away)
  return <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${m.badge}`}>{m.short}</span>
}
