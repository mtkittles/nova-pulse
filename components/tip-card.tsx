"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { Tip } from "@/lib/types"
import { scaleColor } from "@/lib/design"
import { getLeagueDisplayName } from "@/lib/leagues"
import { getMarketLabel } from "@/lib/market-label"
import { MetricLabel, METRIC_HINTS } from "./ui/metric-tooltip"
import { StatusPill } from "./ui/status-pill"
import { Badge } from "./ui/badge"
import { mapMatchStatus, settleTip, statusFromKickoff, type Settlement } from "@/lib/tip-utils"
import { QRing } from "./ui/q-ring"
import { TeamBadge } from "./team-badge"
import { findLive, mapLiveStatus, useLiveMatches } from "@/hooks/use-live-matches"
import { formatKickoff } from "@/lib/time"
import { fmtProb, fmtOdds, fmtEdge } from "@/lib/format"
import { DEMO_UNLOCK_PREMIUM } from "@/lib/demo-mode"
import { AlertTriangle, Lock, Minus, Plus } from "lucide-react"

function LeagueRow({ leagueText, right }: { leagueText: string; right: React.ReactNode }) {
  return (
    <div className="relative flex items-center justify-between gap-2">
      <span className="min-w-0 truncate text-xs uppercase tracking-[0.16em] text-white/60">{leagueText}</span>
      <span className="shrink-0 text-sm font-medium text-white/55">{right}</span>
    </div>
  )
}

// Czytelna liga: preferuj kod (flaga+kraj+nazwa), w razie braku — gotową nazwę z adaptera.
function leagueLabel(tip: Tip): string {
  return tip.leagueCode ? getLeagueDisplayName(tip.leagueCode) : tip.league
}

function TeamRow({ name, logo }: { name: string; logo?: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <TeamBadge teamName={name} logoUrl={logo} size="md" />
      <span className="truncate text-base font-semibold leading-tight">{name}</span>
    </div>
  )
}

