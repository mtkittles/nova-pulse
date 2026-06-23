import type { StatsResponse } from "./stats-types"
import type { Tip } from "./types"
import { mockStats } from "./mock-stats"
import { isOracleConfigured, oracleFetch } from "./oracle"
import { adaptStats, adaptTips } from "./oracle-map"

function emptyStats(): StatsResponse {
  return {
    generated_at: new Date().toISOString(),
    range_days: 30,
    summary: {
      total_tips: 0,
      settled_tips: 0,
      wins: 0,
      losses: 0,
      win_rate: 0,
      roi: 0,
      current_streak: 0,
      avg_q_score: null,
    },
    timeline: [],
    by_market: [],
    by_league: [],
    q_score_buckets: [],
  }
}

function hasSummary(x: unknown): boolean {
  return !!x && typeof x === "object" && !!(x as { summary?: unknown }).summary
}

/** Ostatnie rozliczone typy (actual_result != null). Max `limit` rekordów. */
export async function getSettledTips(limit = 15): Promise<Tip[]> {
  if (!isOracleConfigured()) return []
  try {
    const today = new Date()
    const from = new Date(today)
    from.setDate(today.getDate() - 30)
    const fromStr = from.toISOString().slice(0, 10)
    const toStr = today.toISOString().slice(0, 10)
    const data = await oracleFetch<unknown>(`/tips?from_date=${fromStr}&to_date=${toStr}`, 0)
    const { tips } = adaptTips(data)
    return tips
      .filter((t) => t.actual_result !== null)
      .sort((a, b) => (b.kickoff_utc > a.kickoff_utc ? 1 : -1))
      .slice(0, limit)
  } catch (err) {
    console.error("getSettledTips: błąd →", err)
    return []
  }
}

// period: "7" | "30" | "all"
export async function getStats(period?: string): Promise<StatsResponse> {
  if (!isOracleConfigured()) return mockStats
  const path = period ? `/stats?period=${encodeURIComponent(period)}` : "/stats"
  try {
    const data = await oracleFetch<unknown>(path)
    console.log(`[oracle] /stats?period=${period ?? ""} raw:`, JSON.stringify(data).slice(0, 500))
    if (!hasSummary(data)) {
      console.error("getStats: odpowiedź Oracle niezgodna z kontraktem")
      return emptyStats()
    }
    return adaptStats(data)
  } catch (err) {
    console.error("getStats: Oracle niedostępne →", err)
    return emptyStats()
  }
}
