import Link from "next/link"
import type { BetType } from "@/lib/types"
import type { MatchDetailed, MatchPrediction } from "@/lib/extra-types"
import { BET_TYPE_PL, BET_TYPE_SHORT } from "@/lib/labels"
import { FormPanel } from "./form-panel"
import { H2HBars, LazyMount, RadarCompare, ScoreDistribution } from "./match-charts"

const ACCENT: Record<BetType, { border: string; text: string; bar: string }> = {
  BTTS: { border: "border-l-emerald-400", text: "text-emerald-300", bar: "bg-emerald-400" },
  OVER_1_5: { border: "border-l-cyan-400", text: "text-cyan-300", bar: "bg-cyan-400" },
  MIX: { border: "border-l-violet-400", text: "text-violet-300", bar: "bg-violet-400" },
  THRILLER: { border: "border-l-amber-400", text: "text-amber-300", bar: "bg-amber-400" },
}

function fmtDate(iso: string): string {
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

function StatusBadge({ status }: { status: MatchDetailed["status"] }) {
  if (status === "live")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300/30 bg-rose-300/10 px-3 py-1 text-xs font-semibold text-rose-200">
        <span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" /> LIVE
      </span>
    )
  if (status === "finished")
    return (
      <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-medium text-white/55">
        zakończony
      </span>
    )
  return (
    <span className="rounded-full border border-[color:var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-xs font-medium text-white/80">
      oczekuje
    </span>
  )
}

function TeamName({ name, id }: { name: string; id: string | number | null }) {
  if (id == null) return <>{name}</>
  return (
    <Link href={`/druzyna/${id}`} className="transition hover:text-[color:var(--accent)] hover:underline">
      {name}
    </Link>
  )
}

