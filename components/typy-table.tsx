"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { ReactNode } from "react"
import type { Tip } from "@/lib/types"
import { getLeagueDisplayName } from "@/lib/leagues"
import { getMarketLabel } from "@/lib/market-label"
import { mapMatchStatus, settleTip, statusFromKickoff } from "@/lib/tip-utils"
import { findLive, mapLiveStatus, useLiveMatches } from "@/hooks/use-live-matches"
import { TeamBadge } from "./team-badge"
import { StatusPill, type PillStatus } from "./ui/status-pill"
import { qScoreColor } from "@/lib/design"
import { fmtProb, fmtOdds, fmtEdge, fmtQ } from "@/lib/format"

function timeLocal(iso: string | null): string {
  if (!iso) return "wkrótce"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "wkrótce"
  return new Intl.DateTimeFormat("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(d)
}

function Row({ tip, loggedIn, now }: { tip: Tip; loggedIn: boolean; now: number | null }) {
  const { liveMatches } = useLiveMatches()
  const live = findLive(liveMatches, tip.event_id)
  const liveSt = live ? mapLiveStatus(live.status_short) : null
  const oracleSt = mapMatchStatus(tip.match_status)
  const kSt = now != null ? statusFromKickoff(tip.kickoff_utc, now) : "upcoming"
  const status =
    liveSt === "live" || liveSt === "halftime" ? "live" : liveSt === "finished" ? "finished" : (oracleSt ?? kSt)

  const homeScore = live ? live.home_score : tip.home_score ?? null
  const awayScore = live ? live.away_score : tip.away_score ?? null
  let pill: PillStatus = "PENDING"
  if (status === "live") pill = "LIVE"
  else if (status === "finished") {
    const s = settleTip(tip, homeScore, awayScore)
    pill = s === "won" ? "WON" : s === "lost" ? "LOST" : "PENDING"
  }

  const market = getMarketLabel(tip.bet_type_raw ?? tip.bet_type, tip.bet_side_raw ?? tip.bet_side, tip.home, tip.away)
  const leagueText = tip.leagueCode ? getLeagueDisplayName(tip.leagueCode) : tip.league
  const edgeMuted = tip.edge == null

  // sierota = brak fixture → bez linku (P0-03)
  const isOrphan = !tip.kickoff_utc && !tip.match_status
  const href = loggedIn && tip.event_id != null && tip.event_id !== "" && !isOrphan ? `/mecz/${tip.event_id}` : null
  // owijamy treść komórki w link, gdy klikalne (cały wiersz prowadzi do analizy)
  const wrap = (child: ReactNode, extra = "") =>
    href ? (
      <Link href={href} className={`block ${extra}`}>
        {child}
      </Link>
    ) : (
      <span className={`block ${extra}`}>{child}</span>
    )

  const cell = "px-3 py-2.5"
  return (
    <tr className={`border-b border-[color:var(--border-soft)] transition last:border-0 hover:bg-[var(--surface-2)] ${href ? "cursor-pointer" : ""}`}>
      <td className={`${cell} whitespace-nowrap text-[color:var(--text-secondary)] tnum`}>{wrap(timeLocal(tip.kickoff_utc))}</td>
      <td className={`${cell} hidden max-w-[10rem] md:table-cell text-[color:var(--text-secondary)]`}>{wrap(leagueText, "truncate")}</td>
      <td className={cell}>
        {wrap(
          <span className="flex min-w-0 items-center gap-1.5">
            <TeamBadge teamName={tip.home} logoUrl={tip.homeLogo} size="sm" />
            <span className="truncate font-medium text-[color:var(--text-primary)]">{tip.home}</span>
            <span className="text-[color:var(--text-muted)]">–</span>
            <TeamBadge teamName={tip.away} logoUrl={tip.awayLogo} size="sm" />
            <span className="truncate font-medium text-[color:var(--text-primary)]">{tip.away}</span>
          </span>,
        )}
      </td>
      <td className={cell}>
        <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${market.badge}`}>{market.short}</span>
      </td>
      <td className={`${cell} text-center font-bold tnum`} style={{ color: tip.q_score != null ? qScoreColor(tip.q_score) : "var(--text-muted)" }}>{fmtQ(tip.q_score)}</td>
      <td className={`${cell} hidden text-center text-[color:var(--text-secondary)] tnum sm:table-cell`}>{fmtProb(tip.model_prob)}</td>
      <td className={`${cell} text-center font-bold text-[color:var(--cyan)] tnum`}>{fmtOdds(tip.odds)}</td>
      <td className={`${cell} text-center font-semibold tnum ${edgeMuted ? "text-[color:var(--text-muted)]" : (tip.edge as number) >= 0 ? "text-[color:var(--success)]" : "text-[color:var(--danger)]"}`}>
        {fmtEdge(tip.edge)}
      </td>
      <td className={`${cell} text-right`}>
        <StatusPill status={pill} />
      </td>
    </tr>
  )
}

// Tabela pojedynczych typów (widok zaawansowany). Sieroty bez linku (P0-03).
export function TypyTable({ tips, loggedIn }: { tips: Tip[]; loggedIn: boolean }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(id)
  }, [])

  const th = "px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]"
  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[color:var(--border-soft)] bg-[var(--surface-1)]">
      <table className="w-full text-sm">
        <thead className="border-b border-[color:var(--border-soft)]">
          <tr>
            <th className={th}>Czas</th>
            <th className={`${th} hidden md:table-cell`}>Liga</th>
            <th className={th}>Mecz</th>
            <th className={th}>Rynek</th>
            <th className={`${th} text-center`}>Q</th>
            <th className={`${th} hidden text-center sm:table-cell`}>Model</th>
            <th className={`${th} text-center`}>Kurs</th>
            <th className={`${th} text-center`}>Edge</th>
            <th className={`${th} text-right`}>Status</th>
          </tr>
        </thead>
        <tbody>
          {tips.map((t, i) => (
            <Row key={`${String(t.event_id)}-${i}`} tip={t} loggedIn={loggedIn} now={now} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
