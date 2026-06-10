import "server-only"
import { getLeagueName } from "./leagues"
import type { BetType, Tip, TipsResponse } from "./types"
import type {
  LeagueStat,
  MarketStat,
  QScoreBucket,
  StatsResponse,
  TimelinePoint,
} from "./stats-types"
import type {
  CalendarDay,
  FormMatch,
  FormResult,
  H2HMatch,
  H2HSummary,
  MatchDetailed,
  MatchInfo,
  MatchPrediction,
  MatchStatus,
  Scorer,
  ScoreDist,
  StandingRow,
  TeamForm,
  TeamMetrics,
  TeamSeason,
  UpcomingMatch,
  UserPick,
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

// Bezpieczne ISO: spacja → "T" (Safari!), usuń mikrosekundy, dodaj "Z" gdy brak strefy.
function normalizeIso(d: unknown): string {
  let s = String(d ?? "").trim()
  if (!s) return ""
  s = s.replace(" ", "T").replace(/\.\d+/, "")
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
    league: getLeagueName(String(t.league ?? "")),
    leagueCode: String(t.league ?? ""),
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
  return Math.round((n <= 1 ? n * 100 : n) * 10) / 10
}

function numOrNull(x: unknown): number | null {
  if (x == null) return null
  const n = Number(x)
  return Number.isFinite(n) ? n : null
}

function adaptPrediction(raw: unknown): MatchPrediction {
  const p = rec(raw)
  const model_prob = num(p.model_prob)
  const odds = num(p.odds)
  const rawEdge = Number(p.edge)
  const edge = Number.isFinite(rawEdge) ? rawEdge : odds > 0 ? model_prob - 1 / odds : 0
  // Oracle podaje gotowy market_label (np. "O1.5 Gość") — użyj go, inaczej mapuj bet_side.
  const label = p.market_label != null ? String(p.market_label) : mapBetSide(p.bet_side)
  return {
    bet_type: mapBetType(p.bet_type),
    bet_side: label,
    model_prob,
    odds,
    q_score: num(p.q_score),
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
  const found = r.found === true || (r.found !== false && r.match != null)

  const h2hArr = Array.isArray(r.h2h) ? (r.h2h as unknown[]) : []
  const h2h_matches = h2hArr.map((x) => {
    const o = rec(x)
    return {
      home: String(o.home_team ?? o.home ?? "—"),
      away: String(o.away_team ?? o.away ?? "—"),
      score: `${num(o.home_score)}:${num(o.away_score)}`,
      date: o.date != null ? String(o.date) : "",
    }
  })

  return {
    found: Boolean(found),
    event_id: (r.event_id ?? m.event_id ?? m.id ?? "") as string | number,
    home: String(m.home_team ?? m.home ?? "—"),
    away: String(m.away_team ?? m.away ?? "—"),
    league: getLeagueName(String(m.league ?? "")),
    leagueCode: String(m.league ?? ""),
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
    const score = gf != null && ga != null ? `${num(gf)}:${num(ga)}` : m.score != null ? String(m.score) : undefined
    return {
      result: formResult(m),
      opponent: m.opponent != null ? String(m.opponent) : undefined,
      score,
      date: m.date != null ? String(m.date) : undefined,
    }
  })
  return {
    team: String(r.team_name ?? r.team ?? "—"),
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
      team: String(o.team ?? o.name ?? o.team_name ?? "—"),
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
      player: String(o.player ?? o.name ?? o.player_name ?? "—"),
      team: String(o.team ?? o.team_name ?? "—"),
      goals: num(o.goals ?? o.g),
      assists: num(o.assists ?? o.a),
      appearances: o.appearances != null ? num(o.appearances) : undefined,
    }
  })
}

