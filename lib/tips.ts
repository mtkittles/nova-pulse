import type { TipsResponse } from "./types"
import { mockTips } from "./mock-tips"
import { isOracleConfigured, oracleFetch } from "./oracle"
import { adaptTips } from "./oracle-map"

function emptyTips(): TipsResponse {
  return { date: new Date().toISOString().slice(0, 10), tips: [] }
}

function hasTipsArray(x: unknown): boolean {
  return !!x && typeof x === "object" && Array.isArray((x as { tips?: unknown }).tips)
}

// Serwerowy punkt dostępu do typów. Wyłącznie server-side.
// - Oracle skonfigurowane + poprawna odpowiedź → realne dane (mapowane adapterem)
// - Oracle niedostępne / zła odpowiedź → pusta lista (NIE crash)
// - brak konfiguracji → dane testowe (podgląd działa bez Oracle)
export async function getTodayTips(): Promise<TipsResponse> {
  if (!isOracleConfigured()) return mockTips
  try {
    const data = await oracleFetch<unknown>("/public-api/tips/today", 300)
    if (!hasTipsArray(data)) {
      console.error("getTodayTips: odpowiedź Oracle niezgodna z kontraktem")
      return emptyTips()
    }
    return adaptTips(data)
  } catch (err) {
    console.error("getTodayTips: Oracle niedostępne →", err)
    return emptyTips()
  }
}
