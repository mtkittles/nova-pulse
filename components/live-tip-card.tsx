"use client"

import Link from "next/link"
import type { Tip } from "@/lib/types"
import { getMarketLabel } from "@/lib/market-label"
import { formatKickoff } from "@/lib/time"
import { LIVE_STATUS_CONFIG, type LiveStatus } from "@/lib/utils/live-status"
import { TeamBadge } from "./team-badge"
import { QScoreRing } from "./ui/q-score-ring"

// Karta typu na żywo — border i kolory wg statusu (LIVE_STATUS_CONFIG).
export function LiveTipCard({
  tip,
  status,
  homeScore,
  awayScore,
  minute,
}: {
  tip: Tip
  status: LiveStatus
  homeScore: number | null
  awayScore: number | null
  minute?: string
}) {
  const cfg = LIVE_STATUS_CONFIG[status]
  const market = getMarketLabel(tip.bet_type_raw ?? tip.bet_type, tip.bet_side_raw ?? tip.bet_side, tip.home, tip.away)
  const hasScore = homeScore != null && awayScore != null
  const scoreColor =
    status === "LIVE_HIT" ? "text-[color:var(--success)]" : status === "LIVE_AT_RISK" ? "text-[color:var(--danger)]" : "text-[color:var(--text-primary)]"

  const inner = (
    <div className={`rounded-[var(--radius-card)] border-2 bg-[var(--surface-1)] p-4 transition hover:bg-[var(--surface-2)] ${cfg.border}`}>
      {/* górny pasek: liga + czas */}
      <div className="flex items-center justify-between gap-2 text-xs text-[color:var(--text-muted)]">
        <span className="min-w-0 truncate uppercase tracking-[0.14em]">{tip.league}</span>
        <span className="shrink-0">{minute || formatKickoff(tip.kickoff_utc)}</span>
      </div>

      {/* drużyny + wynik */}
      <div className="mt-3 flex items-center gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <TeamBadge teamName={tip.home} logoUrl={tip.homeLogo} size="sm" />
            <span className="truncate text-sm font-semibold">{tip.home}</span>
          </div>
          <div className="flex items-center gap-2">
            <TeamBadge teamName={tip.away} logoUrl={tip.awayLogo} size="sm" />
            <span className="truncate text-sm font-semibold">{tip.away}</span>
          </div>
        </div>
        <span className={`text-2xl font-extrabold tnum ${scoreColor}`}>
          {hasScore ? `${homeScore} : ${awayScore}` : "— : —"}
        </span>
      </div>

      {/* dół: rynek + status + Q */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${market.badge}`}>{market.short}</span>
          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${cfg.color}`}>
            {cfg.dot && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--danger)]" />}
            {cfg.label}
          </span>
        </span>
        <QScoreRing value={tip.q_score} size={40} stroke={4} />
      </div>
    </div>
  )

  return tip.event_id ? (
    <Link href={`/mecz/${tip.event_id}`} className="block">
      {inner}
    </Link>
  ) : (
    inner
  )
}