// ——— kalendarz (liczniki typów per dzień) ———
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function adaptCalendar(raw: unknown): CalendarDay[] {
  const r = rec(raw)
  let list: unknown[] = []
  if (Array.isArray(raw)) list = raw
  else if (Array.isArray(r.days)) list = r.days as unknown[]
  else if (Array.isArray(r.calendar)) list = r.calendar as unknown[]
  else if (r.days && typeof r.days === "object")
    list = Object.entries(r.days as Record<string, unknown>).map(([date, v]) => ({ date, ...rec(v) }))
  else if (raw && typeof raw === "object")
    // mapa data→liczniki na poziomie głównym
    list = Object.entries(r)
      .filter(([k]) => DATE_RE.test(k))
      .map(([date, v]) => ({ date, ...rec(v) }))

  return (list as unknown[])
    .map((d) => {
      const o = rec(d)
      const matches = num(o.matches ?? o.match_count ?? o.matches_count)
      const hasAnalyzed = o.analyzed != null
      const analyzed = hasAnalyzed ? num(o.analyzed) : undefined
      return {
        date: String(o.date ?? ""),
        tips: num(o.tips ?? o.count ?? o.total),
        matches,
        leagues: num(o.leagues ?? o.league_count ?? o.leagues_count),
        analyzed,
        below_threshold: o.below_threshold != null ? num(o.below_threshold) : undefined,
        no_data: o.no_data != null ? num(o.no_data) : analyzed != null ? Math.max(0, matches - analyzed) : undefined,
        has_worldcup:
          o.has_worldcup === true ||
          o.worldcup === true ||
          /world.?cup|mundial|wc_2026/i.test(String(o.leagues_list ?? o.competitions ?? "")),
      }
    })
    .filter((d) => DATE_RE.test(d.date))
}

// ——— drużyna / nadchodzące mecze ———

function oneResult(s: unknown): FormResult {
  const c = String(s ?? "").trim().toUpperCase()[0]
  if (c === "W") return "W"
  if (c === "L") return "L"
  return "D"
}

// form może być: ["W","D",...] / "WWDLW" / [{result/gf/ga}, ...]
export function resultsFromForm(x: unknown): FormResult[] {
  if (Array.isArray(x))
    return x.map((it) => (it && typeof it === "object" ? formResult(it) : oneResult(it)))
  if (typeof x === "string") return x.replace(/[^WDLwdl]/g, "").split("").map(oneResult)
  return []
}

export function adaptScorerList(raw: unknown): Scorer[] {
  // akceptuje tablicę lub {scorers:[...]}/{players:[...]}
  return adaptScorers(raw)
}

export function adaptTeam(raw: unknown): TeamSeason | null {
  const r = rec(raw)
  const t = rec(r.team ?? r)
  const found = r.found !== false && (t.team_id != null || t.id != null || t.name != null || t.team != null)
  if (!found) return null
  return {
    team_id: (t.team_id ?? t.id ?? "") as string | number,
    name: String(t.name ?? t.team_name ?? t.team ?? "—"),
    league: String(t.league ?? "—"),
    country: String(t.country ?? "—"),
    logo: t.logo != null ? String(t.logo) : t.logo_url != null ? String(t.logo_url) : t.crest != null ? String(t.crest) : null,
    played: num(t.played ?? t.mp ?? t.games),
    wins: num(t.wins ?? t.won ?? t.w),
    draws: num(t.draws ?? t.draw ?? t.d),
    losses: num(t.losses ?? t.lost ?? t.l),
    gf: num(t.gf ?? t.goals_for ?? t.scored),
    ga: num(t.ga ?? t.goals_against ?? t.conceded),
    btts_pct: pct(t.btts_pct ?? t.btts),
    over15_pct: pct(t.over_1_5_pct ?? t.over15_pct ?? t.over_1_5),
    over25_pct: pct(t.over_2_5_pct ?? t.over25_pct ?? t.over_2_5),
    form: resultsFromForm(t.form ?? t.recent_form ?? r.form),
    scorers: adaptScorers(t.scorers ?? t.top_scorers ?? r.scorers ?? r.top_scorers),
  }
}

