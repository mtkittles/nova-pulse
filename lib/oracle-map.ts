import "server-only"
import type { BetType, Tip, TipsResponse } from "./types"
import type {
  LeagueStat,
  MarketStat,
  QScoreBucket,
  StatsResponse,
  TimelinePoint,
} from "./stats-types"
import { getMarketLabel } from "./labels"
import type {
  FormMatch,
  MatchInfo,
  MatchPrediction,
  Scorer,
  StandingRow,
  TeamForm,
} from "./extra-types"

// ——— FAKTYCZNY kształt typu z Oracle API (potwierdzony surowym JSON) ———
export interface OracleTip {
  event_id: string | number
  league: string
  home: string
  away: string
  kickoff_utc: string
  bet_type: "OVER_1_5" | "BTTS" | "MIX" | "EXACT_32_23" | string
  bet_side: string
  model_prob: number
  odds: number
  edge: number // może być ujemny
  q_score: number
  actual_result: 0 | 1 | null
}

export interface OracleTipsResponse {
  date?: string
  count?: number
  tips: OracleTip[]
}

// ——— mapowanie API → wewnętrzny typ (jedyne miejsce!) ———

function num(x: unknown, def = 0): number {
  const n = Number(x)
  return Number.isFinite(n) ? n : def
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function text(x: unknown, def = ""): string {
  const s = String(x ?? "").trim()
  if (!s || s === "null" || s === "undefined") return def
  return s
}

function qScore(x: unknown): number {
  return clamp(Math.round(num(x) * 10) / 10, 0, 100)
}

function prob(x: unknown): number {
  return clamp(num(x), 0, 1)
}

function oddsValue(x: unknown): number {
  return Math.max(0, num(x))
}

// bet_type Oracle → wewnętrzny enum (tolerancyjnie, z obsługą starych wartości)
function mapBetType(raw: unknown): BetType {
  const k = String(raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "")
  if (k.includes("BTTS")) return "BTTS"
  if (k.includes("OVER") || k === "O15") return "OVER_1_5"
  if (k.includes("EXACT") || k.includes("THRIL") || k.includes("3223")) return "THRILLER"
  if (k.includes("MIX")) return "MIX"
  return "MIX"
}

function mapBetSide(raw: unknown): string {
  const s = text(raw)
  const low = s.toLowerCase()
  if (low === "yes") return "TAK"
  if (low === "no") return "NIE"
  if (low === "32_or_23" || low === "3:2/2:3" || low === "exact_32_23") return "3:2 / 2:3"
  return s || "—"
}

// Bezpieczne ISO: spacja → "T" (Safari!), usuń mikrosekundy, dodaj "Z" gdy brak strefy.
function normalizeIso(d: unknown): string {
  let s = text(d)
  if (!s) return ""
  s = s.replace(" ", "T").replace(/\.\d+/, "")
  if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) s += "Z"
  if (Number.isNaN(Date.parse(s))) return ""
  return s
}

function mapResult(t: Record<string, unknown>): 0 | 1 | null {
  const r = t.actual_result
  if (r === true) return 1
  if (r === false) return 0
  if (r === 1 || r === "1") return 1
  if (r === 0 || r === "0") return 0
  // fallback dla starego kształtu ze "status"
  const s = text(t.status).toLowerCase()
  if (
    s.includes("pending") ||
    s.includes("live") ||
    s.includes("void") ||
    s.includes("unknown") ||
    s.includes("push")
  ) {
    return null
  }
  if (s.includes("won") || s.includes("win")) return 1
  if (s.includes("lost") || s.includes("lose")) return 0
  return null
}

export function adaptTip(raw: unknown): Tip {
  const t = (raw ?? {}) as Record<string, unknown>
  const model_prob = prob(t.model_prob)
  const odds = oddsValue(t.odds)
  // użyj realnego edge (może być ujemny); gdy brak — policz przewagę nad kursem
  const rawEdge = Number(t.edge)
  const edge = Number.isFinite(rawEdge) ? rawEdge : odds > 0 ? model_prob - 1 / odds : 0

  return {
    event_id: (t.event_id as string | number) ?? "",
    league: text(t.league, "—"),
    home: text(t.home ?? t.home_team, "—"),
    away: text(t.away ?? t.away_team, "—"),
    kickoff_utc: normalizeIso(t.kickoff_utc ?? t.match_date),
    bet_type: mapBetType(t.bet_type),
    bet_side: mapBetSide(t.bet_side),
    model_prob,
    odds,
    edge,
    q_score: qScore(t.q_score),
    actual_result: mapResult(t),
  }
}

