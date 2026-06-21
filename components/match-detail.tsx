"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowLeft, BarChart3, MapPin } from "lucide-react"
import type { MatchDetailed, MatchPrediction, OddsMarkets, SideStats } from "@/lib/extra-types"
import { getMarketLabel } from "@/lib/market-label"
import { getLeagueDisplayName } from "@/lib/leagues"
import { formatKickoff } from "@/lib/time"
import { findLive, mapLiveStatus, useLiveMatches } from "@/hooks/use-live-matches"
import { TeamBadge } from "./team-badge"
import { QScoreBreakdownCard } from "./q-score-breakdown"
import { StandingsTable } from "./standings-table"
import { TopScorers } from "./top-scorers"
import { FormPanel } from "./form-panel"
import { HomeAwayStats } from "./home-away-stats"
import { LazyMount, ScoreHeatmap } from "./match-charts"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { StatusPill } from "./ui/status-pill"
import { EmptyState } from "./ui/empty-state"
import { QScoreRing } from "./ui/q-score-ring"
import { MetricLabel, METRIC_HINTS } from "./ui/metric-tooltip"

// rynek wybrany przez bota → klucz siatki kursów (do podświetlenia)
function chosenMarketKey(p?: MatchPrediction): keyof OddsMarkets | null {
  if (!p) return null
  const bt = String(p.bet_type_raw ?? p.bet_type).toLowerCase().replace(/[^a-z0-9]/g, "")
  const side = String(p.bet_side_raw ?? p.bet_side).toLowerCase().replace(/[^a-z0-9]/g, "")
  if (bt.includes("btts")) return side === "no" || side === "nie" ? "btts_no" : "btts_yes"
  if (bt === "1" || (bt === "1x2" && side === "home")) return "home_win"
  if (bt === "x" || (bt === "1x2" && (side === "x" || side === "draw"))) return "draw"
  if (bt === "2" || (bt === "1x2" && side === "away")) return "away_win"
  if (bt === "o25" || bt === "over25") return "over25"
  if (bt === "o35" || bt === "over35") return "over35"
  if (bt.includes("thril") || bt.includes("exact") || bt.includes("32") || bt.includes("23"))
    return side.includes("23") ? "cs_23" : "cs_32"
  return null
}

const MARKET_CELLS: { key: keyof OddsMarkets; label: string; thriller?: boolean }[] = [
  { key: "btts_yes", label: "BTTS: Tak" },
  { key: "btts_no", label: "BTTS: Nie" },
  { key: "home_win", label: "1 · Gospodarz" },
  { key: "draw", label: "X · Remis" },
  { key: "away_win", label: "2 · Gość" },
  { key: "over25", label: "Over 2.5" },
  { key: "over35", label: "Over 3.5" },
  { key: "cs_32", label: "Thriller 3:2", thriller: true },
  { key: "cs_23", label: "Thriller 2:3", thriller: true },
]

function parseScore(s: string): [number, number] | null {
  const m = s.match(/(\d+)\s*[:\-]\s*(\d+)/)
  return m ? [Number(m[1]), Number(m[2])] : null
}

