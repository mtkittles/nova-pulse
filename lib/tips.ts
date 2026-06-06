import type { TipsResponse } from "./types"
import { mockTips } from "./mock-tips"
import { isOracleConfigured, oracleFetch } from "./oracle"
import { adaptTips } from "./oracle-map"

function todayWarsaw(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

function emptyTips(date: string): TipsResponse {
  return { date, tips: [] }
}

function hasTipsArray(x: unknown): boolean {
  return !!x && typeof x === "object" && Array.isArray((x as { tips?: unknown }).tips)
}

// Typy dla konkretnego dnia (domyślnie dziś). Wyłącznie server-side.
// - Oracle skonfigurowane → realne dane z `/tips?date=` (mapowane adapterem)
// - Oracle niedostępne / zła odpowiedź → pusta lista (NIE crash)
// - brak konfiguracji → dane testowe
export async function getTips(date?: string): Promise<TipsResponse> {
  const d = date || todayWarsaw()
  if (!isOracleConfigured()) return { ...mockTips, date: d }
  try {
    const data = await oracleFetch<unknown>(`/tips?date=${encodeURIComponent(d)}`)
    console.log(`[oracle] /tips?date=${d} raw:`, JSON.stringify(data).slice(0, 500))
    if (!hasTipsArray(data)) {
      console.error("getTips: odpowiedź Oracle niezgodna z kontraktem")
      return emptyTips(d)
    }
    return adaptTips(data)
  } catch (err) {
    console.error("getTips: Oracle niedostępne →", err)
    return emptyTips(d)
  }
}

// Zachowane dla zgodności (landing).
export async function getTodayTips(): Promise<TipsResponse> {
  return getTips()
}
