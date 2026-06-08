import "server-only"
import type { CalendarDay } from "./extra-types"
import { isOracleConfigured, oracleFetch } from "./oracle"
import { adaptCalendar } from "./oracle-map"
import { getDates } from "./dates"

// Dane testowe (mock) — kilka dni z różną liczbą typów, do podglądu bez Oracle.
function mockCalendar(): CalendarDay[] {
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  const today = new Date()
  const day = (offset: number, tips: number, matches: number, leagues: number) => {
    const d = new Date(today)
    d.setDate(today.getDate() + offset)
    return { date: fmt(d), tips, matches, leagues }
  }
  return [
    day(0, 3, 14, 4),
    day(1, 9, 38, 7),
    day(2, 18, 71, 11),
    day(3, 0, 0, 0),
    day(4, 6, 24, 5),
    day(5, 22, 88, 13),
  ]
}

// Kalendarz typów: liczba typów/meczów/lig per dzień. Cache 5 min (revalidate).
// - Oracle skonfigurowane → /public-api/calendar
// - brak endpointu → fallback do /dates (tips: -1 = „są typy, liczba nieznana")
// - brak konfiguracji → mock
export async function getCalendar(): Promise<CalendarDay[]> {
  if (!isOracleConfigured()) return mockCalendar()

  try {
    const data = await oracleFetch<unknown>("/calendar", 300)
    console.log("[oracle] /calendar raw:", JSON.stringify(data).slice(0, 400))
    const days = adaptCalendar(data)
    if (days.length > 0) return days
  } catch (err) {
    console.error("getCalendar: /calendar niedostępne →", err)
  }

  // fallback: same daty bez liczników
  try {
    const d = await getDates()
    return d.dates.map((date) => ({ date, tips: -1, matches: 0, leagues: 0 }))
  } catch {
    return []
  }
}