export function MatchDetail({
  match,
  homeSide,
  awaySide,
}: {
  match: MatchDetailed
  homeSide?: SideStats | null
  awaySide?: SideStats | null
}) {
  const reduce = useReducedMotion()
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(id)
  }, [])

  // status efektywny (live > status z Oracle)
  const { liveMatches } = useLiveMatches()
  const live = findLive(liveMatches, match.event_id)
  const liveSt = live ? mapLiveStatus(live.status_short) : null
  const status =
    liveSt === "live" || liveSt === "halftime" ? "live" : liveSt === "finished" ? "finished" : match.status
  const liveOn = status === "live"
  const finished = status === "finished"
  // Łańcuch fallbacku wyniku: 1) live (IN_PLAY) → 2) wynik końcowy z /detailed
  // → 3) wynik z predykcji (actual_*) → 4) null ("—"). Źródło prawdy po meczu = Oracle.
  const liveScore = live && live.home_score != null && live.away_score != null ? ([live.home_score, live.away_score] as const) : null
  const predScored = match.predictions.find((p) => p.actual_home_score != null && p.actual_away_score != null)
  const homeScore = liveScore?.[0] ?? match.home_score ?? predScored?.actual_home_score ?? null
  const awayScore = liveScore?.[1] ?? match.away_score ?? predScored?.actual_away_score ?? null
  const hasScore = homeScore != null && awayScore != null
  const minuteTxt = liveSt === "halftime" ? "PRZERWA" : live?.minute != null ? `${live.minute}'` : "LIVE"

  const leagueText = match.leagueCode ? getLeagueDisplayName(match.leagueCode) : match.league

  // rekomendacja = najwyższy Q-Score
  const best = match.predictions.reduce<MatchPrediction | undefined>(
    (acc, p) => ((p.q_score ?? -1) > (acc?.q_score ?? -1) ? p : acc),
    undefined,
  )
  const bestMarket = best ? getMarketLabel(best.bet_type_raw ?? best.bet_type, best.bet_side_raw ?? best.bet_side, match.home, match.away) : null
  const chosenKey = chosenMarketKey(best)
  const hasThriller = match.predictions.some((p) => chosenMarketKey(p) === "cs_32" || chosenMarketKey(p) === "cs_23")

  const reveal = (delay = 0) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.4, delay: reduce ? 0 : delay },
  })

  const om = match.odds_markets

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16">
      <Link href="/typy" className="mb-5 inline-flex items-center gap-2 text-sm text-[color:var(--text-secondary)] transition hover:text-[color:var(--text-primary)]">
        <ArrowLeft className="h-4 w-4" /> Wróć do typów
      </Link>

      {/* [A] SCOREBOARD */}
      <Card hover={false} className="mb-5">
        <div className="flex items-center justify-between gap-3">
          <span className="min-w-0 truncate text-xs uppercase tracking-[0.16em] text-[color:var(--text-secondary)]">{leagueText}</span>
          {liveOn ? (
            <StatusPill status="LIVE" />
          ) : finished ? (
            <Badge tone="neutral">Zakończony</Badge>
          ) : (
            <Badge tone="cyan">Nadchodzący</Badge>
          )}
        </div>

        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <TeamBadge teamName={match.home} logoUrl={match.homeLogo} size="md" />
            <span className="text-center text-base font-semibold leading-tight sm:text-right">{match.home}</span>
          </div>
          <div className="flex flex-col items-center px-2">
            {liveOn || finished ? (
              <span className={`text-3xl font-extrabold tnum ${liveOn ? "text-[color:var(--danger)]" : "text-[color:var(--text-primary)]"}`}>
                {hasScore ? `${homeScore} : ${awayScore}` : "—"}
              </span>
            ) : (
              <span className="whitespace-nowrap text-sm font-medium text-[color:var(--text-secondary)]">
                {formatKickoff(match.kickoff_utc)}
              </span>
            )}
            {liveOn && <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--danger)]">{minuteTxt}</span>}
          </div>
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <TeamBadge teamName={match.away} logoUrl={match.awayLogo} size="md" />
            <span className="text-center text-base font-semibold leading-tight sm:text-left">{match.away}</span>
          </div>
        </div>

        {match.stadium && (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[color:var(--text-muted)]">
            <MapPin className="h-3.5 w-3.5" /> {match.stadium}
          </p>
        )}
      </Card>

      {/* [B] PROGNOZA BOTA */}
      {best && bestMarket && (
        <motion.div {...reveal()} className="mb-5">
          <Card active className="overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${bestMarket.badge}`}>{bestMarket.short}</span>
                <p className="mt-2 text-sm font-medium text-[color:var(--text-primary)]">{bestMarket.full}</p>
                {best.actual_result != null && (
                  <div className="mt-2">
                    <StatusPill status={best.actual_result === 1 ? "WON" : "LOST"} />
                  </div>
                )}
              </div>
              <QScoreRing value={best.q_score} size={72} />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-2)] p-2.5">
                <MetricLabel label="Szansa modelu" hint={METRIC_HINTS.model} className="text-[11px] text-[color:var(--text-secondary)]" />
                <p className="mt-0.5 font-semibold tnum">{best.model_prob != null ? `${Math.round(best.model_prob * 100)}%` : "—"}</p>
              </div>
              <div className="rounded-xl border border-[color:var(--border-strong)] bg-[var(--cyan-soft)] p-2.5">
                <MetricLabel label="Kurs" hint={METRIC_HINTS.odds} className="text-[11px] text-[color:var(--text-secondary)]" />
                <p className="mt-0.5 text-lg font-bold text-[color:var(--cyan)] tnum">{best.odds != null ? best.odds.toFixed(2) : "—"}</p>
              </div>
              <div className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-2)] p-2.5">
                <MetricLabel label="Edge" hint={METRIC_HINTS.edge} className="text-[11px] text-[color:var(--text-secondary)]" />
                <p className={`mt-0.5 font-semibold tnum ${best.edge != null && best.edge >= 0 ? "text-[color:var(--success)]" : "text-[color:var(--danger)]"}`}>
                  {best.edge != null ? `${best.edge >= 0 ? "+" : ""}${(best.edge * 100).toFixed(1)}%` : "—"}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* [H] Q-SCORE BREAKDOWN — tylko gdy Oracle podał rozbicie */}
      {best?.q_score_breakdown && (
        <motion.div {...reveal(0.05)} className="mb-5">
          <QScoreBreakdownCard breakdown={best.q_score_breakdown} />
        </motion.div>
      )}

      {/* [C] KURSY RYNKÓW */}
      <motion.div {...reveal(0.05)} className="mb-5">
        <Card hover={false}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">Kursy rynków</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MARKET_CELLS.map((c) => {
              const val = om ? om[c.key] : null
              const chosen = chosenKey === c.key
              return (
                <div
                  key={c.key}
                  className={`rounded-xl border p-2.5 text-center ${chosen ? "border-[color:var(--border-strong)] bg-[var(--cyan-soft)]" : "border-[color:var(--border-soft)] bg-[var(--surface-2)]"}`}
                >
                  <p className="flex items-center justify-center gap-1 text-[11px] text-[color:var(--text-secondary)]">
                    {c.label}
                    {c.thriller && <Badge tone="warning" className="px-1.5 py-0">THR</Badge>}
                  </p>
                  <p className={`mt-0.5 text-lg font-bold tnum ${val == null ? "text-[color:var(--text-muted)]" : chosen ? "text-[color:var(--cyan)]" : "text-[color:var(--text-primary)]"}`}>
                    {val != null ? val.toFixed(2) : "—"}
                  </p>
                </div>
              )
            })}
          </div>
        </Card>
      </motion.div>

      {/* [D] HEATMAPA */}
      <motion.div {...reveal(0.05)} className="mb-5">
        <Card hover={false}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">Macierz wyników (model Poissona/Dixon-Coles)</h2>
          {match.score_matrix ? (
            <LazyMount height={360}>
              <ScoreHeatmap matrix={match.score_matrix} home={match.home} away={match.away} highlightThriller={hasThriller} />
            </LazyMount>
          ) : (
            <EmptyState icon={BarChart3} title="Brak macierzy" description="Dostępna tylko dla meczów z pełnym modelem (np. MŚ)." />
          )}
        </Card>
      </motion.div>

      {/* [E] FORMA (przełącznik 5/10/15 w FormPanel) */}
      <motion.div {...reveal(0.05)} className="mb-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">Forma — ostatnie mecze</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormPanel teamId={match.home_id} teamName={match.home} />
          <FormPanel teamId={match.away_id} teamName={match.away} />
        </div>
      </motion.div>

      {/* [J] STATYSTYKI DOM/WYJAZD — ukryte gdy brak splitu */}
      {(homeSide || awaySide) && (
        <motion.div {...reveal(0.05)} className="mb-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">Statystyki: forma u siebie / na wyjeździe</h2>
          <HomeAwayStats
            homeName={match.home}
            homeLogo={match.homeLogo}
            homeStats={homeSide}
            awayName={match.away}
            awayLogo={match.awayLogo}
            awayStats={awaySide}
          />
        </motion.div>
      )}

      {/* [F] H2H */}
      <motion.div {...reveal(0.05)}>
        <Card hover={false}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">Ostatnie spotkania (H2H)</h2>
          {match.h2h_matches.length === 0 ? (
            <EmptyState icon={BarChart3} title="Brak historycznych spotkań" description="Te drużyny nie grały ze sobą w dostępnym zakresie danych." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[color:var(--border-soft)] text-xs uppercase tracking-wide text-[color:var(--text-muted)]">
                  <tr>
                    <th className="px-2 py-2 text-left">Data</th>
                    <th className="px-2 py-2 text-left">Mecz</th>
                    <th className="px-2 py-2 text-right">Wynik</th>
                  </tr>
                </thead>
                <tbody>
                  {match.h2h_matches.slice(0, 5).map((h, i) => {
                    const sc = parseScore(h.score)
                    let tone = "text-[color:var(--text-primary)]"
                    if (sc) {
                      const homeIsCurrentHome = h.home === match.home
                      const myGoals = homeIsCurrentHome ? sc[0] : sc[1]
                      const oppGoals = homeIsCurrentHome ? sc[1] : sc[0]
                      tone = myGoals > oppGoals ? "text-[color:var(--cyan)]" : myGoals < oppGoals ? "text-[color:var(--danger)]" : "text-[color:var(--text-secondary)]"
                    }
                    return (
                      <tr key={i} className="border-b border-[color:var(--border-soft)] last:border-0">
                        <td className="whitespace-nowrap px-2 py-2 text-[color:var(--text-muted)] tnum">{h.date ? h.date.slice(0, 10) : "—"}</td>
                        <td className="px-2 py-2">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <TeamBadge teamName={h.home} size="sm" />
                            <span className="truncate text-[color:var(--text-secondary)]">{h.home}</span>
                            <span className="text-[color:var(--text-muted)]">–</span>
                            <TeamBadge teamName={h.away} size="sm" />
                            <span className="truncate text-[color:var(--text-secondary)]">{h.away}</span>
                          </span>
                        </td>
                        <td className={`whitespace-nowrap px-2 py-2 text-right font-bold tnum ${tone}`}>{h.score}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>

      {/* [G] TABELA LIGOWA — tylko gdy znamy kod ligi */}
      {match.leagueCode && (
        <motion.div {...reveal(0.05)} className="mt-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">Tabela ligowa</h2>
          <StandingsTable leagueCode={match.leagueCode} homeName={match.home} awayName={match.away} />
        </motion.div>
      )}

      {/* [I] TOP STRZELCY LIGI — tylko gdy znamy kod ligi (sekcja sama ukrywa się, gdy brak danych) */}
      {match.leagueCode && (
        <motion.div {...reveal(0.05)}>
          <TopScorers leagueCode={match.leagueCode} leagueName={leagueText} homeName={match.home} awayName={match.away} />
        </motion.div>
      )}
    </div>
  )
}
