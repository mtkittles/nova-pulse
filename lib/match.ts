import "server-only"
import type { MatchInfo } from "./extra-types"
import { isOracleConfigured, oracleFetch } from "./oracle"
import { adaptMatch } from "./oracle-map"

function isDev(): boolean {
  return process.env.NODE_ENV !== "production"
}

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
    if (isDev()) console.log(`[oracle] /match/${id} received`)
    if (data && typeof data === "object" && (data as { found?: unknown }).found === false) {
      return notFound(id)
    }
    return adaptMatch(data)
  } catch (err) {
    console.error("getMatch: Oracle unavailable")
    if (isDev() && err instanceof Error) console.error(err.message)
    return notFound(id)
  }
}
