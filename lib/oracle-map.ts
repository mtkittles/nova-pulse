import "server-only"
import type { BetType, Tip, TipsResponse } from "./types"
import type {
  LeagueStat,
  MarketStat,
  QScoreBucket,
  StatsResponse,
  TimelinePoint,
} from "./stats-types"

// Adaptery: realny kształt API Oracle → wewnętrzne typy strony.
// Oracle używa innych nazw pól i enumów (home_team, match_date, "O15", status…),
// więc tłumaczymy je tutaj w jednym miejscu. Defensywnie — tolerujemy drobne
// różnice (różne nazwy liczników itp.).

function num(x: unknown, def = 0): number {
  const n = Number(x)
  return Number.isFinite(n) ? n : def
}

function mapBetType(raw: unknown): BetType {
  const k = String(raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "")
  if (k.startsWith("BTTS")) return "BTTS"
  if (k.startsWith("O15") || k.includes("OVER")) return "OVER_1_5"
  if (k.startsWith("MIX")) return "MIX"
  if (k.startsWith("THRIL")) return "THRILLER"
  return "MIX"
}

function mapBetSide(raw: unknown): string {
  const s = String(raw ?? "").toLowerCase()
  if (s === "yes") return "TAK"
  if (s === "no") return "NIE"
  if (s === "32_or_23") return "3:2 / 2:3"
  return String(raw ?? "")
}

// match_date bez strefy → traktuj jako UTC (bot zapisuje utc_date).
function toIsoUtc(d: unknown): string {
  const s = String(d ?? "")
  if (!s) return new Date().toISOString()
  return /[zZ]|[+-]\d{2}:?\d{2}$/.test(s) ? s : `${s}Z`
}

function statusToResult(s: unknown): 0 | 1 | null {
  const v = String(s ?? "").toLowerCase()
  if (v === "won" || v === "win") return 1
  if (v === "lost" || v === "lose") return 0
  return null
}

type RawTip = Record<string, unknown>

export function adaptTips(raw: unknown): TipsResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const list = Array.isArray(r.tips) ? (r.tips as RawTip[]) : []
  const tips: Tip[] = list.map((t) => {
    const bet_type = mapBetType(t.bet_type)
    const model_prob = num(t.model_prob)
    const odds = num(t.odds)
    // Oracle nie zwraca edge — liczymy przewagę nad kursem (prob − implikowane).
    const edge = odds > 0 ? model_prob - 1 / odds : 0
    return {
      event_id: (t.event_id as string | number) ?? `${t.home_team}-${t.away_team}-${t.match_date}`,
      league: String(t.league ?? "—"),
      home: String(t.home_team ?? t.home ?? "—"),
      away: String(t.away_team ?? t.away ?? "—"),
      kickoff_utc: toIsoUtc(t.match_date ?? t.kickoff_utc),
      bet_type,
      bet_side: mapBetSide(t.bet_side),
      model_prob,
      odds,
      edge,
      q_score: num(t.q_score),
      actual_result: statusToResult(t.status),
    }
  })
  return { date: String(r.date ?? new Date().toISOString().slice(0, 10)), tips }
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

// by_market / q_score_buckets mogą być obiektem {klucz:{…}} lub tablicą.
function asEntries(x: unknown): [string, unknown][] {
  if (Array.isArray(x)) return x.map((v) => [String((v as Record<string, unknown>)?.bet_type ?? (v as Record<string, unknown>)?.bucket ?? ""), v])
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
    if (bt === "THRILLER") continue // MarketStat wyklucza THRILLER
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
