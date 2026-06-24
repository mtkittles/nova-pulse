import Link from "next/link"
import type { BetType, MatchStatus, SettlementStatus, Tip } from "@/lib/types"
import { BET_TYPE_PL, BET_TYPE_SHORT, statusInfo } from "@/lib/labels"
import { AlertTriangle, Clock3, Lock, Minus, Plus, Radio, Trophy } from "lucide-react"

const MARKET_BADGE: Record<BetType, string> = {
  BTTS: "border-cyan-300/25 bg-cyan-300/[0.09] text-cyan-100",
  OVER_1_5: "border-violet-300/25 bg-violet-300/[0.09] text-violet-100",
  MIX: "border-emerald-300/25 bg-emerald-300/[0.09] text-emerald-100",
  THRILLER: "border-amber-300/25 bg-amber-300/[0.09] text-amber-100",
}

function qScoreColor(q: number): string {
  if (q < 50) return "text-rose-300"
  if (q < 75) return "text-amber-300"
  return "text-emerald-300"
}
function qScoreTone(q: number): string {
  if (q < 50) return "from-rose-400 to-rose-300"
  if (q < 75) return "from-amber-300 to-orange-300"
  return "from-[var(--accent)] to-emerald-300"
}

function formatKickoff(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "termin nieznany"
  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "short",
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
  }).format(d)
}

function matchStatusInfo(status?: MatchStatus, minute?: number | null) {
  if (status === "LIVE") {
    return {
      label: minute != null ? `LIVE ${minute}'` : "LIVE",
      classes: "border-rose-300/30 bg-rose-300/10 text-rose-200",
      icon: Radio,
    }
  }
  if (status === "FINISHED") {
    return {
      label: "Koniec",
      classes: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200",
      icon: Trophy,
    }
  }
  return {
    label: "Zaplanowany",
    classes: "border-white/15 bg-white/[0.06] text-white/65",
    icon: Clock3,
  }
}

