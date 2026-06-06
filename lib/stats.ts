import type { StatsResponse } from "./stats-types"
import { mockStats } from "./mock-stats"
import { isOracleConfigured, oracleFetch } from "./oracle"
import { adaptStats } from "./oracle-map"

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
      avg_q_score: 0,
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

// Serwerowy punkt dostępu do agregatów skuteczności. Wyłącznie server-side.
// - Oracle skonfigurowane + poprawna odpowiedź → realne agregaty (mapowane adapterem)
// - Oracle niedostępne / zła odpowiedź → puste statystyki (NIE crash)
// - brak konfiguracji → dane testowe (podgląd działa bez Oracle)
export async function getStats(): Promise<StatsResponse> {
  if (!isOracleConfigured()) return mockStats
  try {
    const data = await oracleFetch<unknown>("/stats")
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
