"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { Tip } from "@/lib/types"
import { getLeagueDisplayName } from "@/lib/leagues"
import { getMarketLabel } from "@/lib/market-label"
import { mapMatchStatus, settleTip, statusFromKickoff, type Settlement } from "@/lib/tip-utils"
import { formatKickoff } from "@/lib/time"
import { fmtProb, fmtOdds, fmtEdge, fmtQ, sortKey } from "@/lib/format"
import { DEMO_UNLOCK_PREMIUM } from "@/lib/demo-mode"
import { QRing } from "./ui/q-ring"
import { TeamBadge } from "./team-badge"
import { findLive, mapLiveStatus, useLiveMatches } from "@/hooks/use-live-matches"
import { ArrowRight, ChevronDown, Lock } from "lucide-react"

// Jedna karta = jeden mecz z listą rynków (BTTS, 1X2, Over 2.5, Team O1.5...).
// To rozwiązuje pozorne duplikaty: różne rynki tego samego meczu pod jednym nagłówkiem.
export interface MatchGroup {
  key: string
  event_id: string | number
  home: string
  away: string
  homeLogo?: string | null
  awayLogo?: string | null
  league: string
  leagueCode?: string
  kickoff_utc: string | null
  match_status?: string
  home_score?: number | null
  away_score?: number | null
  tips: Tip[]
}

function settleBadge(s: Settlement) {
  if (s === "won")
    return <span className="rounded-full border border-emerald-400/40 bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-200">✓</span>
  if (s === "lost")
    return <span className="rounded-full border border-rose-400/40 bg-rose-400/15 px-2 py-0.5 text-[10px] font-bold text-rose-200">✗</span>
  return null
}