export default function TipCard({
  tip,
  href,
  selectable = false,
  selected = false,
  onToggle,
  locked = false,
}: {
  tip: Tip
  href?: string
  selectable?: boolean
  selected?: boolean
  onToggle?: () => void
  locked?: boolean
}) {
  // live (hook na górze — przed wczesnymi returnami, zgodnie z zasadami hooków)
  const { liveMatches } = useLiveMatches()
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(id)
  }, [])

  const live = findLive(liveMatches, tip.event_id)
  const liveSt = live ? mapLiveStatus(live.status_short) : null

  // Status efektywny: dane live > match_status z Oracle > heurystyka z kickoff_utc.
  const oracleSt = mapMatchStatus(tip.match_status)
  const kSt = now != null ? statusFromKickoff(tip.kickoff_utc, now) : "upcoming"
  const status: "upcoming" | "live" | "halftime" | "finished" | "unknown" =
    liveSt === "live"
      ? "live"
      : liveSt === "halftime"
        ? "halftime"
        : liveSt === "finished"
          ? "finished"
          : (oracleSt ?? kSt)

  const liveOn = status === "live" || status === "halftime"
  const finished = status === "finished"
  // Sierota = typ bez fixture (brak godziny ORAZ statusu) → brak strony /mecz/{id}.
  const isOrphan = !tip.kickoff_utc && !tip.match_status
  // wynik: z live, a w razie braku — z pól tipa (home_score/away_score z Oracle)
  const homeScore = live ? live.home_score : tip.home_score ?? null
  const awayScore = live ? live.away_score : tip.away_score ?? null
  const hasScore = homeScore != null && awayScore != null
  const settlement: Settlement = finished ? settleTip(tip, homeScore, awayScore) : "pending"

  // defensywnie: niekompletny rekord → komunikat zamiast crasha
  if (!tip.home || !tip.away) {
    return (
      <article className="grid min-h-[12rem] place-items-center rounded-[var(--radius-card)] border border-white/12 bg-white/[0.04] p-6 text-center text-sm text-white/60">
        Dane niepełne
      </article>
    )
  }

  // wariant zablokowany (anonim) — mecz widoczny, ale typ/kurs/Q-Score za logowaniem.
  // W demo z odblokowanym premium NIE pokazuj kłódki — pełne dane dla testera.
  if (locked && !DEMO_UNLOCK_PREMIUM) {
    const lockedRight = liveOn && live ? `🔴 ${live.home_score}:${live.away_score}` : formatKickoff(tip.kickoff_utc)
    return (
      <article className="relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-white/12 bg-white/[0.055] p-6 shadow-2xl shadow-black/20 backdrop-blur">
        <div className="absolute right-[-40px] top-[-40px] h-28 w-28 rounded-full bg-[var(--glow-1)] blur-2xl" />
        <LeagueRow leagueText={leagueLabel(tip)} right={lockedRight} />
        <div className="relative mt-4 space-y-2">
          <TeamRow name={tip.home} logo={tip.homeLogo} />
          <TeamRow name={tip.away} logo={tip.awayLogo} />
        </div>
        <div className="relative mt-5 grid place-items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
          <Lock className="h-6 w-6 text-[color:var(--accent)]" />
          <p className="text-sm text-white/60">Zaloguj, aby zobaczyć typ, kurs i Q-Score</p>
          <Link
            href="/login"
            className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-[color:var(--on-accent)] transition hover:scale-105"
          >
            Zaloguj przez Telegram
          </Link>
        </div>
      </article>
    )
  }

  const hasProb = tip.model_prob != null
  const prob = hasProb ? Math.round((tip.model_prob as number) * 100) : null
  const probColor = hasProb ? scaleColor(tip.model_prob as number) : "var(--text-muted)"
  const market = getMarketLabel(tip.bet_type_raw ?? tip.bet_type, tip.bet_side_raw ?? tip.bet_side, tip.home, tip.away)
  const isThriller = market.short === "Thriller"
  const edgeMuted = tip.edge == null
  const minuteTxt = live?.minute != null ? `${live.minute}'` : ""

  const scoreTxt = hasScore ? `${homeScore} : ${awayScore}` : null

  // prawy górny róg: status + wynik zależnie od stanu meczu
  const rightNode =
    status === "live" ? (
      <span className="font-bold text-rose-300">🔴 LIVE {minuteTxt}</span>
    ) : status === "halftime" ? (
      <span className="font-bold text-amber-300">🟡 PRZERWA</span>
    ) : finished ? (
      <span className="text-white/55">koniec</span>
    ) : status === "upcoming" ? (
      <span className="text-white/55">Nadchodzący · {formatKickoff(tip.kickoff_utc)}</span>
    ) : (
      formatKickoff(tip.kickoff_utc)
    )

  const inner = (
    <>
      <div className="absolute right-[-40px] top-[-40px] h-28 w-28 rounded-full bg-[var(--glow-1)] blur-2xl" />

      <LeagueRow leagueText={leagueLabel(tip)} right={rightNode} />

      {/* drużyny + (wynik dla live/finished) + pierścień Q-Score */}
      <div className="relative mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <TeamRow name={tip.home} logo={tip.homeLogo} />
          <TeamRow name={tip.away} logo={tip.awayLogo} />
        </div>
        {(liveOn || finished) && scoreTxt ? (
          <div className="flex flex-col items-center">
            <span
              className={`text-2xl font-extrabold tabular-nums ${
                liveOn
                  ? "bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent"
                  : "text-[color:var(--text)]"
              }`}
            >
              {scoreTxt}
            </span>
            <span className="mt-0.5 text-[10px] uppercase tracking-wider text-white/55">
              {status === "halftime" ? "przerwa" : liveOn ? minuteTxt || "live" : "koniec"}
            </span>
          </div>
        ) : (
          <QRing value={tip.q_score} />
        )}
      </div>

      {/* badge'y: JEDEN status (wynik gdy rozliczony, inaczej stan meczu) + rynek + ryzyko */}
      <div className="relative mt-4 flex flex-wrap items-center gap-2">
        {tip.actual_result === 1 ? (
          <StatusPill status="WON" />
        ) : tip.actual_result === 0 ? (
          <StatusPill status="LOST" />
        ) : liveOn ? (
          <StatusPill status="LIVE" />
        ) : finished ? (
          <Badge tone="neutral">Zakończony</Badge>
        ) : status === "upcoming" ? (
          <Badge tone="cyan">Nadchodzący</Badge>
        ) : null}

        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${market.badge}`}>
          {market.short}
        </span>

        {isThriller && (
          <Badge tone="warning">
            <AlertTriangle className="h-3.5 w-3.5" /> wysokie ryzyko
          </Badge>
        )}
      </div>

      <p className="relative mt-3 text-sm text-[color:var(--text-secondary)]">{market.full}</p>

      {/* metryki — kurs wyróżniony */}
      <div className="relative mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <MetricLabel label="Szansa modelu" hint={METRIC_HINTS.model} className="text-xs text-white/60" />
          <p className="mt-1 text-xl font-semibold" style={{ color: probColor }}>
            {fmtProb(tip.model_prob)}
          </p>
        </div>
        <div className="rounded-2xl border border-[color:var(--accent)]/40 bg-[var(--accent)]/10 p-3">
          <MetricLabel label="Kurs" hint={METRIC_HINTS.odds} className="text-xs text-white/70" />
          <p className="mt-1 text-2xl font-bold text-[color:var(--accent)]">{fmtOdds(tip.odds)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <MetricLabel label="Edge" hint={METRIC_HINTS.edge} className="text-xs text-white/60" />
          <p className={`mt-1 text-xl font-semibold ${edgeMuted ? "text-[color:var(--text-muted)]" : (tip.edge as number) >= 0 ? "text-[color:var(--success)]" : "text-[color:var(--danger)]"}`}>
            {fmtEdge(tip.edge)}
          </p>
        </div>
      </div>

      {/* pasek szansy modelu (gradient wg prawdopodobieństwa) — tylko gdy znana */}
      {hasProb && (
        <div className="relative mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-white/60">Szansa modelu</span>
            <span className="font-semibold" style={{ color: probColor }}>
              {prob}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full"
              style={{
                width: `${prob}%`,
                background: `linear-gradient(90deg, ${scaleColor(Math.max(0, (tip.model_prob as number) - 0.25))}, ${probColor})`,
              }}
            />
          </div>
        </div>
      )}

      {/* sierota (brak fixture) — brak strony analizy */}
      {isOrphan && (
        <p className="relative mt-4 text-center text-xs text-white/45">Szczegóły wkrótce</p>
      )}
    </>
  )

  const tint =
    settlement === "won"
      ? "border-emerald-400/50 ring-1 ring-emerald-400/25"
      : settlement === "lost"
        ? "border-rose-400/50 ring-1 ring-rose-400/20"
        : liveOn
          ? "border-rose-400/50 ring-1 ring-rose-400/30"
          : selected
            ? "border-[color:var(--accent)]/60"
            : "border-white/12"
  const cardClass = `group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border bg-white/[0.055] p-6 shadow-2xl shadow-black/20 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/[0.085] hover:shadow-[0_8px_24px_rgba(88,230,245,0.08)] ${tint}`

  if (selectable) {
    return (
      <article className={cardClass}>
        {inner}
        <button
          type="button"
          onClick={onToggle}
          className={`relative mt-5 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
            selected
              ? "bg-[var(--accent)] text-[color:var(--on-accent)] hover:scale-[1.02]"
              : "border border-white/15 bg-white/10 text-white hover:bg-white/15"
          }`}
        >
          {selected ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {selected ? "W kuponie" : "Do kuponu"}
        </button>
      </article>
    )
  }

  // Sieroty nie mają strony /mecz/{id} — renderuj jako kartę bez linku.
  if (href && !isOrphan) {
    return (
      <Link href={href} className={cardClass}>
        {inner}
      </Link>
    )
  }

  return <article className={cardClass}>{inner}</article>
}
