import type { BetType } from "./types"

// Polskie etykiety rynków i statusów (do UI).

export const BET_TYPE_PL: Record<BetType, string> = {
  BTTS: "Obie drużyny strzelą",
  OVER_1_5: "Powyżej 1.5 gola",
  MIX: "Mieszany",
  THRILLER: "Dokładny wynik 3:2/2:3",
}

export const BET_TYPE_SHORT: Record<BetType, string> = {
  BTTS: "BTTS",
  OVER_1_5: "Over 1.5",
  MIX: "Mix",
  THRILLER: "Thriller",
}

/**
 * Mapuje bet_type (i opcjonalnie bet_side) na czytelną kategorię rynku.
 * Używana w /stats, /typy i /mecz — jedyne miejsce mapowania.
 * Wynikowe kategorie: BTTS | Team O1.5 | Over | 1X2 | Handicap
 */
export function getMarketLabel(betType: string, betSide?: string): string {
  const k = betType.toUpperCase().replace(/[^A-Z0-9]/g, "")
  if (k === "BTTS" || k === "O15BTTS") return "BTTS"
  if (k.includes("HANDICAP") || k.startsWith("AH") || k.startsWith("HC")) return "Handicap"
  if (k.includes("OVER") || k === "O15" || k === "O25" || k === "OVER15" || k === "OVER25") {
    const side = (betSide ?? "").toLowerCase()
    // "team" / team-specific oznacza Team O1.5
    if (side.includes("team") || side.includes("home") || side.includes("away") ||
        side.includes("gosp") || side.includes("gość") || side.includes("gos")) {
      return "Team O1.5"
    }
    return "Over"
  }
  // Oracle _market_key grupuje nieskategoryzowane jako "Mix" → u nas 1X2
  if (k === "MIX" || k === "1X2" || k === "1X" || k === "12") return "1X2"
  if (k.includes("THRILLER") || k.includes("EXACT")) return "Thriller"
  return "1X2"
}

export type StatusInfo = { label: string; classes: string }

// actual_result: null = oczekuje, 1 = trafiony, 0 = nietrafiony
export function statusInfo(result: 0 | 1 | null): StatusInfo {
  if (result === 1)
    return { label: "trafiony ✅", classes: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200" }
  if (result === 0)
    return { label: "nietrafiony ❌", classes: "border-rose-300/30 bg-rose-300/10 text-rose-200" }
  return { label: "oczekuje", classes: "border-white/15 bg-white/[0.06] text-white/55" }
}