export function adaptTips(raw: unknown): TipsResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const list = Array.isArray(r.tips) ? r.tips : []
  return {
    date: text(r.date, new Date().toISOString().slice(0, 10)),
    tips: list.map(adaptTip),
    source: "live",
  }
}

// ——— statystyki ———

function pickCount(o: unknown): number {
  const r = (o ?? {}) as Record<string, unknown>
  return num(r.tips ?? r.total ?? r.count ?? r.n ?? 0)
}
function pickWinRate(o: unknown): number {
  const r = (o ?? {}) as Record<string, unknown>
  return prob(r.win_rate ?? r.winrate ?? 0)
}
function pickRoi(o: unknown): number {
  const r = (o ?? {}) as Record<string, unknown>
  return r.roi == null ? 0 : num(r.roi)
}

function asEntries(x: unknown): [string, unknown][] {
  if (Array.isArray(x))
    return x.map((v) => [
      String((v as Record<string, unknown>)?.bet_type ?? (v as Record<string, unknown>)?.bucket ?? ""),
      v,
    ])
  if (x && typeof x === "object") return Object.entries(x as Record<string, unknown>)
  return []
}

// Mapowanie klucza Oracle → etykieta UI.
// Nowy Oracle zwraca już gotowe etykiety (BTTS, Team O1.5, Over, 1X2, Handicap) —
// przepuszczamy je bez konwersji; stare klucze (Mix, O15) mapujemy przez getMarketLabel.
function oracleMarketLabel(key: string): string {
  if (!key.trim()) return "Inne"
  const KNOWN = new Set(["BTTS", "Team O1.5", "Over", "1X2", "Handicap"])
  if (KNOWN.has(key)) return key
  return getMarketLabel(key)
}

export function adaptStats(raw: unknown): StatsResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const sum = (r.summary ?? {}) as Record<string, unknown>
  const wins = num(sum.won ?? sum.wins)
  const losses = num(sum.lost ?? sum.losses)
  const total = num(sum.total ?? sum.total_tips ?? wins + losses)

  // avg_q_score: z Oracle (nowe pole) lub z q_score_buckets (fallback)
  let avg_q_score: number | null =
    sum.avg_q_score != null ? num(sum.avg_q_score) || null : null

  const q_score_buckets: QScoreBucket[] = asEntries(r.q_score_buckets).map(([k, v]) => {
    const vr = (v ?? {}) as Record<string, unknown>
    const tips = pickCount(v)
    const won = num(vr.won)
    const win_rate =
      vr.win_rate != null ? num(vr.win_rate) : tips > 0 ? won / tips : 0
    return { bucket: String(k).replace(/-/g, "–"), tips, win_rate }
  })

  // Fallback: ważona średnia z buckets gdy Oracle nie zwróciło avg_q_score
  if (avg_q_score == null && q_score_buckets.some((b) => b.tips > 0)) {
    const MID: Record<string, number> = { "50–60": 55, "60–70": 65, "70–80": 75, "80+": 82.5 }
    let wsum = 0, wcount = 0
    for (const b of q_score_buckets) {
      const mid = MID[b.bucket] ?? 77.5
      wsum += mid * b.tips
      wcount += b.tips
    }
    avg_q_score = wcount > 0 ? Math.round((wsum / wcount) * 10) / 10 : null
  }

  const summary = {
    total_tips: total,
    settled_tips: num(sum.settled_tips ?? wins + losses),
    wins,
    losses,
    win_rate: pickWinRate(sum),
    roi: sum.roi == null ? 0 : num(sum.roi),
    current_streak: num(sum.current_streak),
    avg_q_score,
  }

  // by_market: Oracle zwraca obiekt { "BTTS": {...}, "O15": {...}, "Mix": {...} }
  // Filtrujemy Thriller, mapujemy klucze na czytelne etykiety
  const by_market: MarketStat[] = []
  for (const [k, v] of asEntries(r.by_market)) {
    const label = oracleMarketLabel(k)
    if (label === "Thriller") continue
    const vr = (v ?? {}) as Record<string, unknown>
    const roiRaw = vr.roi
    by_market.push({
      market: label,
      tips: pickCount(v),
      win_rate: pickWinRate(v),
      roi: roiRaw == null ? null : num(roiRaw),
    })
  }

  const by_league: LeagueStat[] = (Array.isArray(r.by_league) ? r.by_league : []).map((l) => {
    const o = (l ?? {}) as Record<string, unknown>
    return { league: text(o.league ?? o.name, "—"), tips: pickCount(o), win_rate: pickWinRate(o) }
  })

  // Timeline: Oracle teraz zwraca skumulowane win_rate + roi (nowe pola)
  const timeline: TimelinePoint[] = (Array.isArray(r.timeline) ? r.timeline : []).map((p) => {
    const o = (p ?? {}) as Record<string, unknown>
    const roiRaw = o.roi
    return {
      date: text(o.date),
      win_rate: pickWinRate(o),
      roi: roiRaw == null ? 0 : num(roiRaw),
      tips: pickCount(o),
    }
  })

  return {
    generated_at: String(r.generated_at ?? new Date().toISOString()),
    range_days: num(sum.period_days, 30),
    source: "live",
    summary,
    timeline,
    by_market,
    by_league,
    q_score_buckets,
  }
}

