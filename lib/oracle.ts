import "server-only"

// Warstwa dostępu do API bota na Oracle (za Cloudflare Tunnel).
// Wyłącznie server-side — klucz API nigdy nie trafia do przeglądarki.

export function isOracleConfigured(): boolean {
  return Boolean(process.env.ORACLE_API_URL && process.env.ORACLE_API_KEY)
}

// Pobiera i parsuje JSON z endpointu Oracle. Rzuca przy braku konfiguracji
// lub błędzie HTTP (obsługiwane przez error.tsx na stronach).
export async function oracleFetch<T>(path: string, revalidateSeconds: number): Promise<T> {
  const base = process.env.ORACLE_API_URL
  const key = process.env.ORACLE_API_KEY
  if (!base || !key) {
    throw new Error("Oracle API nie jest skonfigurowane (ORACLE_API_URL / ORACLE_API_KEY).")
  }

  const url = `${base.replace(/\/$/, "")}${path}`
  const res = await fetch(url, {
    headers: { "X-API-Key": key },
    // bot liczy z wyprzedzeniem — cache chroni silnik przed obciążeniem
    next: { revalidate: revalidateSeconds },
  })

  if (!res.ok) {
    throw new Error(`Oracle API zwróciło ${res.status} dla ${path}`)
  }
  return (await res.json()) as T
}