function settlementInfo(status?: SettlementStatus, actualResult?: 0 | 1 | null) {
  if (status === "void") {
    return { label: "void", classes: "border-amber-300/30 bg-amber-300/10 text-amber-200" }
  }
  if (status === "push") {
    return { label: "push", classes: "border-sky-300/30 bg-sky-300/10 text-sky-200" }
  }
  if (status === "won" || actualResult === 1) {
    return { label: "won", classes: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200" }
  }
  if (status === "lost" || actualResult === 0) {
    return { label: "lost", classes: "border-rose-300/30 bg-rose-300/10 text-rose-200" }
  }
  if (status === "unknown") {
    return { label: "unknown", classes: "border-white/15 bg-white/[0.06] text-white/55" }
  }
  return { label: "pending", classes: "border-white/15 bg-white/[0.06] text-white/55" }
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
  // defensywnie: niekompletny rekord → komunikat zamiast crasha
  if (!tip.home || !tip.away) {
    return (
      <article className="signal-card grid min-h-[12rem] place-items-center rounded-[1.8rem] p-6 text-center text-sm text-white/45">
        Dane niepełne
      </article>
    )
  }

  // wariant zablokowany (anonim) — mecz widoczny, ale typ/kurs/Q-Score za logowaniem
  if (locked) {
    return (
      <article className="signal-card signal-card-hover relative flex min-h-[20rem] flex-col overflow-hidden rounded-[1.8rem] p-5">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/35 to-transparent" />
        <div className="relative flex items-center justify-between gap-3">
          <span className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-faint)]">{tip.league}</span>
          <span className="shrink-0 rounded-full bg-white/[0.045] px-2.5 py-1 text-xs font-medium text-[color:var(--text-muted)]">{formatKickoff(tip.kickoff_utc)}</span>
        </div>
        <h3 className="relative mt-4 text-xl font-semibold leading-7 tracking-[-0.02em]">
          {tip.home} <span className="text-[color:var(--text-faint)]">vs</span> {tip.away}
        </h3>
        <div className="relative mt-5 grid flex-1 place-items-center gap-3 rounded-[1.35rem] border border-[color:var(--line-soft)] bg-[var(--surface-sunken)] p-6 text-center">
          <Lock className="h-6 w-6 text-[color:var(--accent)]" />
          <p className="text-sm leading-6 text-[color:var(--text-secondary)]">Zaloguj, aby zobaczyć typ, kurs i Q-Score</p>
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

  const prob = Math.round(tip.model_prob * 100)
  const edgePct = (tip.edge * 100).toFixed(1)
  const status = statusInfo(tip.actual_result)
  const settlement = settlementInfo(tip.settlement_status, tip.actual_result)
  const match = matchStatusInfo(tip.match_status, tip.match_minute)
  const MatchIcon = match.icon
  const isThriller = tip.bet_type === "THRILLER"

  const inner = (
    <>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/35 to-transparent" />
      <div className="absolute right-[-44px] top-[-44px] hidden h-32 w-32 rounded-full bg-[var(--glow-1)] blur-3xl sm:block" />

      <div className="relative flex items-center justify-between gap-3">
        <span className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-faint)]">{tip.league}</span>
        <span className="shrink-0 rounded-full bg-white/[0.045] px-2.5 py-1 text-xs font-medium text-[color:var(--text-muted)]">{formatKickoff(tip.kickoff_utc)}</span>
      </div>

      <div className="relative mt-4 flex items-start justify-between gap-4">
        <h3 className="text-xl font-semibold leading-7 tracking-[-0.02em]">
          {tip.home} <span className="text-[color:var(--text-faint)]">vs</span> {tip.away}
        </h3>
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-[color:var(--line-soft)] bg-white/[0.045] text-center">
          <span className={`text-2xl font-semibold leading-none tabular-nums ${qScoreColor(tip.q_score)}`}>{tip.q_score}</span>
          <span className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--text-faint)]">Q</span>
        </div>
      </div>

      <p className="relative mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
        {BET_TYPE_PL[tip.bet_type]} <span className="text-[color:var(--text-faint)]">/</span>{" "}
        <span className="font-semibold text-[color:var(--text-primary)]">{tip.bet_side}</span>
      </p>

      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full bg-gradient-to-r ${qScoreTone(tip.q_score)}`} style={{ width: `${tip.q_score}%` }} />
      </div>

      <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="signal-stat-tile rounded-2xl p-3">
          <p className="text-[11px] text-[color:var(--text-faint)]">Prob.</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{prob}%</p>
        </div>
        <div className="signal-stat-tile rounded-2xl p-3">
          <p className="text-[11px] text-[color:var(--text-faint)]">Kurs</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{tip.odds.toFixed(2)}</p>
        </div>
        <div className="signal-stat-tile rounded-2xl p-3">
          <p className="text-[11px] text-[color:var(--text-faint)]">Edge</p>
          <p className={`mt-1 text-lg font-semibold tabular-nums ${tip.edge >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {tip.edge >= 0 ? "+" : ""}
            {edgePct}%
          </p>
        </div>
      </div>

      <div className="relative mt-4 flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${MARKET_BADGE[tip.bet_type]}`}>
          {BET_TYPE_SHORT[tip.bet_type]}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${match.classes}`}>
          <MatchIcon className="h-3.5 w-3.5" />
          {match.label}
        </span>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${settlement.classes}`}>
          {settlement.label}
        </span>
        {isThriller && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/25 bg-amber-300/[0.09] px-3 py-1 text-xs font-medium text-amber-100">
            <AlertTriangle className="h-3.5 w-3.5" /> high risk
          </span>
        )}
      </div>

      {(tip.match_score || tip.match_status === "LIVE" || tip.match_status === "FINISHED") && (
        <div className="relative mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[color:var(--text-secondary)]">
            wynik: <span className="font-semibold text-[color:var(--text-primary)]">{tip.match_score || "—"}</span>
          </span>
          {tip.match_status === "LIVE" && tip.match_minute != null && (
            <span className="rounded-full border border-rose-300/25 bg-rose-300/[0.09] px-3 py-1 text-rose-100">
              minuta {tip.match_minute}'
            </span>
          )}
          {tip.match_status === "FINISHED" && (
            <span className={`rounded-full border px-3 py-1 ${status.classes}`}>{status.label}</span>
          )}
        </div>
      )}
    </>
  )

  const cardClass = `signal-card signal-card-hover group relative flex min-h-[20rem] flex-col overflow-hidden rounded-[1.8rem] p-5 ${
    selected ? "border-[color:var(--accent)]/60" : ""
  }`

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

  if (href) {
    return (
      <Link href={href} className={cardClass}>
        {inner}
      </Link>
    )
  }

  return <article className={cardClass}>{inner}</article>
}