export function adaptUpcoming(raw: unknown): UpcomingMatch[] {
  const r = rec(raw)
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(r.matches)
      ? (r.matches as unknown[])
      : Array.isArray(r.upcoming)
        ? (r.upcoming as unknown[])
        : Array.isArray(r.fixtures)
          ? (r.fixtures as unknown[])
          : []
  return (list as unknown[]).map((m) => {
    const o = rec(m)
    const preds = Array.isArray(o.predictions) ? (o.predictions as unknown[]) : []
    return {
      event_id: (o.event_id ?? o.id ?? "") as string | number,
      home: o.home_team != null || o.home != null ? String(o.home_team ?? o.home) : "",
      away: o.away_team != null || o.away != null ? String(o.away_team ?? o.away) : "",
      opponent: o.opponent != null ? String(o.opponent) : "",
      league: getLeagueName(String(o.league ?? "")),
      leagueCode: String(o.league ?? ""),
      kickoff_utc: normalizeIso(o.match_date ?? o.kickoff_utc ?? o.date),
      predictions: preds.map(adaptPrediction),
    }
  })
}

// ——— szczegółowy mecz (/match/{id}/detailed) ———

function round1(x: number): number {
  return Math.round(x * 10) / 10
}

function teamMetrics(raw: unknown, fallbackName: string): TeamMetrics | null {
  if (raw == null) return null
  const o = rec(raw)
  const played = num(o.played ?? o.games ?? o.matches)
  const gf = num(o.gf ?? o.goals_for ?? o.scored)
  const ga = num(o.ga ?? o.goals_against ?? o.conceded)
  const gf_avg = o.gf_avg != null ? num(o.gf_avg) : played ? gf / played : 0
  const ga_avg = o.ga_avg != null ? num(o.ga_avg) : played ? ga / played : 0
  const cs =
    pct(o.clean_sheets_pct) ??
    (o.clean_sheets != null && played ? Math.round((num(o.clean_sheets) / played) * 100) : 0)
  const fr = resultsFromForm(o.form ?? o.recent_form)
  const form_points = fr.length
    ? Math.round((fr.reduce((a, r) => a + (r === "W" ? 3 : r === "D" ? 1 : 0), 0) / (fr.length * 3)) * 100)
    : o.form_points != null
      ? Math.min(100, num(o.form_points))
      : 0
  return {
    name: String(o.name ?? o.team ?? fallbackName),
    gf_avg: round1(gf_avg),
    ga_avg: round1(ga_avg),
    btts_pct: pct(o.btts_pct ?? o.btts) ?? 0,
    over15_pct: pct(o.over_1_5_pct ?? o.over15_pct ?? o.over_1_5) ?? 0,
    clean_sheets_pct: cs ?? 0,
    form_points,
  }
}

function adaptScoreDist(x: unknown): ScoreDist[] {
  let list: ScoreDist[] = []
  if (Array.isArray(x)) {
    list = x.map((it) => {
      const o = rec(it)
      return { score: String(o.score ?? o.result ?? ""), count: num(o.count ?? o.freq ?? o.n) }
    })
  } else if (x && typeof x === "object") {
    list = Object.entries(x as Record<string, unknown>).map(([score, v]) => ({
      score,
      count: num(v && typeof v === "object" ? rec(v).count : v),
    }))
  }
  return list.filter((d) => /^\d+\s*[:\-]\s*\d+$/.test(d.score)).map((d) => ({ score: d.score.replace(/\s|-/g, ":"), count: d.count }))
}

