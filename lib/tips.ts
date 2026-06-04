import type { TipsResponse } from "./types"
import { mockTips } from "./mock-tips"
import { isOracleConfigured, oracleFetch } from "./oracle"

function emptyTips(): TipsResponse {
  return { date: new Date().toISOString().slice(0, 10), tips: [] }
}

// Serwerowy punkt dostępu do typów. Wyłącznie server-side.
// - Oracle skonfigurowane → realne dane z `bot_predictions`
// - Oracle niedostępne (błąd/timeout) → pusta lista (NIE crash)
// - brak konfiguracji → dane testowe (podgląd działa bez Oracle)
export async function getTodayTips(): Promise<TipsResponse> {
  if (!isOracleConfigured()) return mockTips
  try {
    return await oracleFetch<TipsResponse>("/public-api/tips/today", 300)
  } catch (err) {
    console.error("getTodayTips: Oracle niedostępne →", err)
    return emptyTips()
  }
}
