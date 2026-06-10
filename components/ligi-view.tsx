"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Activity, BarChart3, Goal, Table2 } from "lucide-react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { LeagueFormRow, Scorer, StandingRow } from "@/lib/extra-types"
import { LEAGUES } from "@/lib/leagues"
import { FormSquares, formPoints } from "./form-squares"
import { AnimatedTabs } from "./ui/tabs"

type Tab = "standings" | "scorers" | "form" | "stats"

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim()
}

export function LigiView() {
  const [code, setCode] = useState(LEAGUES[0].code)
  const [tab, setTab] = useState<Tab>("standings")
  const [count, setCount] = useState(5)
  const [formSort, setFormSort] = useState<"best" | "worst">("best")

  const [standings, setStandings] = useState<StandingRow[]>([])
  const [scorers, setScorers] = useState<Scorer[]>([])
  const [formRows, setFormRows] = useState<LeagueFormRow[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // standings — zawsze (także do mapy nazwa→id dla strzelców)
  useEffect(() => {
    let active = true
    fetch(`/api/league/${code}/standings`)
      .then((r) => r.json())
      .then((d) => active && setStandings(Array.isArray(d?.standings) ? d.standings : []))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [code])

  // dane aktywnej zakładki
  useEffect(() => {
    let active = true
    if (tab === "standings") return
    setLoading(true)
    const url = tab === "scorers" ? `/api/league/${code}/scorers` : `/api/league/${code}/form?count=${count}`
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return
        if (tab === "scorers") setScorers(Array.isArray(d?.scorers) ? d.scorers : [])
        else setFormRows(Array.isArray(d?.rows) ? d.rows : [])
      })
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [code, tab, count])

  // mapa nazwa → team_id (dla klikalnych strzelców)
  const idByName = useMemo(() => {
    const m = new Map<string, string | number>()
    for (const r of standings) if (r.team_id != null) m.set(norm(r.team), r.team_id)
    return m
  }, [standings])

  const sortedForm = useMemo(() => {
    const arr = [...formRows]
    arr.sort((a, b) => {
      const d = formPoints(b.results) - formPoints(a.results)
      return formSort === "best" ? d : -d
    })
    return arr
  }, [formRows, formSort])

  // statystyki ligi liczone z tabeli (jedyne pełne dane, jakie mamy)
  const leagueStats = useMemo(() => {
    const teams = standings.length
    const totalPlayed = standings.reduce((a, r) => a + r.played, 0)
    const totalGoals = standings.reduce((a, r) => a + r.gf, 0)
    const matches = Math.round(totalPlayed / 2)
    const avgGoals = totalPlayed > 0 ? (2 * totalGoals) / totalPlayed : 0
    const topScoring = [...standings]
      .sort((a, b) => b.gf - a.gf)
      .slice(0, 5)
      .map((r) => ({ team: r.team.length > 14 ? r.team.slice(0, 13) + "…" : r.team, gf: r.gf }))
    const bestDefense = [...standings].sort((a, b) => a.ga - b.ga).slice(0, 5)
    return { teams, matches, avgGoals, topScoring, bestDefense }
  }, [standings])

  const th = "px-3 py-2 text-left text-xs uppercase tracking-wide text-white/60"
  const td = "px-3 py-2.5"
  const teamLink = "font-medium text-white transition hover:text-[color:var(--accent)] hover:underline"

  function Skeleton() {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-9 animate-pulse rounded-lg bg-white/[0.05]" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Ligi</h1>
      <p className="mt-3 mb-6 text-white/55">Tabele, strzelcy i forma drużyn.</p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={code}
          onChange={(e) => setCode(e.target.value)}
          aria-label="Wybierz ligę"
          className="rounded-full border border-white/12 bg-[var(--bg-soft)] px-4 py-2 text-sm text-white/80 outline-none focus:border-[color:var(--accent)]/40"
        >
          {LEAGUES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name} ({l.country})
            </option>
          ))}
        </select>

        <AnimatedTabs
          groupId="ligi-tabs"
          value={tab}
          onChange={(k) => setTab(k as Tab)}
          items={[
            { key: "standings", label: "Tabela", icon: Table2 },
            { key: "scorers", label: "Strzelcy", icon: Goal },
            { key: "form", label: "Forma", icon: Activity },
            { key: "stats", label: "Statystyki", icon: BarChart3 },
          ]}
        />

        {tab === "form" && (
          <div className="flex flex-wrap gap-2">
            {[5, 10, 15].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCount(c)}
                className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                  count === c
                    ? "border-[color:var(--accent)]/40 bg-[var(--accent)]/15 text-white"
                    : "border-white/12 bg-white/[0.05] text-white/55 hover:bg-white/10"
                }`}
              >
                {c}
              </button>
            ))}
            <select
              value={formSort}
              onChange={(e) => setFormSort(e.target.value as "best" | "worst")}
              aria-label="Sortowanie formy"
              className="rounded-full border border-white/12 bg-[var(--bg-soft)] px-4 py-2 text-sm text-white/80 outline-none"
            >
              <option value="best">Najlepsza forma</option>
              <option value="worst">Najgorsza forma</option>
            </select>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-[1.6rem] border border-white/12 bg-white/[0.04]">
        {/* TABELA */}
        {tab === "standings" &&
          (standings.length === 0 ? (
            <p className="p-8 text-center text-white/55">Brak danych tabeli dla tej ligi.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr>
                  <th className={th}>#</th>
                  <th className={th}>Drużyna</th>
                  <th className={th}>M</th>
                  <th className={th}>Pkt</th>
                  <th className={th}>Bramki</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((r) => (
                  <tr key={`${r.position}-${r.team}`} className="border-b border-white/5 transition last:border-0 hover:bg-white/[0.03]">
                    <td className={`${td} text-white/50`}>{r.position}</td>
                    <td className={td}>
                      {r.team_id != null ? (
                        <Link href={`/druzyna/${r.team_id}`} className={teamLink}>
                          {r.team}
                        </Link>
                      ) : (
                        <span className="font-medium">{r.team}</span>
                      )}
                    </td>
                    <td className={td}>{r.played}</td>
                    <td className={`${td} font-semibold text-[color:var(--accent)]`}>{r.points}</td>
                    <td className={`${td} text-white/60`}>
                      {r.gf}:{r.ga}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

        {/* STRZELCY */}
        {tab === "scorers" &&
          (loading ? (
            <Skeleton />
          ) : scorers.length === 0 ? (
            <p className="p-8 text-center text-white/55">Brak danych o strzelcach dla tej ligi.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr>
                  <th className={th}>#</th>
                  <th className={th}>Zawodnik</th>
                  <th className={th}>Drużyna</th>
                  <th className={th}>Gole</th>
                  <th className={th}>Asysty</th>
                </tr>
              </thead>
              <tbody>
                {scorers.map((sc, i) => {
                  const tid = idByName.get(norm(sc.team))
                  return (
                    <tr key={`${sc.player}-${i}`} className="border-b border-white/5 transition last:border-0 hover:bg-white/[0.03]">
                      <td className={`${td} text-white/50`}>{i + 1}</td>
                      <td className={`${td} font-medium`}>{sc.player}</td>
                      <td className={`${td} text-white/60`}>
                        {tid != null ? (
                          <Link href={`/druzyna/${tid}`} className={teamLink}>
                            {sc.team}
                          </Link>
                        ) : (
                          sc.team
                        )}
                      </td>
                      <td className={`${td} font-semibold text-[color:var(--accent)]`}>{sc.goals}</td>
                      <td className={td}>{sc.assists}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ))}

        {/* FORMA */}
        {tab === "form" &&
          (loading ? (
            <Skeleton />
          ) : sortedForm.length === 0 ? (
            <p className="p-8 text-center text-white/55">Brak danych o formie dla tej ligi.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr>
                  <th className={th}>Drużyna</th>
                  <th className={th}>Forma (ostatnie {count})</th>
                </tr>
              </thead>
              <tbody>
                {sortedForm.map((r) => (
                  <tr key={String(r.team_id)} className="border-b border-white/5 transition last:border-0 hover:bg-white/[0.03]">
                    <td className={td}>
                      {r.team_id != null ? (
                        <Link href={`/druzyna/${r.team_id}`} className={teamLink}>
                          {r.team}
                        </Link>
                      ) : (
                        <span className="font-medium">{r.team}</span>
                      )}
                    </td>
                    <td className={td}>
                      <FormSquares results={r.results} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

        {/* STATYSTYKI */}
        {tab === "stats" &&
          (standings.length === 0 ? (
            <p className="p-8 text-center text-white/55">
              Brak danych historycznych dla tej ligi w aktualnym źródle danych.
            </p>
          ) : (
            <div className="space-y-5 p-5">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
                  <p className="text-xs text-white/60">Śr. goli / mecz</p>
                  <p className="mt-1 text-2xl font-semibold text-[color:var(--accent)]">
                    {leagueStats.avgGoals.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
                  <p className="text-xs text-white/60">Drużyny</p>
                  <p className="mt-1 text-2xl font-semibold">{leagueStats.teams}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
                  <p className="text-xs text-white/60">Rozegrane mecze</p>
                  <p className="mt-1 text-2xl font-semibold">{leagueStats.matches}</p>
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm text-white/60">Top 5 drużyn — gole zdobyte</p>
                <div className="h-56 w-full">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={leagueStats.topScoring} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                        <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={false} />
                        <XAxis type="number" stroke="rgba(255,255,255,0.45)" tick={{ fontSize: 11 }} allowDecimals={false} />
                        <YAxis type="category" dataKey="team" stroke="rgba(255,255,255,0.45)" tick={{ fontSize: 11 }} width={110} />
                        <Tooltip
                          cursor={{ fill: "rgba(255,255,255,0.04)" }}
                          contentStyle={{ background: "#10111d", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.75rem", color: "#fff" }}
                        />
                        <Bar dataKey="gf" name="Gole" fill="#67e8f9" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={700} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm text-white/60">Najlepsza obrona</p>
                <div className="flex flex-wrap gap-2">
                  {leagueStats.bestDefense.map((r) => (
                    <span key={r.team} className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 text-sm">
                      {r.team} <span className="text-white/55">· {r.ga}</span>
                    </span>
                  ))}
                </div>
              </div>

              <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/55">
                Statystyki rynkowe per drużyna (%BTTS, %Team O1.5, %O2.5) nie są dostępne w
                aktualnym źródle danych ligi — pojawią się, gdy Oracle udostępni agregaty rynkowe.
              </p>
            </div>
          ))}
      </div>
    </div>
  )
}
