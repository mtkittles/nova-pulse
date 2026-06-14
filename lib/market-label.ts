// Etykiety rynków — jedno źródło prawdy. Oracle bywa niespójny w market_label
// (różne wersje bota), więc etykietę budujemy z bet_type + bet_side, a surowy
// market_label służy tylko jako fallback dla nieznanych typów.

export type MarketCategory = "BTTS" | "TEAM_O15" | "1X2" | "OVER" | "HANDICAP" | "COMBO" | "OTHER"

export interface MarketInfo {
  /** krótka etykieta na badge, np. "Team O1.5", "BTTS", "1X2", "Over 2.5" */
  short: string
  /** pełny opis selekcji, np. "Bayern strzeli min. 2 gole" */
  full: string
  /** kategoria do filtrów */
  category: MarketCategory
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
  fuchsia: { badge: "border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-200", color: "#e879f9" },
  slate: { badge: "border-white/20 bg-white/[0.06] text-white/80", color: "#94a3b8" },
}

const CAT_PALETTE: Record<MarketCategory, { badge: string; color: string }> = {
  BTTS: PALETTE.cyan,
  TEAM_O15: PALETTE.emerald,
  "1X2": PALETTE.sky,
  OVER: PALETTE.violet,
  HANDICAP: PALETTE.amber,
  COMBO: PALETTE.fuchsia,
  OTHER: PALETTE.slate,
}

function mk(category: MarketCategory, short: string, full: string): MarketInfo {
  return { short, full, category, ...CAT_PALETTE[category] }
}

// Buduje etykietę rynku z surowego bet_type + bet_side (akceptuje też enum
// wewnętrzny: "OVER_1_5"→"over15", "BTTS", "MIX", "THRILLER"). `marketLabel`
// to surowa etykieta z Oracle — używana TYLKO jako fallback dla nieznanych typów.
export function getMarketLabel(
  betType: string | null | undefined,
  betSide: string | null | undefined,
  homeTeam?: string,
  awayTeam?: string,
  marketLabel?: string | null,
): MarketInfo {
  const bt = norm(betType)
  const side = norm(betSide)
  const home = homeTeam?.trim() || "Gospodarz"
  const away = awayTeam?.trim() || "Gość"

  // 1X2 — wygrane
  if (bt === "1" || (bt === "1x2" && (side === "home" || side === "1")))
    return mk("1X2", "1X2", `Wygrana ${home}`)
  if (bt === "2" || (bt === "1x2" && (side === "away" || side === "2")))
    return mk("1X2", "1X2", `Wygrana ${away}`)
  if (bt === "x" || (bt === "1x2" && (side === "x" || side === "draw")))
    return mk("1X2", "1X2", "Remis")
  // Podwójna szansa
  if (bt === "x2") return mk("1X2", "Podwójna", `${away} lub remis`)
  if (bt === "1x") return mk("1X2", "Podwójna", `${home} lub remis`)
  if (bt === "12") return mk("1X2", "Podwójna", "Brak remisu")

  // BTTS
  if (bt.includes("btts") || bt === "gg") return mk("BTTS", "BTTS", "Obie drużyny strzelą")

  // Over N.5 meczowe
  if (bt === "o05" || bt === "over05") return mk("OVER", "Over 0.5", "Min. 1 gol w meczu")
  if (bt === "o25" || bt === "over25") return mk("OVER", "Over 2.5", "Min. 3 gole w meczu")
  if (bt === "o35" || bt === "over35") return mk("OVER", "Over 3.5", "Min. 4 gole w meczu")
  if (bt === "o45" || bt === "over45") return mk("OVER", "Over 4.5", "Min. 5 goli w meczu")

  // Over 1.5 — drużynowy (Team) vs meczowy (Match)
  if (bt === "o15" || bt === "over15" || bt === "over_1_5") {
    if (side === "home") return mk("TEAM_O15", "Team O1.5", `${home} strzeli min. 2 gole`)
    if (side === "away") return mk("TEAM_O15", "Team O1.5", `${away} strzeli min. 2 gole`)
    return mk("OVER", "Over 1.5", "Min. 2 gole w meczu")
  }

  // Handicap
  if (bt === "hcap" || bt === "handicap" || bt === "ah15") {
    if (side === "away") return mk("HANDICAP", "Handicap", `${away} -1.5`)
    return mk("HANDICAP", "Handicap", `${home} -1.5`)
  }
  if (bt === "hcap2" || bt === "ah25") {
    if (side === "away") return mk("HANDICAP", "Handicap", `${away} -2.5`)
    return mk("HANDICAP", "Handicap", `${home} -2.5`)
  }

  // Kombo: wygrana + 2 gole
  if (bt === "1o15") return mk("COMBO", "Kombo", `${home}: wygrana + 2 gole`)
  if (bt === "2o15") return mk("COMBO", "Kombo", `${away}: wygrana + 2 gole`)

  // Thriller / dokładny wynik
  if (bt.includes("thril") || bt.includes("exact") || bt.includes("3223"))
    return mk("OTHER", "Thriller", "Dokładny wynik 3:2 / 2:3")
  // Mix
  if (bt.includes("mix")) return mk("OTHER", "Mix", "Najlepszy rynek meczu")

  // Fallback — nieznany typ: short = bet_type, full = surowy market_label (lub raw)
  const labelFallback =
    (marketLabel && String(marketLabel).trim()) ||
    [String(betType ?? "").trim(), String(betSide ?? "").trim()].filter(Boolean).join(" · ") ||
    "Typ"
  return mk("OTHER", String(betType ?? "Typ").trim().toUpperCase() || "TYP", labelFallback)
}

export function marketGroupOf(
  betType: string | null | undefined,
  betSide: string | null | undefined,
): MarketCategory {
  return getMarketLabel(betType, betSide).category
}

// Filtry rynków na /typy (P0-04) — czytelne kategorie zamiast mylącego "Mix".
export const MARKET_FILTERS: { key: MarketCategory | "ALL"; label: string }[] = [
  { key: "ALL", label: "Wszystkie" },
  { key: "BTTS", label: "BTTS" },
  { key: "TEAM_O15", label: "Team O1.5" },
  { key: "1X2", label: "1X2" },
  { key: "OVER", label: "Over" },
  { key: "HANDICAP", label: "Handicap" },
]