// ——— mecz / forma / ligi (defensywnie) ———

function rec(x: unknown): Record<string, unknown> {
  return (x ?? {}) as Record<string, unknown>
}

function pickId(o: Record<string, unknown>, keys: string[]): string | number | null {
  for (const k of keys) {
    const v = o[k]
    if (v != null && v !== "") return v as string | number
  }
  return null
}

// Procent w 0..100 (akceptuje 0..1 lub 0..100).
function pct(x: unknown): number | null {
  if (x == null) return null
  const n = Number(x)
  if (!Number.isFinite(n)) return null
  return clamp(Math.round((n <= 1 ? n * 100 : n) * 10) / 10, 0, 100)
}

function numOrNull(x: unknown): number | null {
  if (x == null) return null
  const n = Number(x)
  return Number.isFinite(n) ? n : null
}

function scoreLine(home: unknown, away: unknown, fallback?: unknown): string | undefined {
  const h = numOrNull(home)
  const a = numOrNull(away)
  if (h != null && a != null) return `${h}:${a}`
  const raw = text(fallback)
  return raw || undefined
}

function adaptPrediction(raw: unknown): MatchPrediction {
  const p = rec(raw)
  const model_prob = prob(p.model_prob)
  const odds = oddsValue(p.odds)
  const rawEdge = Number(p.edge)
  const edge = Number.isFinite(rawEdge) ? rawEdge : odds > 0 ? model_prob - 1 / odds : 0
  // Oracle podaje gotowy market_label (np. "O1.5 Gość") — użyj go, inaczej mapuj bet_side.
  const label = text(p.market_label) || mapBetSide(p.bet_side)
  return {
    bet_type: mapBetType(p.bet_type),
    bet_side: label || "—",
    model_prob,
    odds,
    q_score: qScore(p.q_score),
    edge,
    actual_result: mapResult(p),
  }
}

