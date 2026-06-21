import "server-only"
import { isOracleConfigured, oracleFetch } from "./oracle"

export interface DatesResponse {
  dates: string[] // YYYY-MM-DD, posortowane rosnąco
  min: string | null
  max: string | null
}

function mockDates(): DatesResponse {
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  const d1 = new Date(today)
  const d2 = new Date(today)
  d2.setDate(today.getDate() + 1)
  const d3 = new Date(today)
  d3.setDate(today.getDate() + 2)
  const dates = [fmt(d1), fmt(d2), fmt(d3)]
  return { dates, min: dates[0], max: dates[dates.length - 1] }
}

function emptyDates(): DatesResponse {
  return { dates: [], min: null, max: null }
}

// Dni, dla których są typy (do podświetlenia w kalendarzu).
export async function getDates(): Promise<DatesResponse> {
  if (!isOracleConfigured()) return mockDates()
  try {
    const data = await oracleFetch<unknown>("/dates")
    // surowy log do weryfikacji kształtu (widoczny w logach Vercela)
    const d = data as Record<string, unknown>
    if (d && Array.isArray(d.dates)) {
      const dates = (d.dates as unknown[]).map(String).sort()
      return {
        dates,
        min: typeof d.min === "string" ? d.min : (dates[0] ?? null),
        max: typeof d.max === "string" ? d.max : (dates[dates.length - 1] ?? null),
      }
    }
    return emptyDates()
  } catch (err) {
    console.error("getDates: Oracle niedostępne →", err)
    return emptyDates()
  }
}
