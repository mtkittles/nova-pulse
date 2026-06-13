import type { Tip } from "./types"

// Rozliczenie typu na podstawie wyniku. Spójne z silnikiem bota.
export type Settlement = "won" | "lost" | "pending" | "void"

export function resolveTip(
  betType: string,
  betSide: string,
  homeScore: number | null,
  awayScore: number | null,
): Settlement {
  if (homeScore == null || awayScore == null) return "pending"
  const total = homeScore + awayScore
  const bt = (betType || "").toUpperCase()
  const k = bt.replace(/[^A-Z0-9]/g, "")
  const sideLow = (betSide || "").toLowerCase()

  // Rynek 1X2
  if (k === "1" || (k === "1X2" && (sideLow === "home" || sideLow === "1")))
    return homeScore > awayScore ? "won" : "lost"
  if (k === "2" || (k === "1X2" && (sideLow === "away" || sideLow === "2")))
    return awayScore > homeScore ? "won" : "lost"
  if (k === "X" || (k === "1X2" && (sideLow === "x" || sideLow === "draw")))
    return homeScore === awayScore ? "won" : "lost"
  // Over N.5 meczowe
  if (k === "O05" || k === "OVER05") return total >= 1 ? "won" : "lost"
  if (k === "O25" || k === "OVER25") return total >= 3 ? "won" : "lost"
  if (k === "O35" || k === "OVER35") return total >= 4 ? "won" : "lost"
  if (k === "O45" || k === "OVER45") return total >= 5 ? "won" : "lost"

  switch (bt) {
    case "BTTS":
      return homeScore > 0 && awayScore > 0 ? "won" : "lost"
    case "OVER_1_5":
    case "O15":
    case "OVER1_5":
      // Team O1.5 (z bet_side) liczy gole jednej drużyny; bez side — suma meczu
      if (sideLow === "home") return homeScore >= 2 ? "won" : "lost"
      if (sideLow === "away") return awayScore >= 2 ? "won" : "lost"
      return total >= 2 ? "won" : "lost"
    case "OVER_2_5":
      return total >= 3 ? "won" : "lost"
    case "THRILLER":
    case "EXACT_32_23":
      return (homeScore === 3 && awayScore === 2) || (homeScore === 2 && awayScore === 3)
        ? "won"
        : "lost"
    case "MIX": {
      // Mix = lepszy z BTTS / Over 1.5 — rozstrzygnij po stronie typu.
      const side = (betSide || "").toUpperCase()
      if (side.includes("BTTS") && !side.includes("O1") && !side.includes("OVER"))
        return homeScore > 0 && awayScore > 0 ? "won" : "lost"
      return total >= 2 ? "won" : "lost"
    }
  }

  // bet_side "home"/"away" → Team Over 1.5
  const side = (betSide || "").toLowerCase()
  if (side === "home") return homeScore >= 2 ? "won" : "lost"
  if (side === "away") return awayScore >= 2 ? "won" : "lost"
  return "pending"
}

// Rozliczenie typu: preferuj actual_result z Oracle; przelicz tylko gdy brak, a jest wynik.
export function settleTip(
  tip: Tip,
  homeScore: number | null,
  awayScore: number | null,
): Settlement {
  if (tip.actual_result === 1) return "won"
  if (tip.actual_result === 0) return "lost"
  // preferuj surowe wartości z Oracle (rozróżniają 1X2 / Over 2.5 / Team O1.5)
  return resolveTip(
    tip.bet_type_raw ?? tip.bet_type,
    tip.bet_side_raw ?? tip.bet_side,
    homeScore,
    awayScore,
  )
}

// Rynki rozliczone z perspektywy DANEJ drużyny (gf = jej gole, ga = przeciwnika).
export interface FormMarkets {
  btts: boolean
  teamOver15: boolean // TA drużyna strzeliła ≥2 (nie suma!)
  over15: boolean
  over25: boolean
}

export function formMarkets(gf: number | null | undefined, ga: number | null | undefined): FormMarkets | null {
  if (gf == null || ga == null || !Number.isFinite(gf) || !Number.isFinite(ga)) return null
  const total = gf + ga
  return { btts: gf > 0 && ga > 0, teamOver15: gf >= 2, over15: total >= 2, over25: total >= 3 }
}

// Mapuje Oracle match_status ("FINISHED"/"LIVE"/"SCHEDULED") na nasz stan.
export function mapMatchStatus(raw: string | null | undefined): "finished" | "live" | "upcoming" | null {
  const s = (raw || "").toLowerCase()
  if (!s) return null
  if (s.includes("fin") || s.includes("ft") || s.includes("end")) return "finished"
  if (s.includes("live") || s.includes("1h") || s.includes("2h") || s.includes("ht") || s.includes("play"))
    return "live"
  if (s.includes("sched") || s.includes("ns") || s.includes("upcoming") || s.includes("tbd")) return "upcoming"
  return null
}

export type KickoffStatus = "upcoming" | "live" | "finished" | "unknown"

// Status z czasu rozpoczęcia (gdy brak danych live ze statusem).
export function statusFromKickoff(kickoffUtc: string | null | undefined, nowMs: number): KickoffStatus {
  if (!kickoffUtc) return "unknown"
  const k = Date.parse(kickoffUtc)
  if (!Number.isFinite(k)) return "unknown"
  const minutes = (nowMs - k) / 60000
  if (minutes < 0) return "upcoming"
  if (minutes < 130) return "live"
  return "finished"
}
