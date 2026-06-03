import type { StatsResponse } from "./stats-types"
import { mockStats } from "./mock-stats"

// Serwerowy punkt dostępu do statystyk skuteczności. Wyłącznie server-side.
//
// MVP: zwraca mock. Po zbudowaniu endpointu na Oracle podmień na realny fetch:
//
//   const res = await fetch(`${process.env.ORACLE_API_URL}/public-api/stats`, {
//     headers: { "x-api-key": process.env.ORACLE_API_KEY ?? "" },
//     next: { revalidate: 600 }, // cache 10 min — agregaty liczy bot, nie strona
//   })
//   if (!res.ok) throw new Error(`Oracle API: ${res.status}`)
//   return (await res.json()) as StatsResponse
export async function getStats(): Promise<StatsResponse> {
  return mockStats
}