function PredictionCard({ p }: { p: MatchPrediction }) {
  const a = ACCENT[p.bet_type]
  return (
    <div className={`rounded-[1.4rem] border border-l-4 border-white/12 ${a.border} bg-white/[0.05] p-5 backdrop-blur`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{BET_TYPE_PL[p.bet_type]}</span>
        <span className={`text-xs font-semibold ${a.text}`}>{BET_TYPE_SHORT[p.bet_type]}</span>
      </div>
      <p className="mt-1 text-sm text-white/55">Typ: {p.bet_side}</p>

      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-white/45">Q-Score</span>
          <span className={`font-semibold ${a.text}`}>{p.q_score}/100</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <span className={`block h-full rounded-full ${a.bar}`} style={{ width: `${p.q_score}%` }} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
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
      </div>
    </div>
  )
}

export function MatchDetail({ match }: { match: MatchDetailed }) {
  const hasThriller = match.predictions.some((p) => p.bet_type === "THRILLER")
  const s = match.h2h_summary

  return (
    <div>
      {/* 1. nagłówek */}
      <div className="mb-8 rounded-[2rem] border border-white/12 bg-white/[0.05] p-7 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs uppercase tracking-[0.2em] text-white/45">{match.league}</span>
          <StatusBadge status={match.status} />
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          <TeamName name={match.home} id={match.home_id} /> <span className="text-white/35">vs</span>{" "}
          <TeamName name={match.away} id={match.away_id} />
        </h1>
        <p className="mt-2 capitalize text-white/55">{fmtDate(match.kickoff_utc)}</p>
        {match.stadium && <p className="mt-1 text-sm text-white/45">🏟 {match.stadium}</p>}
      </div>

      {/* 2. predykcje */}
      <h2 className="mb-4 text-2xl font-semibold">Predykcje</h2>
      {match.predictions.length === 0 ? (
        <p className="mb-10 rounded-2xl border border-white/12 bg-white/[0.04] p-6 text-white/55">Brak predykcji.</p>
      ) : (
        <div className="mb-10 grid gap-4 sm:grid-cols-2">
          {match.predictions.map((p, i) => (
            <PredictionCard key={i} p={p} />
          ))}
        </div>
      )}

      {/* 3. statystyki obu drużyn (wykresy) */}
      {match.home_metrics && match.away_metrics && (
        <>
          <h2 className="mb-4 text-2xl font-semibold">Statystyki obu drużyn</h2>
          <div className="mb-10 grid gap-5 lg:grid-cols-2">
            <div className="rounded-[1.6rem] border border-white/12 bg-white/[0.04] p-5">
              <p className="mb-2 text-sm text-white/55">Porównanie (radar)</p>
              <LazyMount height={320}>
                <RadarCompare home={match.home_metrics} away={match.away_metrics} />
              </LazyMount>
              <div className="mt-2 flex justify-center gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan-300" />{match.home}</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-300" />{match.away}</span>
              </div>
            </div>
            <div className="rounded-[1.6rem] border border-white/12 bg-white/[0.04] p-5">
              <p className="mb-2 text-sm text-white/55">Bezpośrednie porównanie</p>
              <LazyMount height={320}>
                <H2HBars home={match.home_metrics} away={match.away_metrics} />
              </LazyMount>
            </div>
          </div>
        </>
      )}

      {/* 4. forma */}
      <h2 className="mb-4 text-2xl font-semibold">Forma</h2>
      <div className="mb-10 grid gap-4 md:grid-cols-2">
        <FormPanel teamId={match.home_id} teamName={match.home} />
        <FormPanel teamId={match.away_id} teamName={match.away} />
      </div>

      {/* 5. H2H historia */}
      {match.h2h_matches.length > 0 && (
        <>
          <h2 className="mb-4 text-2xl font-semibold">H2H — historia</h2>
          {s && (
            <p className="mb-3 text-sm text-white/60">
              {match.home}: <span className="font-semibold text-emerald-300">{s.home_wins}</span> ·{" "}
              remisy: <span className="font-semibold">{s.draws}</span> · {match.away}:{" "}
              <span className="font-semibold text-emerald-300">{s.away_wins}</span>
              {s.btts_pct != null && <> · BTTS {s.btts_pct}%</>}
              {s.avg_goals != null && <> · śr. {s.avg_goals} gola</>}
            </p>
          )}
          <div className="mb-10 overflow-hidden rounded-[1.4rem] border border-white/12 bg-white/[0.04]">
            {match.h2h_matches.slice(0, 10).map((g, i) => (
              <div key={i} className="flex items-center justify-between gap-3 border-b border-white/5 px-5 py-3 text-sm last:border-0">
                <span className="w-24 shrink-0 text-white/45">{g.date?.slice(0, 10)}</span>
                <span className="flex-1 truncate text-white/80">
                  {g.home} <span className="text-white/35">vs</span> {g.away}
                </span>
                <span className="shrink-0 font-semibold">{g.score}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 6. rozkład wyników */}
      {match.score_distribution.length > 0 && (
        <>
          <h2 className="mb-2 text-2xl font-semibold">Rozkład wyników</h2>
          {hasThriller && (
            <p className="mb-3 text-sm text-amber-200/80">Wyniki 3:2 / 2:3 (Thriller) podświetlone.</p>
          )}
          <div className="mb-10 rounded-[1.6rem] border border-white/12 bg-white/[0.04] p-5">
            <LazyMount height={288}>
              <ScoreDistribution data={match.score_distribution} highlightThriller={hasThriller} />
            </LazyMount>
          </div>
        </>
      )}

      {/* 7. strzelcy */}
      {(match.home_scorers.length > 0 || match.away_scorers.length > 0) && (
        <>
          <h2 className="mb-4 text-2xl font-semibold">Strzelcy</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { team: match.home, id: match.home_id, list: match.home_scorers },
              { team: match.away, id: match.away_id, list: match.away_scorers },
            ].map((side, idx) => (
              <div key={idx} className="rounded-[1.4rem] border border-white/12 bg-white/[0.04] p-5">
                <h3 className="mb-3 font-semibold">
                  <TeamName name={side.team} id={side.id} />
                </h3>
                {side.list.length === 0 ? (
                  <p className="text-sm text-white/45">Brak danych.</p>
                ) : (
                  <div className="space-y-2">
                    {side.list.slice(0, 3).map((sc, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span>{sc.player}</span>
                        <span className="text-white/60">
                          <span className="font-semibold text-[color:var(--accent)]">{sc.goals}</span> gol(i)
                          {sc.assists ? ` · ${sc.assists} as.` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