// Macierz wyników 6×6 P(home=i, away=j), znormalizowana do sumy 1.
// Źródło: r.score_matrix (2D array lub obiekt "i:j"->p) lub fallback z rozkładu wyników.
function adaptScoreMatrix(raw: unknown, dist: ScoreDist[], size = 6): number[][] | null {
  const m: number[][] = Array.from({ length: size }, () => Array.from({ length: size }, () => 0))
  let any = false

  if (Array.isArray(raw)) {
    for (let i = 0; i < Math.min(size, raw.length); i++) {
      const row = raw[i]
      if (!Array.isArray(row)) continue
      for (let j = 0; j < Math.min(size, row.length); j++) {
        const v = num(row[j])
        if (v > 0) {
          m[i][j] = v
          any = true
        }
      }
    }
  } else if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      const mt = k.match(/^(\d+)\s*[:\-]\s*(\d+)$/)
      if (!mt) continue
      const i = Number(mt[1])
      const j = Number(mt[2])
      if (i < size && j < size) {
        m[i][j] = num(v && typeof v === "object" ? rec(v).count ?? rec(v).p : v)
        any = true
      }
    }
  }

  // fallback: zbuduj z rozkładu wyników (count)
  if (!any && dist.length) {
    for (const d of dist) {
      const mt = d.score.match(/^(\d+):(\d+)$/)
      if (!mt) continue
      const i = Number(mt[1])
      const j = Number(mt[2])
      if (i < size && j < size) {
        m[i][j] = d.count
        any = true
      }
    }
  }

  if (!any) return null
  const total = m.reduce((s, row) => s + row.reduce((a, b) => a + b, 0), 0)
  if (total <= 0) return null
  return m.map((row) => row.map((v) => v / total))
}

function h2hSummaryFrom(rawH2h: unknown[], homeName: string): H2HSummary {
  let hw = 0
  let aw = 0
  let dr = 0
  let btts = 0
  let goals = 0
  const n = rawH2h.length
  for (const it of rawH2h) {
    const o = rec(it)
    const hs = num(o.home_score)
    const as = num(o.away_score)
    const h = String(o.home_team ?? o.home ?? "")
    goals += hs + as
    if (hs > 0 && as > 0) btts++
    const homeIsThis = h.toLowerCase() === homeName.toLowerCase()
    if (hs === as) dr++
    else {
      const homeWon = hs > as
      if ((homeWon && homeIsThis) || (!homeWon && !homeIsThis)) hw++
      else aw++
    }
  }
  return {
    home_wins: hw,
    away_wins: aw,
    draws: dr,
    btts_pct: n ? Math.round((btts / n) * 100) : null,
    avg_goals: n ? round1(goals / n) : null,
  }
}

// Mapuje status z Oracle (API-Football status_short) na nasz stan.
// Kolejność istotna: postponed/cancelled, finished (przed live, bo "AET"⊃"et"),
// halftime, live, upcoming. Fallback timezone-aware z kickoff_utc.
function mapStatus(raw: unknown, kickoffUtc?: string): MatchStatus {
  const s = String(raw ?? "").toLowerCase().trim()
  const has = (...codes: string[]) => codes.some((c) => s === c || s.includes(c))

  if (s) {
    if (has("postponed", "pst", "przełoż")) return "postponed"
    if (has("cancel", "canc", "abandon", "abd", "susp", "int", "odwoł")) return "cancelled"
    if (s === "ht" || has("halftime", "half-time", "przerwa")) return "halftime"
    if (has("aet", "ft", "pen", "awd", "wo", "finished", "fin", "end", "zak", "full")) return "finished"
    if (s === "p" || has("1h", "2h", "et", "bt", "live", "in_play", "in-play", "inplay", "1st", "2nd"))
      return "live"
    if (has("ns", "tbd", "sched", "not started", "upcoming")) return "upcoming"
  }

  // Status nieznany/„scheduled" → wnioskuj z czasu rozpoczęcia.
  if (kickoffUtc) {
    const kickoff = new Date(kickoffUtc).getTime()
    if (Number.isFinite(kickoff)) {
      const minutesSince = (Date.now() - kickoff) / 60000
      if (minutesSince < 0) return "upcoming"
      if (minutesSince < 130) return "live"
      return "finished"
    }
  }

  return s ? "unknown" : "upcoming"
}

