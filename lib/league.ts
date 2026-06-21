import "server-only"
import type { LeagueFormRow, Scorer, StandingRow } from "./extra-types"
import { isOracleConfigured, oracleFetch } from "./oracle"
import { adaptLeagueLogo, adaptScorers, adaptStandings } from "./oracle-map"
import { getTeamForm } from "./form"
import { formMarkets } from "./tip-utils"

export async function getStandings(code: string): Promise<StandingRow[]> {
  if (!isOracleConfigured()) return []
  try {
    const data = await oracleFetch<unknown>(`/league/${encodeURIComponent(code)}/standings`)
    return adaptStandings(data)
  } catch (err) {
    console.error("getStandings: Oracle niedostępne →", err)
    return []
  }
}

// Tabela + logo ligi (gdy Oracle je zwraca w nagłówku).
export async function getStandingsWithMeta(
  code: string,
): Promise<{ standings: StandingRow[]; leagueLogo: string | null }> {
  if (!isOracleConfigured()) return { standings: [], leagueLogo: null }
  try {
    const data = await oracleFetch<unknown>(`/league/${encodeURIComponent(code)}/standings`)
    return { standings: adaptStandings(data), leagueLogo: adaptLeagueLogo(data) }
  } catch (err) {
    console.error("getStandingsWithMeta: Oracle niedostępne →", err)
    return { standings: [], leagueLogo: null }
  }
}

export async function getScorers(code: string): Promise<Scorer[]> {
  if (!isOracleConfigured()) return []
  try {
    const data = await oracleFetch<unknown>(`/league/${encodeURIComponent(code)}/scorers`)
    return adaptScorers(data)
  } catch (err) {
    console.error("getScorers: Oracle niedostępne →", err)
    return []
  }
}

// Forma drużyn w lidze: standings → forma per drużyna (równolegle, cap 24 by nie obciążać).
function mockLeagueForm(): LeagueFormRow[] {
  const teams = ["FC Tokyo", "Kashima Antlers", "Urawa Reds", "Gamba Osaka", "Cerezo Osaka", "Vissel Kobe"]
  return teams.map((team, i) => ({
    team_id: 1000 + i,
    team,
    results: (["W", "W", "D", "L", "W", "D", "W", "L", "W", "D", "W", "W", "L", "D", "W"] as const)
      .slice(0, 5 + ((i * 3) % 11))
      .map((r) => r),
    gf: 8 + i,
    ga: 4 + ((i * 2) % 6),
    btts_pct: 45 + ((i * 9) % 40),
    over15_pct: 60 + ((i * 7) % 35),
  }))
}

export async function getLeagueForm(code: string, count: number): Promise<LeagueFormRow[]> {
  if (!isOracleConfigured()) return mockLeagueForm()
  const standings = await getStandings(code)
  const top = standings.filter((r) => r.team_id != null).slice(0, 24)
  const rows = await Promise.all(
    top.map(async (r) => {
      try {
        const f = await getTeamForm(String(r.team_id), "all", count)
        const ms = f.matches
        const withGoals = ms.filter((m) => m.gf != null && m.ga != null)
        const n = withGoals.length
        const gf = withGoals.reduce((a, m) => a + (m.gf ?? 0), 0)
        const ga = withGoals.reduce((a, m) => a + (m.ga ?? 0), 0)
        const btts = withGoals.filter((m) => formMarkets(m.gf, m.ga)?.btts).length
        const o15 = withGoals.filter((m) => formMarkets(m.gf, m.ga)?.over15).length
        return {
          team_id: r.team_id,
          team: r.team,
          results: ms.map((m) => m.result),
          gf: n ? gf : undefined,
          ga: n ? ga : undefined,
          btts_pct: n ? Math.round((btts / n) * 100) : null,
          over15_pct: n ? Math.round((o15 / n) * 100) : null,
        }
      } catch {
        return { team_id: r.team_id, team: r.team, results: [] }
      }
    }),
  )
  return rows
}
