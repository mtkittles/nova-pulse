import "server-only"
import type { LeagueFormRow, Scorer, StandingRow } from "./extra-types"
import { isOracleConfigured, oracleFetch } from "./oracle"
import { adaptScorers, adaptStandings } from "./oracle-map"
import { getTeamForm } from "./form"

export async function getStandings(code: string): Promise<StandingRow[]> {
  if (!isOracleConfigured()) return []
  try {
    const data = await oracleFetch<unknown>(`/league/${encodeURIComponent(code)}/standings`)
    console.log(`[oracle] /league/${code}/standings raw:`, JSON.stringify(data).slice(0, 400))
    return adaptStandings(data)
  } catch (err) {
    console.error("getStandings: Oracle niedostępne →", err)
    return []
  }
}

export async function getScorers(code: string): Promise<Scorer[]> {
  if (!isOracleConfigured()) return []
  try {
    const data = await oracleFetch<unknown>(`/league/${encodeURIComponent(code)}/scorers`)
    console.log(`[oracle] /league/${code}/scorers raw:`, JSON.stringify(data).slice(0, 400))
    return adaptScorers(data)
  } catch (err) {
    console.error("getScorers: Oracle niedostępne →", err)
    return []
  }
}

// Forma drużyn w lidze: standings → forma per drużyna (równolegle, cap 24 by nie obciążać).
export async function getLeagueForm(code: string, count: number): Promise<LeagueFormRow[]> {
  if (!isOracleConfigured()) return []
  const standings = await getStandings(code)
  const top = standings.filter((r) => r.team_id != null).slice(0, 24)
  const rows = await Promise.all(
    top.map(async (r) => {
      try {
        const f = await getTeamForm(String(r.team_id), "all", count)
        return { team_id: r.team_id, team: r.team, results: f.matches.map((m) => m.result) }
      } catch {
        return { team_id: r.team_id, team: r.team, results: [] }
      }
    }),
  )
  return rows
}
