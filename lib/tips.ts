import type { Tip, TipsResponse } from "./types"
import { mockTips } from "./mock-tips"
import { ensureLeagueNames, isOracleConfigured, oracleFetch } from "./oracle"
import { adaptTips } from "./oracle-map"

function warsawDate(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 864e5)
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)
}

function todayWarsaw(): string {
  return warsawDate(0)
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
    await ensureLeagueNames()
    const data = await oracleFetch<unknown>(`/tips?date=${encodeURIComponent(d)}`)
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

// Historia rozliczonych typów (/tips/history) — do sekcji „Ostatnie rozliczone typy".
// Zastępuje dawne sklejanie kilku ostatnich dni. Pusty/niedostępny → [].
export async function getTipsHistory(limit = 15): Promise<Tip[]> {
  if (!isOracleConfigured()) {
    return mockTips.tips.filter((t) => t.actual_result != null).slice(0, limit)
  }
  try {
    const data = await oracleFetch<unknown>(`/tips/history?status=settled&limit=${limit}`)
    return adaptTips(data).tips
  } catch (err) {
    console.error("getTipsHistory: Oracle niedostępne →", err)
    return []
  }
}

// /live: aktywne typy z dedykowanego endpointu /tips/active.
// Oracle sam liczy okno (-6h/+24h) i dołącza match_status/home_score/away_score,
// więc front nie filtruje już po czasie. Pusty/niedostępny → [].
export async function getLiveWindowTips(): Promise<TipsResponse> {
  const today = todayWarsaw()
  if (!isOracleConfigured()) return { ...mockTips, date: today }
  try {
    const data = await oracleFetch<unknown>("/tips/active")
    return { date: today, tips: adaptTips(data).tips }
  } catch (err) {
    console.error("getLiveWindowTips: /tips/active niedostępne →", err)
    return emptyTips(today)
  }
}
