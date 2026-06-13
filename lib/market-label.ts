// Etykiety rynków — jedno źródło prawdy dla nazw typów na froncie.
// Oracle wysyła surowe bet_type ("1","2","x","btts","o15","o25","o35"...) + bet_side
// ("home"/"away"/""). Różne rynki tego samego meczu MUSZĄ wyglądać różnie
// (np. USA-Paraguay: "1" = wygrana gospodarzy vs "o25" = min. 3 gole) — to NIE duplikaty.

export type MarketGroup = "BTTS" | "TEAM_O15" | "1X2" | "OVER" | "OTHER"

export interface MarketInfo {
  group: MarketGroup
  /** krótka nazwa rynku do badge, np. "1X2", "Over 2.5", "Team O1.5", "BTTS" */
  market: string
  /** pełny, jednoznaczny opis selekcji */
  label: string
  /** klasy badge (border+bg+text) */
  badge: string
  /** hex koloru akcentu (pierścienie/wykresy) */
  color: string
}

const norm = (s: unknown) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")

const PALETTE = {
  cyan: { badge: "border-cyan-300/30 bg-cyan-300/10 text-cyan-200", color: "#22d3ee" },
  violet: { badge: "border-violet-300/30 bg-violet-300/10 text-violet-200", color: "#a78bfa" },
  sky: { badge: "border-sky-300/30 bg-sky-300/10 text-sky-200", color: "#38bdf8" },
  emerald: { badge: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200", color: "#34d399" },
  amber: { badge: "border-amber-300/30 bg-amber-300/10 text-amber-200", color: "#fbbf24" },
  slate: { badge: "border-white/20 bg-white/[0.06] text-white/80", color: "#94a3b8" },
}

// Rozpoznaje rynek na podstawie surowego bet_type + bet_side (akceptuje też enum
// wewnętrzny: "OVER_1_5"→"over15", "BTTS", "MIX", "THRILLER").
export function getMarketLabel(
  betType: string | null | undefined,
  betSide: string | null | undefined,
  homeTeam?: string,
  awayTeam?: string,
): MarketInfo {
  const bt = norm(betType)
  const side = norm(betSide)
  const home = homeTeam?.trim() || "Gospodarze"
  const away = awayTeam?.trim() || "Goście"

  // 1X2
  if (bt === "1" || (bt === "1x2" && (side === "home" || side === "1")))
    return { group: "1X2", market: "1X2", label: "1X2 · Wygrana gospodarzy", ...PALETTE.sky }
  if (bt === "2" || (bt === "1x2" && (side === "away" || side === "2")))
    return { group: "1X2", market: "1X2", label: "1X2 · Wygrana gości", ...PALETTE.sky }
  if (bt === "x" || (bt === "1x2" && (side === "x" || side === "draw")))
    return { group: "1X2", market: "1X2", label: "1X2 · Remis", ...PALETTE.sky }

  // BTTS
  if (bt.includes("btts") || bt === "gg")
    return { group: "BTTS", market: "BTTS", label: "BTTS · Obie drużyny strzelą", ...PALETTE.cyan }

  // Over 0.5 / 2.5 / 3.5 / 4.5 — rynki meczowe
  if (bt === "o05" || bt === "over05")
    return { group: "OVER", market: "Over 0.5", label: "Over 0.5 · Min. 1 gol w meczu", ...PALETTE.violet }
  if (bt === "o25" || bt === "over25")
    return { group: "OVER", market: "Over 2.5", label: "Over 2.5 · Min. 3 gole w meczu", ...PALETTE.violet }
  if (bt === "o35" || bt === "over35")
    return { group: "OVER", market: "Over 3.5", label: "Over 3.5 · Min. 4 gole w meczu", ...PALETTE.violet }
  if (bt === "o45" || bt === "over45")
    return { group: "OVER", market: "Over 4.5", label: "Over 4.5 · Min. 5 goli w meczu", ...PALETTE.violet }

  // Over 1.5 — rozróżnij drużynowy (z bet_side) od meczowego
  if (bt === "o15" || bt === "over15" || bt === "over_1_5") {
    if (side === "home")
      return { group: "TEAM_O15", market: "Team O1.5", label: `Team O1.5 · ${home} min. 2 gole`, ...PALETTE.emerald }
    if (side === "away")
      return { group: "TEAM_O15", market: "Team O1.5", label: `Team O1.5 · ${away} min. 2 gole`, ...PALETTE.emerald }
    return { group: "OVER", market: "Over 1.5", label: "Over 1.5 · Min. 2 gole w meczu", ...PALETTE.violet }
  }

  // Thriller / dokładny wynik 3:2 / 2:3
  if (bt.includes("thril") || bt.includes("exact") || bt.includes("3223"))
    return { group: "OTHER", market: "Thriller", label: "Thriller · Dokładny wynik 3:2 / 2:3", ...PALETTE.amber }

  // Mix
  if (bt.includes("mix"))
    return { group: "OTHER", market: "Mix", label: "Mix · Najlepszy rynek meczu", ...PALETTE.emerald }

  // Fallback — pokaż surowe wartości zamiast mylącego "Mix".
  const raw = [String(betType ?? "").trim(), String(betSide ?? "").trim()].filter(Boolean).join(" · ")
  return { group: "OTHER", market: String(betType ?? "Typ").trim() || "Typ", label: raw || "Typ", ...PALETTE.slate }
}

export function marketGroupOf(betType: string | null | undefined, betSide: string | null | undefined): MarketGroup {
  return getMarketLabel(betType, betSide).group
}

// Filtry rynków na /typy (P0-04) — czytelne nazwy zamiast mylącego "Mix".
export const MARKET_FILTERS: { key: MarketGroup | "ALL"; label: string }[] = [
  { key: "ALL", label: "Wszystkie" },
  { key: "BTTS", label: "BTTS" },
  { key: "TEAM_O15", label: "Team O1.5" },
  { key: "1X2", label: "1X2" },
  { key: "OVER", label: "Over" },
]