export function adaptMatch(raw: unknown): MatchInfo {
  const r = rec(raw)
  const m = rec(r.match ?? r)
  const preds = Array.isArray(r.predictions)
    ? r.predictions
    : Array.isArray(m.predictions)
      ? (m.predictions as unknown[])
      : []
  const found =
    r.found === true ||
    (r.found !== false && (r.match != null || m.event_id != null || m.id != null || m.home_team != null || m.home != null))

  const h2hArr = Array.isArray(r.h2h) ? (r.h2h as unknown[]) : []
  const h2h_matches = h2hArr.map((x) => {
    const o = rec(x)
    return {
      home: text(o.home_team ?? o.home, "—"),
      away: text(o.away_team ?? o.away, "—"),
      score: scoreLine(o.home_score, o.away_score, o.score) ?? "—",
      date: text(o.date),
    }
  })

  return {
    found: Boolean(found),
    event_id: (r.event_id ?? m.event_id ?? m.id ?? "") as string | number,
    home: text(m.home_team ?? m.home, "—"),
    away: text(m.away_team ?? m.away, "—"),
    league: text(m.league, "—"),
    kickoff_utc: normalizeIso(m.match_date ?? m.kickoff_utc ?? m.date),
    // ID nie ma w /match — ustawiane później ze standings (po team_id).
    home_id: pickId(m, ["home_id", "home_team_id", "homeId"]),
    away_id: pickId(m, ["away_id", "away_team_id", "awayId"]),
    btts_pct: pct(r.btts_prob ?? m.btts_pct ?? m.btts),
    over15_pct: pct(r.over_1_5_prob ?? m.over_1_5 ?? m.over15_pct),
    over25_pct: pct(r.over_2_5_prob ?? m.over_2_5 ?? m.over25_pct),
    avg_goals: numOrNull(m.avg_goals ?? r.avg_goals),
    h2h: numOrNull(r.h2h_count ?? m.h2h_count),
    h2h_matches,
    predictions: (preds as unknown[]).map(adaptPrediction),
  }
}

function formResult(raw: unknown): "W" | "D" | "L" {
  const m = rec(raw)
  const r = String(m.result ?? m.outcome ?? "").toUpperCase()
  if (r.startsWith("W")) return "W"
  if (r.startsWith("L")) return "L"
  if (r.startsWith("D") || r.startsWith("R")) return "D" // draw / remis
  const gf = Number(m.gf ?? m.goals_for ?? m.scored)
  const ga = Number(m.ga ?? m.goals_against ?? m.conceded)
  if (Number.isFinite(gf) && Number.isFinite(ga)) {
    if (gf > ga) return "W"
    if (gf < ga) return "L"
    return "D"
  }
  return "D"
}

export function adaptForm(raw: unknown): TeamForm {
  const r = rec(raw)
  const list = Array.isArray(r.form) ? r.form : Array.isArray(r.matches) ? r.matches : []
  const matches: FormMatch[] = (list as unknown[]).map((mm) => {
    const m = rec(mm)
    const gf = m.goals_for
    const ga = m.goals_against
    const score = scoreLine(gf, ga, m.score)
    return {
      result: formResult(m),
      opponent: text(m.opponent) || undefined,
      score,
      date: text(m.date) || undefined,
    }
  })
  return {
    team: text(r.team_name ?? r.team, "—"),
    matches,
    btts_pct: pct(r.btts_pct),
    avg_gf: numOrNull(r.avg_goals_for ?? r.avg_gf),
    avg_ga: numOrNull(r.avg_goals_against ?? r.avg_ga),
  }
}

export function adaptStandings(raw: unknown): StandingRow[] {
  const r = rec(raw)
  const list = Array.isArray(raw) ? raw : Array.isArray(r.standings) ? r.standings : Array.isArray(r.table) ? r.table : []
  return (list as unknown[]).map((row, i) => {
    const o = rec(row)
    return {
      position: num(o.position ?? o.pos ?? o.rank ?? i + 1),
      team_id: pickId(o, ["team_id", "teamId", "id"]),
      team: text(o.team ?? o.name ?? o.team_name, "—"),
      played: num(o.played ?? o.mp ?? o.games ?? o.matches),
      points: num(o.points ?? o.pts),
      gf: num(o.gf ?? o.goals_for ?? o.scored),
      ga: num(o.ga ?? o.goals_against ?? o.conceded),
    }
  })
}

export function adaptScorers(raw: unknown): Scorer[] {
  const r = rec(raw)
  const list = Array.isArray(raw) ? raw : Array.isArray(r.scorers) ? r.scorers : Array.isArray(r.players) ? r.players : []
  return (list as unknown[]).map((row) => {
    const o = rec(row)
    return {
      player: text(o.player ?? o.name ?? o.player_name, "—"),
      team: text(o.team ?? o.team_name, "—"),
      goals: num(o.goals ?? o.g),
      assists: num(o.assists ?? o.a),
      appearances: o.appearances != null ? num(o.appearances) : undefined,
    }
  })
}
