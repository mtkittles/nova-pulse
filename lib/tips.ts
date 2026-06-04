import type { TipsResponse } from "./types"
import { mockTips } from "./mock-tips"
import { isOracleConfigured, oracleFetch } from "./oracle"

// Serwerowy punkt dostępu do typów. Wyłącznie server-side.
// - skonfigurowane Oracle → realne dane z `bot_predictions`
// - brak konfiguracji → dane testowe (podgląd działa bez Oracle)
export async function getTodayTips(): Promise<TipsResponse> {
  if (!isOracleConfigured()) return mockTips
  return oracleFetch<TipsResponse>("/public-api/tips/today", 300)
}
