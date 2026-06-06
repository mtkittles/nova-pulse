import Link from "next/link"
import type { BetType, Tip } from "@/lib/types"
import { BET_TYPE_PL, BET_TYPE_SHORT, statusInfo } from "@/lib/labels"
import { AlertTriangle, Lock, Minus, Plus } from "lucide-react"

const MARKET_BADGE: Record<BetType, string> = {
  BTTS: "border-cyan-300/30 bg-cyan-300/10 text-cyan-200",
  OVER_1_5: "border-violet-300/30 bg-violet-300/10 text-violet-200",
  MIX: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200",
  THRILLER: "border-amber-300/30 bg-amber-300/10 text-amber-200",
}

function qScoreColor(q: number): string {
  if (q < 50) return "text-rose-300"
  if (q < 75) return "text-amber-300"
  return "text-emerald-300"
}
function qScoreBar(q: number): string {
  if (q < 50) return "bg-rose-400"
  if (q < 75) return "bg-amber-400"
  return "bg-emerald-400"
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
      <article className="grid min-h-[12rem] place-items-center rounded-[1.8rem] border border-white/12 bg-white/[0.04] p-6 text-center text-sm text-white/45">
        Dane niepełne
      </article>
    )
  }

  // wariant zablokowany (anonim) — mecz widoczny, ale typ/kurs/Q-Score za logowaniem
  if (locked) {
    return (
      <article className="relative flex flex-col overflow-hidden rounded-[1.8rem] border border-white/12 bg-white/[0.055] p-6 shadow-2xl shadow-black/20 backdrop-blur">
        <div className="absolute right-[-40px] top-[-40px] h-28 w-28 rounded-full bg-[var(--glow-1)] blur-2xl" />
        <div className="relative flex items-center justify-between">
          <span className="truncate text-xs uppercase tracking-[0.18em] text-white/45">{tip.league}</span>
          <span className="shrink-0 text-sm font-medium text-white/55">{formatKickoff(tip.kickoff_utc)}</span>
        </div>
        <h3 className="relative mt-4 text-lg font-semibold leading-6">
          {tip.home} <span className="text-white/35">vs</span> {tip.away}
        </h3>
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

  const prob = Math.round(tip.model_prob * 100)
  const edgePct = (tip.edge * 100).toFixed(1)
  const status = statusInfo(tip.actual_result)
  const isThriller = tip.bet_type === "THRILLER"

  const inner = (
    <>
      <div className="absolute right-[-40px] top-[-40px] h-28 w-28 rounded-full bg-[var(--glow-1)] blur-2xl" />

      <div className="relative flex items-center justify-between">
        <span className="truncate text-xs uppercase tracking-[0.18em] text-white/45">{tip.league}</span>
        <span className="shrink-0 text-sm font-medium text-white/55">{formatKickoff(tip.kickoff_utc)}</span>
      </div>

      <h3 className="relative mt-4 text-lg font-semibold leading-6">
        {tip.home} <span className="text-white/35">vs</span> {tip.away}
      </h3>

      <div className="relative mt-4 flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${MARKET_BADGE[tip.bet_type]}`}>
          {BET_TYPE_SHORT[tip.bet_type]}
        </span>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${status.classes}`}>
          {status.label}
        </span>
        {isThriller && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-medium text-amber-200">
            <AlertTriangle className="h-3.5 w-3.5" /> wysokie ryzyko
          </span>
        )}
      </div>

      <p className="relative mt-3 text-sm text-white/65">
        {BET_TYPE_PL[tip.bet_type]} — <span className="font-medium text-white/85">{tip.bet_side}</span>
      </p>

      <div className="relative mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <p className="text-xs text-white/40">Prawd.</p>
          <p className="mt-1 text-xl font-semibold">{prob}%</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <p className="text-xs text-white/40">Kurs</p>
          <p className="mt-1 text-xl font-semibold">{tip.odds.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <p className="text-xs text-white/40">Edge</p>
          <p className={`mt-1 text-xl font-semibold ${tip.edge >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {tip.edge >= 0 ? "+" : ""}
            {edgePct}%
          </p>
        </div>
      </div>

      <div className="relative mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-white/45">Q-Score</span>
          <span className={`font-semibold ${qScoreColor(tip.q_score)}`}>{tip.q_score}/100</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className={`h-full rounded-full ${qScoreBar(tip.q_score)}`} style={{ width: `${tip.q_score}%` }} />
        </div>
      </div>
    </>
  )

  const cardClass = `group relative flex flex-col overflow-hidden rounded-[1.8rem] border bg-white/[0.055] p-6 shadow-2xl shadow-black/20 backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.085] ${
    selected ? "border-[color:var(--accent)]/60" : "border-white/12"
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
