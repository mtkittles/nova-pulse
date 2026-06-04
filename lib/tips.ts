import type { TipsResponse } from "./types"
import { mockTips } from "./mock-tips"
import { isOracleConfigured, oracleFetch } from "./oracle"

function emptyTips(): TipsResponse {
  return { date: new Date().toISOString().slice(0, 10), tips: [] }
}

// Sprawdza, czy odpowiedź Oracle pasuje do kontraktu (chroni przed crashem,
// gdy endpoint zwróci błąd/inny kształt jako 200).
function isValidTips(x: unknown): x is TipsResponse {
  if (!x || typeof x !== "object") return false
  return Array.isArray((x as { tips?: unknown }).tips)
}

// Serwerowy punkt dostępu do typów. Wyłącznie server-side.
// - Oracle skonfigurowane + poprawna odpowiedź → realne dane z `bot_predictions`
// - Oracle niedostępne / zła odpowiedź → pusta lista (NIE crash)
// - brak konfiguracji → dane testowe (podgląd działa bez Oracle)
export async function getTodayTips(): Promise<TipsResponse> {
  if (!isOracleConfigured()) return mockTips
  try {
    const data = await oracleFetch<unknown>("/public-api/tips/today", 300)
    if (!isValidTips(data)) {
      console.error("getTodayTips: odpowiedź Oracle niezgodna z kontraktem")
      return emptyTips()
    }
    return data
  } catch (err) {
    console.error("getTodayTips: Oracle niedostępne →", err)
    return emptyTips()
  }
}
