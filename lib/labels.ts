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

export type StatusInfo = { label: string; classes: string }

// actual_result: null = oczekuje, 1 = trafiony, 0 = nietrafiony
export function statusInfo(result: 0 | 1 | null): StatusInfo {
  if (result === 1)
    return { label: "trafiony ✅", classes: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200" }
  if (result === 0)
    return { label: "nietrafiony ❌", classes: "border-rose-300/30 bg-rose-300/10 text-rose-200" }
  return { label: "oczekuje", classes: "border-white/15 bg-white/[0.06] text-white/55" }
}
