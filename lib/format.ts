// Formatowanie metryk typów — null zawsze jako "—" (nigdy 0%, 0.00, +0.0%).
// Jedno miejsce, by UI był spójny i nie udawał danych, których nie ma.

export const DASH = "—"

// model_prob (0..1) → "72%" lub "—"
export function fmtProb(v: number | null | undefined): string {
  return v == null || !Number.isFinite(v) ? DASH : `${Math.round(v * 100)}%`
}

// kurs → "1.85" lub "—"
export function fmtOdds(v: number | null | undefined): string {
  return v == null || !Number.isFinite(v) ? DASH : v.toFixed(2)
}

// edge (0.08 → "+8.0%") lub "—"
export function fmtEdge(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return DASH
  return `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}%`
}

// Q-Score → "84" lub "—"
export function fmtQ(v: number | null | undefined): string {
  return v == null || !Number.isFinite(v) ? DASH : String(Math.round(v))
}

// Klucz sortowania: null/NaN na koniec listy (malejąco).
export function sortKey(v: number | null | undefined): number {
  return v != null && Number.isFinite(v) ? v : -Infinity
}
