import "server-only"
import { cookies } from "next/headers"
import { DEMO_COOKIE, DEMO_DATA_FORCED, DEMO_PARAM_ALLOWED } from "./demo-flags"

/**
 * Czy dla TEGO żądania serwować dane demo zamiast Oracle.
 *
 * Dwa niezależne przełączniki:
 *  1. `DEMO_DATA=true` (env, server-side) — wszystkie żądania, bez ciasteczka.
 *  2. `?demo=1` — middleware ustawia ciasteczko `lb_demo`, które przeżywa
 *     nawigację i client-side fetch do `/api/tips` (inaczej przełączenie daty
 *     na /typy wracałoby po dane do Oracle).
 *
 * Gałąź produkcyjna (fetch z Oracle) pozostaje NIETKNIĘTA — to tylko
 * early-return przed nią.
 */
export async function isDemoDataOn(): Promise<boolean> {
  if (DEMO_DATA_FORCED) return true
  if (!DEMO_PARAM_ALLOWED) return false
  try {
    const jar = await cookies()
    return jar.get(DEMO_COOKIE)?.value === "1"
  } catch {
    // kontekst statyczny (brak żądania) → bez demo
    return false
  }
}
