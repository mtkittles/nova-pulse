"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { CalendarDays, MapPin } from "lucide-react"
import type { MatchDetailed, MatchPrediction } from "@/lib/extra-types"
import { MODE_META, flagForLeague } from "@/lib/design"
import { QRing } from "./ui/q-ring"
import { TeamCrest } from "./ui/team-crest"
import { CountUp } from "./ui/count-up"
import { FormPanel } from "./form-panel"
import {
  H2HBars,
  H2HOutcomeBar,
  LazyMount,
  RadarCompare,
  ScoreDistribution,
  ScoreHeatmap,
} from "./match-charts"

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

// Sekcja z animacją wejścia na scroll.
function Section({
  title,
  hint,
  children,
  delay = 0,
}: {
  title?: string
  hint?: string
  children: React.ReactNode
  delay?: number
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay }}
      className="mb-10"
    >
      {title && (
        <div className="mb-4">
          <h2 className="text-2xl font-semibold">{title}</h2>
          {hint && <p className="mt-1 text-sm text-white/60">{hint}</p>}
        </div>
      )}
      {children}
    </motion.section>
  )
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
      <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-medium text-white/60">
        zakończony
      </span>
    )
  return (
    <span className="rounded-full border border-[color:var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-xs font-medium text-white/80">
      oczekuje
    </span>
  )
}

function TeamSide({
  name,
  id,
  align,
}: {
  name: string
  id: string | number | null
  align: "left" | "right"
}) {
  const inner = (
    <span
      className={`flex flex-col items-center gap-2 ${
        align === "right" ? "sm:items-end" : "sm:items-start"
      }`}
    >
      <TeamCrest name={name} size={56} />
      <span className="text-center text-lg font-semibold leading-tight sm:text-left">{name}</span>
    </span>
  )
  if (id == null) return inner
  return (
    <Link
      href={`/druzyna/${id}`}
      className="transition hover:text-[color:var(--accent)]"
      aria-label={`Profil drużyny ${name}`}
    >
      {inner}
    </Link>
  )
}

