import type { StatsResponse } from "./stats-types"
import { mockStats } from "./mock-stats"
import { isOracleConfigured, oracleFetch } from "./oracle"

// Serwerowy punkt dostępu do agregatów skuteczności. Wyłącznie server-side.
// - skonfigurowane Oracle → realne, policzone agregaty z `bot_predictions`
// - brak konfiguracji → dane testowe (podgląd działa bez Oracle)
export async function getStats(): Promise<StatsResponse> {
  if (!isOracleConfigured()) return mockStats
  return oracleFetch<StatsResponse>("/public-api/stats", 600)
}