function MarketRow({
  tip,
  home,
  away,
  finished,
  homeScore,
  awayScore,
}: {
  tip: Tip
  home: string
  away: string
  finished: boolean
  homeScore: number | null
  awayScore: number | null
}) {
  const m = getMarketLabel(tip.bet_type_raw ?? tip.bet_type, tip.bet_side_raw ?? tip.bet_side, home, away)
  const settlement: Settlement = finished ? settleTip(tip, homeScore, awayScore) : "pending"
  const edgeMuted = tip.edge == null
  const edgeClass = edgeMuted ? "text-[color:var(--text-muted)]" : (tip.edge as number) >= 0 ? "text-emerald-300" : "text-rose-300"
  // Mobile: zwięzły wiersz + rozwijane szczegóły (edge, pełna nazwa). Desktop: pełne dane od razu.
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035]">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 p-3 text-left">
        <QRing value={tip.q_score} size={42} stroke={4} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${m.badge}`}>{m.short}</span>
            {finished && settleBadge(settlement)}
          </div>
          {/* pełna nazwa rynku — od razu na desktop, na mobile dopiero po rozwinięciu */}
          <p className="mt-1 hidden truncate text-xs text-white/70 sm:block">{m.full}</p>
          {/* mobile: zwięzła linia „Q · model% · kurs" */}
          <p className="mt-1 flex items-center gap-1.5 text-xs text-white/60 tnum sm:hidden">
            <span>Q {fmtQ(tip.q_score)}</span>
            <span className="text-white/30">·</span>
            <span>{fmtProb(tip.model_prob)}</span>
            <span className="text-white/30">·</span>
            <span className="font-bold text-[color:var(--accent)]">{fmtOdds(tip.odds)}</span>
          </p>
        </div>
        {/* desktop: pełne metryki od razu */}
        <div className="hidden shrink-0 items-center gap-3 text-right sm:flex">
          <div>
            <p className="text-[10px] text-white/50">Szansa</p>
            <p className="text-sm font-semibold" style={{ color: tip.model_prob != null ? m.color : "var(--text-muted)" }}>{fmtProb(tip.model_prob)}</p>
          </div>
          <div>
            <p className="text-[10px] text-white/50">Kurs</p>
            <p className="text-sm font-bold text-[color:var(--accent)]">{fmtOdds(tip.odds)}</p>
          </div>
          <div>
            <p className="text-[10px] text-white/50">Edge</p>
            <p className={`text-sm font-semibold ${edgeClass}`}>{fmtEdge(tip.edge)}</p>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-white/40 transition sm:hidden ${open ? "rotate-180" : ""}`} />
      </button>

      {/* rozwinięcie (tylko mobile): edge + pełna nazwa rynku */}
      {open && (
        <div className="space-y-1 border-t border-white/10 px-3 py-2 text-xs sm:hidden">
          <p className="text-white/70">{m.full}</p>
          <div className="flex items-center justify-between">
            <span className="text-white/50">Edge</span>
            <span className={`font-semibold tnum ${edgeClass}`}>{fmtEdge(tip.edge)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MatchTipCard({
  group,
  href,
  locked = false,
}: {
  group: MatchGroup
  href?: string
  locked?: boolean
}) {
  const { liveMatches } = useLiveMatches()
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(id)
  }, [])

  const live = findLive(liveMatches, group.event_id)
  const liveSt = live ? mapLiveStatus(live.status_short) : null
  const oracleSt = mapMatchStatus(group.match_status)
  const kSt = now != null ? statusFromKickoff(group.kickoff_utc, now) : "upcoming"
  const status =
    liveSt === "live" ? "live"
    : liveSt === "halftime" ? "halftime"
    : liveSt === "finished" ? "finished"
    : (oracleSt ?? kSt)

  const liveOn = status === "live" || status === "halftime"
  const finished = status === "finished"
  const isOrphan = !group.kickoff_utc && !group.match_status

  const homeScore = live ? live.home_score : group.home_score ?? null
  const awayScore = live ? live.away_score : group.away_score ?? null
  const hasScore = homeScore != null && awayScore != null

  const leagueText = group.leagueCode ? getLeagueDisplayName(group.leagueCode) : group.league
  const minuteTxt = live?.minute != null ? `${live.minute}'` : ""

  // prawy górny róg
  const right =
    status === "live" ? <span className="font-bold text-rose-300">🔴 LIVE {minuteTxt}</span>
    : status === "halftime" ? <span className="font-bold text-amber-300">🟡 PRZERWA</span>
    : finished ? <span className="text-white/55">koniec</span>
    : <span className="text-white/55">{formatKickoff(group.kickoff_utc)}</span>

  const sortedTips = [...group.tips].sort((a, b) => sortKey(b.q_score) - sortKey(a.q_score))

  const cardClass =
    "group/card relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-white/12 bg-white/[0.055] p-5 shadow-2xl shadow-black/20 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/[0.085] hover:shadow-[0_8px_24px_rgba(88,230,245,0.08)]"

  const header = (
    <>
      <div className="absolute right-[-40px] top-[-40px] h-28 w-28 rounded-full bg-[var(--glow-1)] blur-2xl" />
      <div className="relative flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-xs uppercase tracking-[0.16em] text-white/60">{leagueText}</span>
        <span className="shrink-0 text-sm font-medium">{right}</span>
      </div>

      <div className="relative mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <TeamBadge teamName={group.home} logoUrl={group.homeLogo} size="md" />
            <span className="truncate text-base font-semibold leading-tight">{group.home}</span>
          </div>
          <div className="flex min-w-0 items-center gap-2.5">
            <TeamBadge teamName={group.away} logoUrl={group.awayLogo} size="md" />
            <span className="truncate text-base font-semibold leading-tight">{group.away}</span>
          </div>
        </div>
        {(liveOn || finished) && hasScore && (
          <div className="flex flex-col items-center">
            <span className={`text-2xl font-extrabold tabular-nums ${liveOn ? "bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent" : "text-[color:var(--text)]"}`}>
              {homeScore} : {awayScore}
            </span>
            <span className="mt-0.5 text-[10px] uppercase tracking-wider text-white/55">
              {status === "halftime" ? "przerwa" : liveOn ? minuteTxt || "live" : "koniec"}
            </span>
          </div>
        )}
      </div>

      <p className="relative mt-3 text-[11px] uppercase tracking-wider text-white/45">
        {group.tips.length} {group.tips.length === 1 ? "rynek" : group.tips.length < 5 ? "rynki" : "rynków"}
      </p>
    </>
  )

  // wariant zablokowany (anonim) — w demo z odblokowanym premium pokazujemy pełne dane
  if (locked && !DEMO_UNLOCK_PREMIUM) {
    return (
      <article className={cardClass}>
        {header}
        <div className="relative mt-3 space-y-2">
          {sortedTips.map((tip, i) => {
            const m = getMarketLabel(tip.bet_type_raw ?? tip.bet_type, tip.bet_side_raw ?? tip.bet_side, group.home, group.away)
            return (
              <div key={i} className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${m.badge}`}>{m.short}</span>
                <span className="flex items-center gap-1.5 text-xs text-white/45"><Lock className="h-3.5 w-3.5" /> ukryte</span>
              </div>
            )
          })}
        </div>
        <Link
          href="/login"
          className="relative mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[color:var(--on-accent)] transition hover:scale-[1.02]"
        >
          Zaloguj, aby zobaczyć typy
        </Link>
      </article>
    )
  }

  return (
    <article className={cardClass}>
      {header}
      <div className="relative mt-3 space-y-2">
        {sortedTips.map((tip, i) => (
          <MarketRow
            key={i}
            tip={tip}
            home={group.home}
            away={group.away}
            finished={finished}
            homeScore={homeScore}
            awayScore={awayScore}
          />
        ))}
      </div>

      {href && !isOrphan ? (
        <Link
          href={href}
          className="relative mt-4 inline-flex items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Zobacz analizę <ArrowRight className="h-4 w-4" />
        </Link>
      ) : isOrphan ? (
        <p className="relative mt-4 text-center text-xs text-white/45">Szczegóły wkrótce</p>
      ) : null}
    </article>
  )
}
