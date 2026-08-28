import "server-only"
import { cookies, headers } from "next/headers"
import { DEMO_COOKIE, DEMO_DATA_FORCED, isDemoParamAllowed } from "./demo-flags"

/**
 * Czy dla TEGO żądania serwować dane demo zamiast Oracle.
 *
 * Dwa niezależne przełączniki:
 *  1. `DEMO_DATA=true` (env, server-side) — wszystkie żądania, bez ciasteczka.
 *  2. `?demo=1` — middleware ustawia ciasteczko `lb_demo`, które przeżywa
 *     nawigację i client-side fetch do `/api/tips` (inaczej przełączenie daty
 *     na /typy wracałoby po dane do Oracle).
 *
 * `isDemoParamAllowed` sprawdza HOST żądania (middleware już gatuje na tej
 * samej podstawie przy ustawianiu ciasteczka) — to tylko dodatkowa warstwa
 * obrony, gdyby ktoś ręcznie podstawił ciasteczko z pominięciem middleware.
 *
 * Gałąź produkcyjna (fetch z Oracle) pozostaje NIETKNIĘTA — to tylko
 * early-return przed nią.
 */
export async function isDemoDataOn(): Promise<boolean> {
  if (DEMO_DATA_FORCED) return true
  try {
    const [jar, hdrs] = await Promise.all([cookies(), headers()])
    if (!isDemoParamAllowed(hdrs.get("host"))) return false
    return jar.get(DEMO_COOKIE)?.value === "1"
  } catch {
    // kontekst statyczny (brak żądania) → bez demo
    return false
  }
}
