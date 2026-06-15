"use client"

import Link from "next/link"
import type { Tip } from "@/lib/types"
import { getMarketLabel } from "@/lib/market-label"
import { LIVE_STATUS_CONFIG, type LiveStatus } from "@/lib/utils/live-status"
import { TeamBadge } from "./team-badge"
import { QScoreRing } from "./ui/q-score-ring"

export interface MatchLiveGroup {
  key: string
  event_id: string | number
  home: string
  away: string
  homeLogo?: string | null
  awayLogo?: string | null
  league: string
  kickoff_utc: string | null
  homeScore: number | null
  awayScore: number | null
  right: string // minute / countdown / godzina / "koniec"
  status: LiveStatus // status meczu (najgorszy z typów)
  tips: { tip: Tip; status: LiveStatus }[]
}

// Karta meczu — wszystkie typy bota tego meczu w jednej karcie.
export function MatchLiveCard({ group }: { group: MatchLiveGroup }) {
  const cfg = LIVE_STATUS_CONFIG[group.status]
  const isActive = cfg.group === "active"
  const isFinished = cfg.group === "finished"
  const showScore = (isActive || isFinished) && group.homeScore != null && group.awayScore != null
  const scoreColor =
    group.status === "LIVE_HIT" ? "text-[color:var(--success)]" : group.status === "LIVE_AT_RISK" ? "text-[color:var(--danger)]" : "text-[color:var(--text-primary)]"

  const inner = (
    <div className={`rounded-[var(--radius-card)] border-2 bg-[var(--surface-1)] p-4 transition hover:bg-[var(--surface-2)] ${cfg.border}`}>
      {/* nagłówek: liga + status/czas */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="min-w-0 truncate uppercase tracking-[0.14em] text-[color:var(--text-muted)]">{group.league}</span>
        <span className={`inline-flex shrink-0 items-center gap-1 font-semibold ${cfg.color}`}>
          {cfg.dot && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--danger)]" />}
          {group.right}
        </span>
      </div>

      {/* drużyny + wynik */}
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex min-w-0 items-center justify-end gap-2 text-right">
          <span className="truncate text-sm font-semibold">{group.home}</span>
          <TeamBadge teamName={group.home} logoUrl={group.homeLogo} size="sm" />
        </div>
        <span className="px-1 text-center">
          {showScore ? (
            <span className={`text-2xl font-extrabold tnum ${scoreColor}`}>{group.homeScore} : {group.awayScore}</span>
          ) : (
            <span className="text-sm text-[color:var(--text-muted)]">vs</span>
          )}
        </span>
        <div className="flex min-w-0 items-center gap-2">
          <TeamBadge teamName={group.away} logoUrl={group.awayLogo} size="sm" />
          <span className="truncate text-sm font-semibold">{group.away}</span>
        </div>
      </div>

      {/* lista typów */}
      <div className="mt-4 border-t border-[color:var(--border-soft)] pt-3">
        <p className="mb-2 text-[11px] uppercase tracking-wide text-[color:var(--text-muted)]">Typy bota</p>
        <div className="space-y-2">
          {group.tips.map(({ tip, status }, i) => {
            const m = getMarketLabel(tip.bet_type_raw ?? tip.bet_type, tip.bet_side_raw ?? tip.bet_side, tip.home, tip.away)
            const tcfg = LIVE_STATUS_CONFIG[status]
            return (
              <div key={i} className="flex items-center gap-2.5">
                <QScoreRing value={tip.q_score} size={34} stroke={3} />
                <span className="min-w-0 flex-1">
                  <span className={`text-sm font-medium ${tcfg.color}`}>{m.short}</span>
                  <span className="ml-1 truncate text-xs text-[color:var(--text-muted)]">{m.full}</span>
                </span>
                <span className="shrink-0 text-sm font-bold text-[color:var(--cyan)] tnum">{tip.odds.toFixed(2)}</span>
                <span className={`w-14 shrink-0 text-right text-xs font-semibold tnum ${tip.edge >= 0 ? "text-[color:var(--success)]" : "text-[color:var(--danger)]"}`}>
                  {tip.edge >= 0 ? "+" : ""}{(tip.edge * 100).toFixed(1)}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  return group.event_id ? (
    <Link href={`/mecz/${group.event_id}`} className="block">
      {inner}
    </Link>
  ) : (
    inner
  )
}