export function adaptMatchDetailed(raw: unknown): MatchDetailed {
  const r = rec(raw)
  const m = rec(r.match ?? r)
  const found = r.found === true || (r.found !== false && (r.match != null || m.home_team != null || m.home != null))
  const home = String(m.home_team ?? m.home ?? "—")
  const away = String(m.away_team ?? m.away ?? "—")

  const preds = Array.isArray(r.predictions)
    ? r.predictions
    : Array.isArray(m.predictions)
      ? (m.predictions as unknown[])
      : []

  const rawH2h = Array.isArray(r.h2h) ? (r.h2h as unknown[]) : Array.isArray(m.h2h) ? (m.h2h as unknown[]) : []
  const h2h_matches: H2HMatch[] = rawH2h.map((x) => {
    const o = rec(x)
    return {
      home: String(o.home_team ?? o.home ?? "—"),
      away: String(o.away_team ?? o.away ?? "—"),
      score: `${num(o.home_score)}:${num(o.away_score)}`,
      date: o.date != null ? String(o.date) : "",
    }
  })

  return {
    found: Boolean(found),
    event_id: (r.event_id ?? m.event_id ?? m.id ?? "") as string | number,
    home,
    away,
    league: getLeagueName(String(m.league ?? "")),
    leagueCode: String(m.league ?? ""),
    kickoff_utc: normalizeIso(m.match_date ?? m.kickoff_utc ?? m.date),
    stadium: m.stadium != null ? String(m.stadium) : m.venue != null ? String(m.venue) : null,
    status: mapStatus(m.status ?? r.status, normalizeIso(m.match_date ?? m.kickoff_utc ?? m.date)),
    home_id: pickId(m, ["home_id", "home_team_id", "homeId"]),
    away_id: pickId(m, ["away_id", "away_team_id", "awayId"]),
    predictions: (preds as unknown[]).map(adaptPrediction),
    home_metrics: teamMetrics(r.home_stats ?? m.home_stats ?? r.home ?? m.home, home),
    away_metrics: teamMetrics(r.away_stats ?? m.away_stats ?? r.away ?? m.away, away),
    h2h_matches,
    h2h_summary: (r.h2h_summary
      ? (() => {
          const o = rec(r.h2h_summary)
          return {
            home_wins: num(o.home_wins),
            away_wins: num(o.away_wins),
            draws: num(o.draws),
            btts_pct: pct(o.btts_pct),
            avg_goals: numOrNull(o.avg_goals),
          }
        })()
      : rawH2h.length
        ? h2hSummaryFrom(rawH2h, home)
        : null) as H2HSummary | null,
    score_distribution: adaptScoreDist(r.score_distribution ?? r.score_dist ?? m.score_distribution),
    score_matrix: adaptScoreMatrix(
      r.score_matrix ?? m.score_matrix ?? r.scoreline_matrix ?? r.dixon_coles_matrix,
      adaptScoreDist(r.score_distribution ?? r.score_dist ?? m.score_distribution),
    ),
    home_scorers: adaptScorers(r.home_scorers ?? r.home_top_scorers ?? rec(r.home).scorers),
    away_scorers: adaptScorers(r.away_scorers ?? r.away_top_scorers ?? rec(r.away).scorers),
  }
}

// ——— kupony użytkownika ———

function pickStatus(o: Record<string, unknown>): "pending" | "won" | "lost" {
  const s = String(o.status ?? "").toLowerCase()
  if (s === "won" || s === "win") return "won"
  if (s === "lost" || s === "lose") return "lost"
  if (s === "pending") return "pending"
  const r = mapResult(o)
  if (r === 1) return "won"
  if (r === 0) return "lost"
  return "pending"
}

export function adaptUserPicks(raw: unknown): UserPick[] {
  const r = rec(raw)
  const list = Array.isArray(raw) ? raw : Array.isArray(r.picks) ? (r.picks as unknown[]) : []
  return (list as unknown[]).map((p, i) => {
    const o = rec(p)
    return {
      id: (o.id ?? o.pick_id ?? `${o.event_id ?? i}`) as string | number,
      event_id: (o.event_id ?? "") as string | number,
      date: normalizeIso(o.kickoff_utc ?? o.match_date ?? o.date ?? o.created_at),
      home: String(o.home ?? o.home_team ?? "—"),
      away: String(o.away ?? o.away_team ?? "—"),
      league: String(o.league ?? "—"),
      bet_type: mapBetType(o.bet_type),
      bet_side: o.market_label != null ? String(o.market_label) : mapBetSide(o.bet_side),
      odds: num(o.odds),
      stake: num(o.stake, 0),
      status: pickStatus(o),
    }
  })
}
