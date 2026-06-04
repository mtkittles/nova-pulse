import "server-only"

// Warstwa dostępu do API bota na Oracle.
// Wyłącznie server-side — klucz API nigdy nie trafia do przeglądarki.

export function isOracleConfigured(): boolean {
  return Boolean(process.env.ORACLE_API_URL && process.env.ORACLE_API_KEY)
}

// Pobiera i parsuje JSON z endpointu Oracle.
// `cache: "no-store"` — zawsze świeże dane. Vercel Data Cache potrafił trzymać
// starą (pustą) odpowiedź między deployami, przez co strona pokazywała pusto
// mimo że API zwracało typy. Payload jest mały i policzony z wyprzedzeniem,
// więc brak cache nie obciąża silnika.
export async function oracleFetch<T>(path: string): Promise<T> {
  const base = process.env.ORACLE_API_URL
  const key = process.env.ORACLE_API_KEY
  if (!base || !key) {
    throw new Error("Oracle API nie jest skonfigurowane (ORACLE_API_URL / ORACLE_API_KEY).")
  }

  const url = `${base.replace(/\/$/, "")}${path}`
  const res = await fetch(url, {
    headers: { "X-API-Key": key },
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error(`Oracle API zwróciło ${res.status} dla ${path}`)
  }
  return (await res.json()) as T
}
