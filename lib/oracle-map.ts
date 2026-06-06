import "server-only"
import type { BetType, Tip, TipsResponse } from "./types"
import type {
  LeagueStat,
  MarketStat,
  QScoreBucket,
  StatsResponse,
  TimelinePoint,
} from "./stats-types"

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
  const s = String(raw ?? "").trim()
  const low = s.toLowerCase()
  if (low === "yes") return "TAK"
  if (low === "no") return "NIE"
  if (low === "32_or_23" || low === "3:2/2:3" || low === "exact_32_23") return "3:2 / 2:3"
  return s
}

// Bezpieczne ISO: spacja → "T" (Safari!), dodaj "Z" gdy brak strefy.
function normalizeIso(d: unknown): string {
  let s = String(d ?? "").trim()
  if (!s) return ""
  s = s.replace(" ", "T")
  if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) s += "Z"
  return s
}

function mapResult(t: Record<string, unknown>): 0 | 1 | null {
  const r = t.actual_result
  if (r === 1 || r === "1") return 1
  if (r === 0 || r === "0") return 0
  // fallback dla starego kształtu ze "status"
  const s = String(t.status ?? "").toLowerCase()
  if (s === "won" || s === "win") return 1
  if (s === "lost" || s === "lose") return 0
  return null
}

export function adaptTip(raw: unknown): Tip {
  const t = (raw ?? {}) as Record<string, unknown>
  const model_prob = num(t.model_prob)
  const odds = num(t.odds)
  // użyj realnego edge (może być ujemny); gdy brak — policz przewagę nad kursem
  const rawEdge = Number(t.edge)
  const edge = Number.isFinite(rawEdge) ? rawEdge : odds > 0 ? model_prob - 1 / odds : 0

  return {
    event_id: (t.event_id as string | number) ?? "",
    league: String(t.league ?? "—"),
    home: String(t.home ?? t.home_team ?? ""),
    away: String(t.away ?? t.away_team ?? ""),
    kickoff_utc: normalizeIso(t.kickoff_utc ?? t.match_date),
    bet_type: mapBetType(t.bet_type),
    bet_side: mapBetSide(t.bet_side),
    model_prob,
    odds,
    edge,
    q_score: num(t.q_score),
    actual_result: mapResult(t),
  }
}

export function adaptTips(raw: unknown): TipsResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const list = Array.isArray(r.tips) ? r.tips : []
  return {
    date: String(r.date ?? new Date().toISOString().slice(0, 10)),
    tips: list.map(adaptTip),
  }
}

// ——— statystyki ———

function pickCount(o: unknown): number {
  const r = (o ?? {}) as Record<string, unknown>
  return num(r.tips ?? r.total ?? r.count ?? r.n ?? 0)
}
function pickWinRate(o: unknown): number {
  const r = (o ?? {}) as Record<string, unknown>
  return num(r.win_rate ?? r.winrate ?? 0)
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

export function adaptStats(raw: unknown): StatsResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const sum = (r.summary ?? {}) as Record<string, unknown>
  const wins = num(sum.won ?? sum.wins)
  const losses = num(sum.lost ?? sum.losses)
  const total = num(sum.total ?? sum.total_tips ?? wins + losses)

  const summary = {
    total_tips: total,
    settled_tips: num(sum.settled_tips ?? wins + losses),
    wins,
    losses,
    win_rate: num(sum.win_rate),
    roi: sum.roi == null ? 0 : num(sum.roi),
    current_streak: num(sum.current_streak),
    avg_q_score: num(sum.avg_q_score),
  }

  const by_market: MarketStat[] = []
  for (const [k, v] of asEntries(r.by_market)) {
    const bt = mapBetType(k)
    if (bt === "THRILLER") continue
    by_market.push({ bet_type: bt as MarketStat["bet_type"], tips: pickCount(v), win_rate: pickWinRate(v), roi: pickRoi(v) })
  }

  const by_league: LeagueStat[] = (Array.isArray(r.by_league) ? r.by_league : []).map((l) => {
    const o = (l ?? {}) as Record<string, unknown>
    return { league: String(o.league ?? o.name ?? "—"), tips: pickCount(o), win_rate: pickWinRate(o) }
  })

  const timeline: TimelinePoint[] = (Array.isArray(r.timeline) ? r.timeline : []).map((p) => {
    const o = (p ?? {}) as Record<string, unknown>
    return { date: String(o.date ?? ""), win_rate: pickWinRate(o), roi: pickRoi(o), tips: pickCount(o) }
  })

  const q_score_buckets: QScoreBucket[] = asEntries(r.q_score_buckets).map(([k, v]) => ({
    bucket: String(k).replace(/-/g, "–"),
    tips: pickCount(v),
    win_rate: pickWinRate(v),
  }))

  return {
    generated_at: String(r.generated_at ?? new Date().toISOString()),
    range_days: num(sum.period_days, 30),
    summary,
    timeline,
    by_market,
    by_league,
    q_score_buckets,
  }
}
