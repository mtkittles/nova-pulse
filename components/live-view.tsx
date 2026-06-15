"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CalendarOff } from "lucide-react"
import type { Tip } from "@/lib/types"
import { getMarketLabel } from "@/lib/market-label"
import { mapMatchStatus, resolveTip, settleTip, statusFromKickoff } from "@/lib/tip-utils"
import { formatKickoff } from "@/lib/time"
import { findLive, mapLiveStatus, useLiveMatches } from "@/hooks/use-live-matches"
import { TeamBadge } from "./team-badge"
import { QScoreRing } from "./ui/q-score-ring"
import { Badge } from "./ui/badge"
import { StatusPill, type PillStatus } from "./ui/status-pill"
import { EmptyState } from "./ui/empty-state"

type LiveState = "LIVE_OPEN" | "LIVE_HIT" | "LIVE_AT_RISK"
type Bucket = "active" | "upcoming" | "finished"

const LIVE_META: Record<LiveState, { border: string; label: string; tone: "cyan" | "success" | "danger" }> = {
  LIVE_OPEN: { border: "border-[color:var(--border-strong)]", label: "⏱ W trakcie", tone: "cyan" },
  LIVE_HIT: { border: "border-[color:var(--success)]/60", label: "✓ Trafiony na żywo!", tone: "success" },
  LIVE_AT_RISK: { border: "border-[color:var(--danger)]/60", label: "⚠ Zagrożony", tone: "danger" },
}

function countdown(iso: string | null, nowMs: number): string {
  if (!iso) return "wkrótce"
  const k = new Date(iso).getTime()
  if (!Number.isFinite(k)) return "wkrótce"
  const diff = k - nowMs
  if (diff <= 0) return "lada chwila"
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  if (h >= 24) return formatKickoff(iso)
  if (h > 0) return `za ${h}h ${m % 60}m`
  return `za ${m}m`
}

interface Resolved {
  tip: Tip
  bucket: Bucket
  liveState: LiveState | null
  homeScore: number | null
  awayScore: number | null
  minute: string
  settlement: PillStatus | null
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

  const rows = useMemo<Resolved[]>(() => {
    return tips.map((tip) => {
      const live = findLive(liveMatches, tip.event_id)
      const liveSt = live ? mapLiveStatus(live.status_short) : null
      const oracleSt = mapMatchStatus(tip.match_status)
      const kSt = statusFromKickoff(tip.kickoff_utc, nowMs)
      const homeScore = live ? live.home_score : tip.home_score ?? null
      const awayScore = live ? live.away_score : tip.away_score ?? null

      const finished = liveSt === "finished" || oracleSt === "finished" || tip.actual_result != null
      const inPlay = liveSt === "live" || liveSt === "halftime" || oracleSt === "live" || (oracleSt == null && kSt === "live")

      let bucket: Bucket = "upcoming"
      let liveState: LiveState | null = null
      let settlement: PillStatus | null = null

      if (finished) {
        bucket = "finished"
        const s = settleTip(tip, homeScore, awayScore)
        settlement = s === "won" ? "WON" : s === "lost" ? "LOST" : s === "void" ? "VOID" : "PENDING"
      } else if (inPlay) {
        bucket = "active"
        const prov = resolveTip(tip.bet_type_raw ?? tip.bet_type, tip.bet_side_raw ?? tip.bet_side, homeScore, awayScore)
        liveState = prov === "won" ? "LIVE_HIT" : prov === "lost" ? "LIVE_AT_RISK" : "LIVE_OPEN"
      }

      const minute = liveSt === "halftime" ? "PRZERWA" : live?.minute != null ? `${live.minute}'` : "LIVE"
      return { tip, bucket, liveState, homeScore, awayScore, minute, settlement }
    })
  }, [tips, liveMatches, nowMs])

