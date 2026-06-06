import "server-only"
import type { Scorer, StandingRow } from "./extra-types"
import { isOracleConfigured, oracleFetch } from "./oracle"
import { adaptScorers, adaptStandings } from "./oracle-map"

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
