import type { MatchInfo } from "@/lib/extra-types"
import { BET_TYPE_PL, statusInfo } from "@/lib/labels"
import { FormPanel } from "./form-panel"

function formatDate(iso: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
  }).format(d)
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
      <p className="text-xs text-white/40">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  )
}

export function MatchDetail({ match }: { match: MatchInfo }) {
  const stats = [
    { label: "BTTS", value: match.btts_pct != null ? `${match.btts_pct}%` : "—" },
    { label: "Over 1.5", value: match.over15_pct != null ? `${match.over15_pct}%` : "—" },
    { label: "Over 2.5", value: match.over25_pct != null ? `${match.over25_pct}%` : "—" },
    { label: "Śr. goli", value: match.avg_goals != null ? match.avg_goals.toFixed(2) : "—" },
  ]

  return (
    <div>
      {/* nagłówek */}
      <div className="mb-8 rounded-[2rem] border border-white/12 bg-white/[0.05] p-7 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.2em] text-white/45">{match.league}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          {match.home} <span className="text-white/35">vs</span> {match.away}
        </h1>
        <p className="mt-2 capitalize text-white/55">{formatDate(match.kickoff_utc)}</p>
        {match.h2h != null && (
          <p className="mt-2 text-sm text-white/45">Mecze bezpośrednie (H2H): {match.h2h}</p>
        )}
      </div>

      {/* statystyki meczu */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Stat key={s.label} label={s.label} value={s.value} />
        ))}
      </div>

      {/* predykcje */}
      <h2 className="mb-4 text-2xl font-semibold">Predykcje</h2>
      {match.predictions.length === 0 ? (
        <p className="mb-8 rounded-2xl border border-white/12 bg-white/[0.04] p-6 text-white/55">
          Brak predykcji dla tego meczu.
        </p>
      ) : (
        <div className="mb-10 grid gap-4 md:grid-cols-2">
          {match.predictions.map((p, i) => {
            const st = statusInfo(p.actual_result)
            return (
              <div key={i} className="rounded-[1.6rem] border border-white/12 bg-white/[0.05] p-5 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{BET_TYPE_PL[p.bet_type]}</span>
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${st.classes}`}>{st.label}</span>
                </div>
                <p className="mt-1 text-sm text-white/55">Typ: {p.bet_side}</p>
                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-[11px] text-white/40">Prawd.</p>
                    <p className="font-semibold">{Math.round(p.model_prob * 100)}%</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-white/40">Kurs</p>
                    <p className="font-semibold">{p.odds.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-white/40">Edge</p>
                    <p className={`font-semibold ${p.edge >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                      {p.edge >= 0 ? "+" : ""}
                      {(p.edge * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-white/40">Q-Score</p>
                    <p className="font-semibold text-[color:var(--accent)]">{p.q_score}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* forma drużyn */}
      <h2 className="mb-4 text-2xl font-semibold">Forma drużyn</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <FormPanel teamId={match.home_id} teamName={match.home} />
        <FormPanel teamId={match.away_id} teamName={match.away} />
      </div>
    </div>
  )
}