function PredictionCard({ p, best }: { p: MatchPrediction; best: boolean }) {
  const mode = MODE_META[p.bet_type]
  return (
    <div
      className={`relative flex flex-col rounded-[1.5rem] border bg-white/[0.05] p-5 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/[0.08] ${
        best ? "border-[color:var(--accent)]/50 shadow-lg shadow-[color:var(--accent)]/5" : "border-white/12"
      }`}
    >
      {best && (
        <span className="absolute -top-2.5 left-5 rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[color:var(--on-accent)]">
          Rekomendacja
        </span>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${mode.badge}`}>
            {mode.short}
          </span>
          <p className="mt-2 text-sm text-white/60">{mode.full}</p>
          <p className="mt-0.5 text-sm font-medium text-white/85">Typ: {p.bet_side}</p>
        </div>
        <QRing value={p.q_score} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
          <p className="text-[11px] text-white/60">Prawd.</p>
          <CountUp to={p.model_prob * 100} suffix="%" className="mt-0.5 block font-semibold" />
        </div>
        <div className="rounded-xl border border-[color:var(--accent)]/40 bg-[var(--accent)]/10 p-2.5">
          <p className="text-[11px] text-white/70">Kurs</p>
          <CountUp to={p.odds} decimals={2} className="mt-0.5 block text-lg font-bold text-[color:var(--accent)]" />
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
          <p className="text-[11px] text-white/60">Edge</p>
          <CountUp
            to={p.edge * 100}
            decimals={1}
            prefix={p.edge >= 0 ? "+" : ""}
            suffix="%"
            className={`mt-0.5 block font-semibold ${p.edge >= 0 ? "text-emerald-300" : "text-rose-300"}`}
          />
        </div>
      </div>
    </div>
  )
}

export function MatchDetail({ match }: { match: MatchDetailed }) {
  const hasThriller = match.predictions.some((p) => p.bet_type === "THRILLER")
  const s = match.h2h_summary
  const flag = flagForLeague(match.league)

  // rekomendacja = najwyższy Q-Score
  let bestIdx = -1
  let bestQ = -1
  match.predictions.forEach((p, i) => {
    if (p.q_score > bestQ) {
      bestQ = p.q_score
      bestIdx = i
    }
  })

  return (
    <div>
      {/* 1. NAGŁÓWEK */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.05] p-6 backdrop-blur md:p-8"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/60">
            {flag && <span className="text-sm">{flag}</span>}
            {match.league}
          </span>
          <StatusBadge status={match.status} />
        </div>

        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <TeamSide name={match.home} id={match.home_id} align="right" />
          <span className="px-2 text-center text-sm font-medium text-white/45">vs</span>
          <TeamSide name={match.away} id={match.away_id} align="left" />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-sm text-white/60">
          <span className="flex items-center gap-1.5 capitalize">
            <CalendarDays className="h-4 w-4 text-[color:var(--accent)]" /> {fmtDate(match.kickoff_utc)}
          </span>
          {match.stadium && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-[color:var(--accent)]" /> {match.stadium}
            </span>
          )}
        </div>
      </motion.div>

      {/* 2. PREDYKCJE */}
      {match.predictions.length > 0 && (
        <Section title="Predykcje" hint="Wszystkie tryby — rekomendacja to najwyższy Q-Score.">
          <div className="grid gap-4 sm:grid-cols-2">
            {match.predictions.map((p, i) => (
              <PredictionCard key={i} p={p} best={i === bestIdx} />
            ))}
          </div>
        </Section>
      )}

      {/* 3. HEATMAPA WYNIKÓW */}
      {match.score_matrix && match.score_matrix.length > 0 ? (
        <Section
          title="Heatmapa wyników"
          hint="Rozkład prawdopodobieństwa wyniku z modelu Dixon-Coles."
        >
          <div className="rounded-[1.6rem] border border-white/12 bg-white/[0.04] p-5 md:p-6">
            <LazyMount height={320}>
              <ScoreHeatmap
                matrix={match.score_matrix}
                home={match.home}
                away={match.away}
                highlightThriller={hasThriller}
              />
            </LazyMount>
          </div>
        </Section>
      ) : match.score_distribution.length > 0 ? (
        <Section title="Rozkład wyników" hint={hasThriller ? "Wyniki 3:2 / 2:3 podświetlone." : undefined}>
          <div className="rounded-[1.6rem] border border-white/12 bg-white/[0.04] p-5">
            <LazyMount height={288}>
              <ScoreDistribution data={match.score_distribution} highlightThriller={hasThriller} />
            </LazyMount>
          </div>
        </Section>
      ) : null}

      {/* 4. RADAR + porównanie */}
      {match.home_metrics && match.away_metrics && (
        <Section title="Porównanie drużyn">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-[1.6rem] border border-white/12 bg-white/[0.04] p-5">
              <p className="mb-2 text-sm text-white/60">Radar — atak, obrona, BTTS, O1.5, czyste konta, forma</p>
              <LazyMount height={320}>
                <RadarCompare home={match.home_metrics} away={match.away_metrics} />
              </LazyMount>
              <div className="mt-2 flex justify-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-300" />
                  {match.home}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-violet-300" />
                  {match.away}
                </span>
              </div>
            </div>
            <div className="rounded-[1.6rem] border border-white/12 bg-white/[0.04] p-5">
              <p className="mb-2 text-sm text-white/60">Bezpośrednie porównanie metryk</p>
              <LazyMount height={320}>
                <H2HBars home={match.home_metrics} away={match.away_metrics} />
              </LazyMount>
            </div>
          </div>
        </Section>
      )}

      {/* 5. FORMA */}
      <Section title="Forma" hint="Przełącz zakres (5/10/15) oraz dom/wyjazd dla każdej drużyny.">
        <div className="grid gap-4 md:grid-cols-2">
          <FormPanel teamId={match.home_id} teamName={match.home} />
          <FormPanel teamId={match.away_id} teamName={match.away} />
        </div>
      </Section>

      {/* 6. H2H */}
      {match.h2h_matches.length > 0 && (
        <Section title="H2H — historia bezpośrednia">
          <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
            <div className="space-y-4 rounded-[1.6rem] border border-white/12 bg-white/[0.04] p-5">
              {s && (
                <H2HOutcomeBar
                  homeWins={s.home_wins}
                  draws={s.draws}
                  awayWins={s.away_wins}
                  home={match.home}
                  away={match.away}
                />
              )}
              {s && (
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <p className="text-[11px] text-white/60">BTTS w H2H</p>
                    <CountUp to={s.btts_pct ?? 0} suffix="%" className="mt-0.5 block text-xl font-semibold" />
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <p className="text-[11px] text-white/60">Śr. goli</p>
                    <CountUp to={s.avg_goals ?? 0} decimals={2} className="mt-0.5 block text-xl font-semibold" />
                  </div>
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-[1.6rem] border border-white/12 bg-white/[0.04]">
              {match.h2h_matches.slice(0, 10).map((g, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 border-b border-white/5 px-5 py-3 text-sm last:border-0"
                >
                  <span className="w-20 shrink-0 text-white/55">{g.date?.slice(0, 10)}</span>
                  <span className="flex-1 truncate text-white/80">
                    {g.home} <span className="text-white/45">vs</span> {g.away}
                  </span>
                  <span className="shrink-0 rounded-md bg-white/10 px-2 py-0.5 font-semibold">{g.score}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* 7. STRZELCY */}
      {(match.home_scorers.length > 0 || match.away_scorers.length > 0) && (
        <Section title="Strzelcy">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { team: match.home, id: match.home_id, list: match.home_scorers },
              { team: match.away, id: match.away_id, list: match.away_scorers },
            ].map((side, idx) => (
              <div key={idx} className="rounded-[1.5rem] border border-white/12 bg-white/[0.04] p-5">
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <TeamCrest name={side.team} size={24} />
                  {side.id != null ? (
                    <Link href={`/druzyna/${side.id}`} className="transition hover:text-[color:var(--accent)] hover:underline">
                      {side.team}
                    </Link>
                  ) : (
                    side.team
                  )}
                </h3>
                {side.list.length === 0 ? (
                  <p className="text-sm text-white/60">Brak danych.</p>
                ) : (
                  <div className="space-y-2">
                    {side.list.slice(0, 5).map((sc, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="truncate">{sc.player}</span>
                        <span className="shrink-0 text-white/60">
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
        </Section>
      )}
    </div>
  )
}
