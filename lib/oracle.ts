import "server-only"

// Warstwa dostępu do API bota na Oracle.
// Wyłącznie server-side — klucz API nigdy nie trafia do przeglądarki.

export function isOracleConfigured(): boolean {
  return Boolean(process.env.ORACLE_API_URL && process.env.ORACLE_API_KEY)
}

// Pobiera JSON z Oracle. `path` bez prefiksu (np. "/dates", "/tips?date=...").
// Próbuje najpierw "/public-api<path>", a przy 404 — samego "<path>"
// (odporność na to, czy endpointy są pod prefiksem czy w korzeniu).
export async function oracleFetch<T>(path: string, revalidate = 300): Promise<T> {
  const base = process.env.ORACLE_API_URL
  const key = process.env.ORACLE_API_KEY
  if (!base || !key) {
    throw new Error("Oracle API nie jest skonfigurowane (ORACLE_API_URL / ORACLE_API_KEY).")
  }

  const clean = base.replace(/\/$/, "")
  const candidates = path.startsWith("/public-api") ? [path] : [`/public-api${path}`, path]

  let lastStatus = 0
  for (const p of candidates) {
    const res = await fetch(`${clean}${p}`, {
      headers: { "X-API-Key": key },
      next: { revalidate },
    })
    if (res.ok) return (await res.json()) as T
    lastStatus = res.status
    if (res.status !== 404) break // 404 → spróbuj alternatywnej ścieżki; inne błędy → przerwij
  }
  throw new Error(`Oracle API zwróciło ${lastStatus} dla ${path}`)
}
