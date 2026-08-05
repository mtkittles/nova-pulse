import type { Tip, TipsResponse } from "./types"
import { mockTips } from "./mock-tips"
import { ensureLeagueNames, isOracleConfigured, oracleFetch } from "./oracle"
import { adaptTips } from "./oracle-map"
import { isDemoDataOn } from "./demo-source"
import { demoActivePayload, demoHistoryPayload, demoTipsPayload, demoThrillerSpotlight, type ThrillerSpotlight } from "./demo-tips"

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

// Kontrakt Oracle: nowy shape { matches: [...] } lub stary { tips: [...] } — akceptuj oba.
function hasTipsOrMatches(x: unknown): boolean {
  if (!x || typeof x !== "object") return false
  const o = x as { tips?: unknown; matches?: unknown }
  return Array.isArray(o.tips) || Array.isArray(o.matches)
}

// Typy dla konkretnego dnia (domyślnie dziś). Wyłącznie server-side.
// - Oracle skonfigurowane → realne dane z `/tips?date=` (mapowane adapterem)
// - Oracle niedostępne / zła odpowiedź → pusta lista (NIE crash)
// - brak konfiguracji → dane testowe
export async function getTips(date?: string): Promise<TipsResponse> {
  const d = date || todayWarsaw()
  // Tryb demo — ten sam adapter co produkcja, tylko inne źródło bajtów.
  if (await isDemoDataOn()) return adaptTips(demoTipsPayload(d))
  if (!isOracleConfigured()) return { ...mockTips, date: d }
  try {
    await ensureLeagueNames()
    const data = await oracleFetch<unknown>(`/tips?date=${encodeURIComponent(d)}`)
    if (!hasTipsOrMatches(data)) {
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
  if (await isDemoDataOn()) return adaptTips(demoHistoryPayload(limit)).tips
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
  if (await isDemoDataOn()) return adaptTips(demoActivePayload())
  if (!isOracleConfigured()) return { ...mockTips, date: today }
  try {
    const data = await oracleFetch<unknown>("/tips/active")
    return { date: today, tips: adaptTips(data).tips }
  } catch (err) {
    console.error("getLiveWindowTips: /tips/active niedostępne →", err)
    return emptyTips(today)
  }
}

// "Mecz wieczoru" (landing/thriller-spotlight.tsx) — wyłącznie tryb demo:
// brak odpowiednika w kontrakcie Oracle (produkcyjny thriller_watchlist ma
// inny mechanizm doboru, nie wystawiony jako endpoint), więc poza demo null
// i sekcja się nie renderuje.
export async function getThrillerSpotlight(): Promise<ThrillerSpotlight | null> {
  if (!(await isDemoDataOn())) return null
  return demoThrillerSpotlight()
}
