import "server-only"
import type { Scorer, StandingRow } from "./extra-types"
import { isOracleConfigured, oracleFetch } from "./oracle"
import { adaptScorers, adaptStandings } from "./oracle-map"

function isDev(): boolean {
  return process.env.NODE_ENV !== "production"
}

export async function getStandings(code: string): Promise<StandingRow[]> {
  if (!isOracleConfigured()) return []
  try {
    const data = await oracleFetch<unknown>(`/league/${encodeURIComponent(code)}/standings`)
    if (isDev()) console.log("[oracle] standings received")
    return adaptStandings(data)
  } catch (err) {
    console.error("getStandings: Oracle unavailable")
    if (isDev() && err instanceof Error) console.error(err.message)
    return []
  }
}

export async function getScorers(code: string): Promise<Scorer[]> {
  if (!isOracleConfigured()) return []
  try {
    const data = await oracleFetch<unknown>(`/league/${encodeURIComponent(code)}/scorers`)
    if (isDev()) console.log("[oracle] scorers received")
    return adaptScorers(data)
  } catch (err) {
    console.error("getScorers: Oracle unavailable")
    if (isDev() && err instanceof Error) console.error(err.message)
    return []
  }
}
