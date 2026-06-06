"use client"

import { useEffect, useState } from "react"
import type { Scorer, StandingRow } from "@/lib/extra-types"

// Kody lig (styl football-data.org — używany przez bota). Dostosuj do realnych kodów API.
const LEAGUES = [
  { code: "PL", name: "Premier League" },
  { code: "PD", name: "La Liga" },
  { code: "SA", name: "Serie A" },
  { code: "BL1", name: "Bundesliga" },
  { code: "FL1", name: "Ligue 1" },
  { code: "DED", name: "Eredivisie" },
  { code: "PPL", name: "Primeira Liga" },
  { code: "ELC", name: "Championship" },
]

type Tab = "standings" | "scorers"

export function LigiView() {
  const [code, setCode] = useState(LEAGUES[0].code)
  const [tab, setTab] = useState<Tab>("standings")
  const [standings, setStandings] = useState<StandingRow[]>([])
  const [scorers, setScorers] = useState<Scorer[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    const url = tab === "standings" ? `/api/league/${code}/standings` : `/api/league/${code}/scorers`
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return
        if (tab === "standings") setStandings(Array.isArray(d?.standings) ? d.standings : [])
        else setScorers(Array.isArray(d?.scorers) ? d.scorers : [])
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [code, tab])

  const th = "px-3 py-2 text-left text-xs uppercase tracking-wide text-white/40"
  const td = "px-3 py-2.5"

  return (
    <div>
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Ligi</h1>
      <p className="mt-3 mb-6 text-white/55">Tabele i listy strzelców.</p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="rounded-full border border-white/12 bg-[var(--bg-soft)] px-4 py-2 text-sm text-white/80 outline-none focus:border-[color:var(--accent)]/40"
        >
          {LEAGUES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          {(["standings", "scorers"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                tab === t
                  ? "border-[color:var(--accent)]/40 bg-[var(--accent)]/15 text-white"
                  : "border-white/12 bg-white/[0.05] text-white/60 hover:bg-white/10"
              }`}
            >
              {t === "standings" ? "Tabela" : "Strzelcy"}
            </button>
          ))}
        </div>
      </div>

      <div className={`overflow-x-auto rounded-[1.6rem] border border-white/12 bg-white/[0.04] ${loading ? "opacity-50" : ""}`}>
        {tab === "standings" ? (
          standings.length === 0 ? (
            <p className="p-8 text-center text-white/55">{loading ? "Ładowanie…" : "Brak danych tabeli dla tej ligi."}</p>
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
                  <tr key={`${r.position}-${r.team}`} className="border-b border-white/5 last:border-0">
                    <td className={`${td} text-white/50`}>{r.position}</td>
                    <td className={`${td} font-medium`}>{r.team}</td>
                    <td className={td}>{r.played}</td>
                    <td className={`${td} font-semibold text-[color:var(--accent)]`}>{r.points}</td>
                    <td className={`${td} text-white/60`}>
                      {r.gf}:{r.ga}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : scorers.length === 0 ? (
          <p className="p-8 text-center text-white/55">{loading ? "Ładowanie…" : "Brak danych o strzelcach dla tej ligi."}</p>
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
              {scorers.map((sc, i) => (
                <tr key={`${sc.player}-${i}`} className="border-b border-white/5 last:border-0">
                  <td className={`${td} text-white/50`}>{i + 1}</td>
                  <td className={`${td} font-medium`}>{sc.player}</td>
                  <td className={`${td} text-white/60`}>{sc.team}</td>
                  <td className={`${td} font-semibold text-[color:var(--accent)]`}>{sc.goals}</td>
                  <td className={td}>{sc.assists}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-4 text-xs text-white/35">
        Kody lig dostroimy do realnych wartości API (z logów `/api/league/...`).
      </p>
    </div>
  )
}