  const active = rows.filter((r) => r.bucket === "active")
  const upcoming = rows
    .filter((r) => r.bucket === "upcoming")
    .sort((a, b) => (a.tip.kickoff_utc ?? "").localeCompare(b.tip.kickoff_utc ?? ""))
  const finished = rows.filter((r) => r.bucket === "finished")

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
      {/* HEADER */}
      <header className="flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--danger)] opacity-70" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--danger)]" />
        </span>
        <h1 className="text-3xl font-semibold tracking-tight">Na żywo</h1>
        <span className="rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-2)] px-3 py-1 text-sm font-semibold tnum text-[color:var(--text-secondary)]">
          {active.length} aktywnych
        </span>
      </header>

      {/* AKTYWNE */}
      {active.length > 0 && (
        <section className="space-y-3">
          {active.map((r) => (
            <ActiveCard key={String(r.tip.event_id)} r={r} />
          ))}
        </section>
      )}

      {/* NADCHODZĄCE DZIŚ */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">Nadchodzące dziś</h2>
          <div className="space-y-2">
            {upcoming.map((r) => (
              <UpcomingRow key={String(r.tip.event_id)} r={r} nowMs={nowMs} />
            ))}
          </div>
        </section>
      )}

      {/* ZAKOŃCZONE DZIŚ */}
      {finished.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">Zakończone dziś</h2>
          <div className="space-y-2">
            {finished.map((r) => (
              <FinishedRow key={String(r.tip.event_id)} r={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function MarketLine({ tip }: { tip: Tip }) {
  const m = getMarketLabel(tip.bet_type_raw ?? tip.bet_type, tip.bet_side_raw ?? tip.bet_side, tip.home, tip.away)
  return <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold ${m.badge}`}>{m.short}</span>
}

function ActiveCard({ r }: { r: Resolved }) {
  const { tip } = r
  const meta = LIVE_META[r.liveState ?? "LIVE_OPEN"]
  const edgePct = (tip.edge * 100).toFixed(1)
  return (
    <div className={`rounded-[var(--radius-card)] border-2 bg-[var(--surface-1)] p-5 ${meta.border}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-xs uppercase tracking-[0.16em] text-[color:var(--text-muted)]">{tip.league}</span>
        <span className="flex items-center gap-2">
          <Badge tone={meta.tone}>{meta.label}</Badge>
          <span className="text-xs font-bold text-[color:var(--danger)]">{r.minute}</span>
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <TeamBadge teamName={tip.home} logoUrl={tip.homeLogo} size="md" />
            <span className="truncate font-semibold">{tip.home}</span>
          </div>
          <div className="flex items-center gap-2">
            <TeamBadge teamName={tip.away} logoUrl={tip.awayLogo} size="md" />
            <span className="truncate font-semibold">{tip.away}</span>
          </div>
        </div>
        <span className="text-3xl font-extrabold tnum text-[color:var(--text-primary)]">
          {r.homeScore ?? "-"} : {r.awayScore ?? "-"}
        </span>
        <QScoreRing value={tip.q_score} size={48} stroke={4} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <MarketLine tip={tip} />
        <span className="flex items-center gap-3 text-sm">
          <span className="text-[color:var(--text-secondary)]">Kurs <b className="text-[color:var(--cyan)] tnum">{tip.odds.toFixed(2)}</b></span>
          <span className={`tnum ${tip.edge >= 0 ? "text-[color:var(--success)]" : "text-[color:var(--danger)]"}`}>
            {tip.edge >= 0 ? "+" : ""}{edgePct}%
          </span>
        </span>
      </div>
    </div>
  )
}

function UpcomingRow({ r, nowMs }: { r: Resolved; nowMs: number }) {
  const { tip } = r
  return (
    <Link
      href={tip.event_id ? `/mecz/${tip.event_id}` : "/typy"}
      className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[color:var(--border-soft)] bg-[var(--surface-1)] p-3 transition hover:bg-[var(--surface-2)]"
    >
      <div className="flex shrink-0 items-center gap-1">
        <TeamBadge teamName={tip.home} logoUrl={tip.homeLogo} size="sm" />
        <TeamBadge teamName={tip.away} logoUrl={tip.awayLogo} size="sm" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{tip.home} – {tip.away}</p>
        <p className="text-xs text-[color:var(--text-muted)] tnum">{countdown(tip.kickoff_utc, nowMs)}</p>
      </div>
      <MarketLine tip={tip} />
      <Badge tone="cyan">Nadchodzący</Badge>
    </Link>
  )
}

function FinishedRow({ r }: { r: Resolved }) {
  const { tip } = r
  return (
    <Link
      href={tip.event_id ? `/mecz/${tip.event_id}` : "/typy"}
      className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[color:var(--border-soft)] bg-[var(--surface-1)] p-3 transition hover:bg-[var(--surface-2)]"
    >
      <div className="flex shrink-0 items-center gap-1">
        <TeamBadge teamName={tip.home} logoUrl={tip.homeLogo} size="sm" />
        <TeamBadge teamName={tip.away} logoUrl={tip.awayLogo} size="sm" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{tip.home} – {tip.away}</p>
        <p className="text-xs text-[color:var(--text-muted)]"><MarketLine tip={tip} /></p>
      </div>
      <span className="shrink-0 font-bold tnum text-[color:var(--text-secondary)]">
        {r.homeScore ?? "-"}:{r.awayScore ?? "-"}
      </span>
      {r.settlement && <StatusPill status={r.settlement} />}
    </Link>
  )
}
