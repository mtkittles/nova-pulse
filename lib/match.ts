import "server-only"
import type { MatchDetailed, MatchInfo } from "./extra-types"
import { isOracleConfigured, oracleFetch } from "./oracle"
import { adaptMatch, adaptMatchDetailed } from "./oracle-map"

function notFound(id: string): MatchInfo {
  return {
    found: false,
    event_id: id,
    home: "—",
    away: "—",
    league: "—",
    kickoff_utc: "",
    home_id: null,
    away_id: null,
    btts_pct: null,
    over15_pct: null,
    over25_pct: null,
    avg_goals: null,
    h2h: null,
    h2h_matches: [],
    predictions: [],
  }
}

export async function getMatch(id: string): Promise<MatchInfo> {
  if (!isOracleConfigured()) return notFound(id)
  try {
    const data = await oracleFetch<unknown>(`/match/${encodeURIComponent(id)}`)
    console.log(`[oracle] /match/${id} raw:`, JSON.stringify(data).slice(0, 600))
    if (data && typeof data === "object" && (data as { found?: unknown }).found === false) {
      return notFound(id)
    }
    return adaptMatch(data)
  } catch (err) {
    console.error("getMatch: Oracle niedostępne →", err)
    return notFound(id)
  }
}

function detailedNotFound(id: string): MatchDetailed {
  return {
    found: false, event_id: id, home: "—", away: "—", league: "—", kickoff_utc: "",
    stadium: null, status: "pending", home_id: null, away_id: null, predictions: [],
    home_metrics: null, away_metrics: null, h2h_matches: [], h2h_summary: null,
    score_distribution: [], score_matrix: null, home_scorers: [], away_scorers: [],
  }
}

// Macierz Poissona 6×6 (przybliżenie Dixon-Coles) na potrzeby danych testowych.
function poissonMatrix(lh: number, la: number, size = 6): number[][] {
  const pois = (k: number, l: number) => (Math.exp(-l) * Math.pow(l, k)) / factorial(k)
  const m = Array.from({ length: size }, (_, i) =>
    Array.from({ length: size }, (_, j) => pois(i, lh) * pois(j, la)),
  )
  const total = m.reduce((s, row) => s + row.reduce((a, b) => a + b, 0), 0)
  return m.map((row) => row.map((v) => v / total))
}
function factorial(n: number): number {
  let r = 1
  for (let i = 2; i <= n; i++) r *= i
  return r
}

function mockDetailed(id: string): MatchDetailed {
  return {
    found: true, event_id: id, home: "FC Tokyo", away: "Cerezo Osaka", league: "J1 League",
    kickoff_utc: new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 16) + ":00Z",
    stadium: "Ajinomoto Stadium", status: "pending", home_id: 101, away_id: 202,
    predictions: [
      { bet_type: "OVER_1_5", bet_side: "O1.5", model_prob: 0.84, odds: 1.3, q_score: 88, edge: 0.06, actual_result: null },
      { bet_type: "BTTS", bet_side: "TAK", model_prob: 0.66, odds: 1.8, q_score: 71, edge: 0.02, actual_result: null },
      { bet_type: "MIX", bet_side: "BTTS+O1.5", model_prob: 0.6, odds: 1.9, q_score: 63, edge: 0.04, actual_result: null },
      { bet_type: "THRILLER", bet_side: "3:2 / 2:3", model_prob: 0.06, odds: 21, q_score: 58, edge: 0.1, actual_result: null },
    ],
    home_metrics: { name: "FC Tokyo", gf_avg: 1.8, ga_avg: 1.1, btts_pct: 58, over15_pct: 82, clean_sheets_pct: 32, form_points: 73 },
    away_metrics: { name: "Cerezo Osaka", gf_avg: 1.5, ga_avg: 1.3, btts_pct: 61, over15_pct: 78, clean_sheets_pct: 26, form_points: 60 },
    h2h_matches: [
      { home: "FC Tokyo", away: "Cerezo Osaka", score: "2:1", date: "2025-09-14" },
      { home: "Cerezo Osaka", away: "FC Tokyo", score: "1:1", date: "2025-04-20" },
      { home: "FC Tokyo", away: "Cerezo Osaka", score: "3:2", date: "2024-10-05" },
      { home: "Cerezo Osaka", away: "FC Tokyo", score: "0:2", date: "2024-05-11" },
      { home: "FC Tokyo", away: "Cerezo Osaka", score: "1:0", date: "2023-11-25" },
    ],
    h2h_summary: { home_wins: 3, away_wins: 1, draws: 1, btts_pct: 60, avg_goals: 2.6 },
    score_distribution: [
      { score: "0:0", count: 2 }, { score: "1:0", count: 5 }, { score: "1:1", count: 7 },
      { score: "2:0", count: 4 }, { score: "2:1", count: 8 }, { score: "2:2", count: 3 },
      { score: "3:1", count: 2 }, { score: "3:2", count: 4 }, { score: "2:3", count: 1 },
    ],
    score_matrix: poissonMatrix(1.8, 1.3),
    home_scorers: [
      { player: "Diego Oliveira", team: "FC Tokyo", goals: 14, assists: 3 },
      { player: "Ryotaro Araki", team: "FC Tokyo", goals: 8, assists: 5 },
      { player: "Kuryu Matsuki", team: "FC Tokyo", goals: 6, assists: 4 },
    ],
    away_scorers: [
      { player: "Capixaba", team: "Cerezo Osaka", goals: 11, assists: 2 },
      { player: "Ryo Hatsuse", team: "Cerezo Osaka", goals: 7, assists: 6 },
      { player: "Hinata Kida", team: "Cerezo Osaka", goals: 5, assists: 3 },
    ],
  }
}

export async function getMatchDetailed(id: string): Promise<MatchDetailed> {
  if (!isOracleConfigured()) return mockDetailed(id)
  try {
    const data = await oracleFetch<unknown>(`/match/${encodeURIComponent(id)}/detailed`)
    console.log(`[oracle] /match/${id}/detailed raw:`, JSON.stringify(data).slice(0, 800))
    if (data && typeof data === "object" && (data as { found?: unknown }).found === false) {
      return detailedNotFound(id)
    }
    return adaptMatchDetailed(data)
  } catch (err) {
    console.error("getMatchDetailed: Oracle niedostępne →", err)
    return detailedNotFound(id)
  }
}
