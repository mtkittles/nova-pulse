// Status typu na żywo — jedno źródło prawdy dla /live i karty typu.
// Oracle: match_status "SCHEDULED" | "IN_PLAY" | "FINISHED" (+ warianty),
// home_score/away_score gdy mecz trwa, actual_result po zakończeniu.

export type LiveStatus =
  | "PENDING" // SCHEDULED — przed meczem
  | "LIVE_OPEN" // IN_PLAY — wynik jeszcze nie rozstrzyga
  | "LIVE_HIT" // IN_PLAY — wynik spełnia warunek bota
  | "LIVE_AT_RISK" // IN_PLAY — wynik nie spełnia, ale mecz trwa
  | "WON" // FINISHED, actual_result = 1
  | "LOST" // FINISHED, actual_result = 0
  | "VOID" // FINISHED, actual_result = null (anulowany)

function normStatus(raw: string): "FINISHED" | "IN_PLAY" | "SCHEDULED" {
  const s = (raw || "").toUpperCase()
  if (/(FINISH|^FT$|AET|PEN|ENDED|FULL.?TIME|ZAKO)/.test(s)) return "FINISHED"
  if (/(IN.?PLAY|LIVE|1H|2H|^HT$|HALF|ET|^P$|PRZERWA|TRWA)/.test(s)) return "IN_PLAY"
  return "SCHEDULED"
}

// Czy aktualny wynik spełnia warunek typu. null = nie da się ocenić (np. handicap/kombo).
function checkCondition(betType: string, betSide: string, h: number, a: number): boolean | null {
  const bt = (betType || "").toLowerCase().replace(/[^a-z0-9]/g, "")
  const side = (betSide || "").toLowerCase().replace(/[^a-z0-9]/g, "")
  const total = h + a
  switch (bt) {
    case "btts":
      return side === "no" || side === "nie" ? !(h > 0 && a > 0) : h > 0 && a > 0
    case "o15":
    case "over15":
      if (side === "home") return h > 1
      if (side === "away") return a > 1
      return total > 1
    case "o25":
    case "over25":
      return total > 2
    case "o35":
    case "over35":
      return total > 3
    case "1":
      return h > a
    case "2":
      return a > h
    case "x":
      return h === a
    case "x2":
      return a >= h
    case "1x":
      return h >= a
    case "thriller":
    case "exact":
      return (h === 3 && a === 2) || (h === 2 && a === 3)
    default:
      return null
  }
}

export function getLiveStatus(tip: {
  match_status: string
  home_score: number | null
  away_score: number | null
  bet_type: string
  bet_side: string
  actual_result: number | null
}): LiveStatus {
  const status = normStatus(tip.match_status)
  if (status === "FINISHED") {
    if (tip.actual_result === 1) return "WON"
    if (tip.actual_result === 0) return "LOST"
    return "VOID"
  }
  if (status === "IN_PLAY") {
    const h = tip.home_score ?? 0
    const a = tip.away_score ?? 0
    const met = checkCondition(tip.bet_type, tip.bet_side, h, a)
    if (met === null) return "LIVE_OPEN"
    return met ? "LIVE_HIT" : "LIVE_AT_RISK"
  }
  return "PENDING"
}

// Konfiguracja wizualna (tokeny Graphite Night, nie hardkody kolorów).
export const LIVE_STATUS_CONFIG: Record<
  LiveStatus,
  { label: string; color: string; border: string; dot: boolean; group: "active" | "upcoming" | "finished" }
> = {
  PENDING: { label: "Nadchodzący", color: "text-[color:var(--text-muted)]", border: "border-[color:var(--border-soft)]", dot: false, group: "upcoming" },
  LIVE_OPEN: { label: "⏱ Na żywo", color: "text-[color:var(--cyan)]", border: "border-[color:var(--cyan)]/40", dot: true, group: "active" },
  LIVE_HIT: { label: "✓ Trafiony!", color: "text-[color:var(--success)]", border: "border-[color:var(--success)]/60", dot: true, group: "active" },
  LIVE_AT_RISK: { label: "⚠ Zagrożony", color: "text-[color:var(--danger)]", border: "border-[color:var(--danger)]/60", dot: true, group: "active" },
  WON: { label: "Trafiony", color: "text-[color:var(--success)]", border: "border-[color:var(--success)]/30", dot: false, group: "finished" },
  LOST: { label: "Pudło", color: "text-[color:var(--danger)]", border: "border-[color:var(--danger)]/30", dot: false, group: "finished" },
  VOID: { label: "Anulowany", color: "text-[color:var(--text-muted)]", border: "border-[color:var(--border-soft)]", dot: false, group: "finished" },
}
