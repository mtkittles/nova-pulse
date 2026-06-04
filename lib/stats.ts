import type { StatsResponse } from "./stats-types"
import { mockStats } from "./mock-stats"
import { isOracleConfigured, oracleFetch } from "./oracle"

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

// Sprawdza, czy odpowiedź Oracle pasuje do kontraktu (chroni przed crashem,
// gdy endpoint zwróci błąd/inny kształt jako 200).
function isValidStats(x: unknown): x is StatsResponse {
  if (!x || typeof x !== "object") return false
  const o = x as Record<string, unknown>
  const s = o.summary as Record<string, unknown> | undefined
  return (
    !!s &&
    typeof s.win_rate === "number" &&
    Array.isArray(o.timeline) &&
    Array.isArray(o.by_market) &&
    Array.isArray(o.by_league) &&
    Array.isArray(o.q_score_buckets)
  )
}

// Serwerowy punkt dostępu do agregatów skuteczności. Wyłącznie server-side.
// - Oracle skonfigurowane + poprawna odpowiedź → realne agregaty
// - Oracle niedostępne / zła odpowiedź → puste statystyki (NIE crash)
// - brak konfiguracji → dane testowe (podgląd działa bez Oracle)
export async function getStats(): Promise<StatsResponse> {
  if (!isOracleConfigured()) return mockStats
  try {
    const data = await oracleFetch<unknown>("/public-api/stats", 600)
    if (!isValidStats(data)) {
      console.error("getStats: odpowiedź Oracle niezgodna z kontraktem")
      return emptyStats()
    }
    return data
  } catch (err) {
    console.error("getStats: Oracle niedostępne →", err)
    return emptyStats()
  }
}
