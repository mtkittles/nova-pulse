import "server-only"
import type { TeamSeason, UpcomingMatch } from "./extra-types"
import { isOracleConfigured, oracleFetch } from "./oracle"
import { adaptTeam, adaptUpcoming } from "./oracle-map"

function mockTeam(id: string): TeamSeason {
  return {
    team_id: id,
    name: "Kashima Antlers",
    league: "J1 League",
    country: "Japonia",
    logo: null,
    played: 38,
    wins: 23,
    draws: 7,
    losses: 8,
    gf: 58,
    ga: 31,
    btts_pct: 54,
    over15_pct: 82,
    over25_pct: 55,
    form: ["W", "W", "D", "L", "W", "W", "D", "W", "L", "W"],
    scorers: [
      { player: "Léo Ceará", team: "Kashima", goals: 21, assists: 3 },
      { player: "Yuma Suzuki", team: "Kashima", goals: 12, assists: 6 },
      { player: "Tomoya Inukai", team: "Kashima", goals: 5, assists: 2 },
    ],
  }
}

function mockUpcoming(): UpcomingMatch[] {
  const d = (o: number) => {
    const x = new Date()
    x.setDate(x.getDate() + o)
    return x.toISOString().slice(0, 16) + ":00Z"
  }
  return [
    {
      event_id: "u1",
      home: "Kashima",
      away: "Vissel Kobe",
      opponent: "Vissel Kobe",
      league: "J1 League",
      kickoff_utc: d(2),
      predictions: [
        { bet_type: "OVER_1_5", bet_side: "OVER", model_prob: 0.84, odds: 1.3, q_score: 88, edge: 0.07, actual_result: null },
        { bet_type: "BTTS", bet_side: "TAK", model_prob: 0.62, odds: 1.8, q_score: 61, edge: 0.01, actual_result: null },
      ],
    },
    {
      event_id: "u2",
      home: "Urawa Reds",
      away: "Kashima",
      opponent: "Urawa Reds",
      league: "J1 League",
      kickoff_utc: d(6),
      predictions: [
        { bet_type: "BTTS", bet_side: "TAK", model_prob: 0.71, odds: 1.7, q_score: 78, edge: 0.05, actual_result: null },
        { bet_type: "MIX", bet_side: "BTTS+O1.5", model_prob: 0.6, odds: 1.9, q_score: 55, edge: 0.02, actual_result: null },
      ],
    },
  ]
}

export async function getTeam(id: string): Promise<TeamSeason | null> {
  if (!isOracleConfigured()) return mockTeam(id)
  try {
    const data = await oracleFetch<unknown>(`/team/${encodeURIComponent(id)}`)
    console.log(`[oracle] /team/${id} raw:`, JSON.stringify(data).slice(0, 500))
    return adaptTeam(data)
  } catch (err) {
    console.error("getTeam: Oracle niedostępne →", err)
    return null
  }
}

export async function getTeamUpcoming(id: string): Promise<UpcomingMatch[]> {
  if (!isOracleConfigured()) return mockUpcoming()
  try {
    const data = await oracleFetch<unknown>(`/team/${encodeURIComponent(id)}/upcoming`)
    console.log(`[oracle] /team/${id}/upcoming raw:`, JSON.stringify(data).slice(0, 500))
    return adaptUpcoming(data)
  } catch (err) {
    console.error("getTeamUpcoming: Oracle niedostępne →", err)
    return []
  }
}
