import type { TipsResponse } from "./types"
import { mockTips } from "./mock-tips"

// Jedyny serwerowy punkt dostępu do danych bota.
// ZASADA: ten kod biegnie WYŁĄCZNIE server-side. Klucz API i adres Oracle
// nigdy nie trafiają do przeglądarki (patrz CLAUDE.md / PLAN.md).
//
// MVP: zwraca mock. Po zbudowaniu endpointu na Oracle podmień na realny fetch:
//
//   const res = await fetch(`${process.env.ORACLE_API_URL}/public-api/tips/today`, {
//     headers: { "x-api-key": process.env.ORACLE_API_KEY ?? "" },
//     next: { revalidate: 300 }, // cache 5 min — silnik nie liczy na żądanie
//   })
//   if (!res.ok) throw new Error(`Oracle API: ${res.status}`)
//   return (await res.json()) as TipsResponse
export async function getTodayTips(): Promise<TipsResponse> {
  return mockTips
}
