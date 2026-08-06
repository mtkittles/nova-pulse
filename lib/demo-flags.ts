// === Flagi trybu danych demo ===
// Moduł CELOWO bez `server-only` i bez `next/headers` — importuje go także
// middleware (runtime edge). Odczyt ciasteczka żyje w `lib/demo-source.ts`.

export const DEMO_COOKIE = "lb_demo"

/** Wymusza dane demo dla WSZYSTKICH żądań (ustaw w scope Preview na Vercel). */
export const DEMO_DATA_FORCED = process.env.DEMO_DATA === "true"

function safeHostname(url: string): string | null {
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

// Prawdziwy host produkcyjny — jedyne miejsce, gdzie `?demo=1` NIE działa.
// Celowo HOST żądania, nie `process.env.VERCEL_ENV`: ta zmienna to systemowa
// flaga Vercel, która przy wyłączonym w ustawieniach projektu "Automatically
// expose System Environment Variables" jest niewystawiona w runtime — wtedy
// stara logika (`VERCEL_ENV ? ... : NODE_ENV !== "production"`) zawsze
// wychodziła false, bo `next build` zawsze ustawia `NODE_ENV=production`
// niezależnie od tego czy to build produkcyjny czy preview. Efekt: `?demo=1`
// cicho przestawał działać, a CAŁA strona spadała na statyczne dane awaryjne
// (mockTips/mockStats — stare daty, `win_rate: 0`) — dokładnie objawy
// zgłoszonej „regresji danych demo" (1 typ, 0.0% skuteczności, brak
// historii). Host żądania jest zawsze dostępny, niezależnie od konfiguracji
// projektu Vercel.
const PRODUCTION_HOSTS = new Set<string>(
  ["nova-pulse-sage.vercel.app", process.env.NEXT_PUBLIC_SITE_URL ? safeHostname(process.env.NEXT_PUBLIC_SITE_URL) : null].filter(
    (h): h is string => !!h,
  ),
)

/**
 * Czy `?demo=1` / ciasteczko `lb_demo` są honorowane dla danego hosta.
 * Domyślnie: wszędzie POZA prawdziwą produkcją (host z listy powyżej) —
 * inaczej ktokolwiek mógłby dopisać `?demo=1` do linku żywego serwisu
 * i zobaczyć zmyślone typy jako prawdziwe. `ALLOW_DEMO_PARAM=true` wymusza
 * zawsze (jawny override, np. do lokalnych testów).
 */
export function isDemoParamAllowed(host: string | null | undefined): boolean {
  if (process.env.ALLOW_DEMO_PARAM === "true") return true
  if (!host) return true // brak hosta (np. build/SSG bez żądania) — nie blokuj
  return !PRODUCTION_HOSTS.has(host.toLowerCase().split(":")[0])
}
