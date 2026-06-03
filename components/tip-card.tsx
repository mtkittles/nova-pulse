import type { BetType, Tip } from "@/lib/types"
import { CheckCircle2, XCircle } from "lucide-react"

const MARKET: Record<BetType, { label: string; classes: string }> = {
  BTTS: { label: "BTTS", classes: "border-cyan-300/30 bg-cyan-300/10 text-cyan-200" },
  OVER_1_5: { label: "Over 1.5", classes: "border-violet-300/30 bg-violet-300/10 text-violet-200" },
  MIX: { label: "Mix", classes: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200" },
  THRILLER: { label: "Thriller", classes: "border-amber-300/30 bg-amber-300/10 text-amber-200" },
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
  // Stała strefa czasowa → brak rozjazdu hydratacji SSR/klient.
  return new Intl.DateTimeFormat("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
  }).format(new Date(iso))
}

export default function TipCard({ tip }: { tip: Tip }) {
  const market = MARKET[tip.bet_type]
  const prob = Math.round(tip.model_prob * 100)
  const edgePct = (tip.edge * 100).toFixed(1)
  const settled = tip.actual_result !== null

  return (
    <article className="group relative overflow-hidden rounded-[1.8rem] border border-white/12 bg-white/[0.055] p-6 shadow-2xl shadow-black/20 backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.085]">
      <div className="absolute right-[-40px] top-[-40px] h-28 w-28 rounded-full bg-cyan-300/10 blur-2xl transition group-hover:bg-cyan-300/20" />

      <div className="relative flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.18em] text-white/45">{tip.league}</span>
        <span className="text-sm font-medium text-white/55">{formatKickoff(tip.kickoff_utc)}</span>
      </div>

      <h3 className="relative mt-4 text-lg font-semibold leading-6">
        {tip.home} <span className="text-white/35">vs</span> {tip.away}
      </h3>

      <div className="relative mt-4 flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${market.classes}`}>
          {market.label}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/65">
          {tip.bet_side}
        </span>
        {settled &&
          (tip.actual_result === 1 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" /> Trafione
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-300/30 bg-rose-300/10 px-3 py-1 text-xs font-semibold text-rose-200">
              <XCircle className="h-3.5 w-3.5" /> Pudło
            </span>
          ))}
      </div>

      <div className="relative mt-5 grid grid-cols-3 gap-3 text-center">
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

      <div className="relative mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-white/45">Q-Score</span>
          <span className={`font-semibold ${qScoreColor(tip.q_score)}`}>{tip.q_score}/100</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className={`h-full rounded-full ${qScoreBar(tip.q_score)}`} style={{ width: `${tip.q_score}%` }} />
        </div>
      </div>
    </article>
  )
}
