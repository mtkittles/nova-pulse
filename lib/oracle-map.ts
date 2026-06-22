import "server-only"
import { getLeagueName } from "./leagues"
import type { BetType, RecommendationTier, Tip, TipsResponse } from "./types"
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
  OddsMarkets,
  QScoreBreakdown,
  QScoreFactor,
  Scorer,
  ScoreDist,
  SideStats,
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
  if (low === "home") return "Gospodarze"
  if (low === "away") return "Goście"
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

// Tier rekomendacji z Oracle → znormalizowany enum (null gdy brak/nieznany).
function mapTier(raw: unknown): RecommendationTier | null {
  const s = String(raw ?? "").toLowerCase().trim()
  if (s === "value") return "value"
  if (s === "watchlist" || s === "watch") return "watchlist"
  if (s === "analysis" || s === "analiza") return "analysis"
  return null
}

function isPrimary(o: Record<string, unknown>): boolean {
  return o.is_primary_recommendation === true || o.is_primary === true
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
  // Brak danych → null (NIGDY 0 — 0 wygląda jak realna ocena/kurs).
  const model_prob = numOrNull(t.model_prob)
  const odds = numOrNull(t.odds)
  // Edge: użyj realnego (może być ujemny); gdy brak, a mamy prob+odds → policz
  // przewagę nad kursem; gdy i tego brak → null.
  const edge =
    numOrNull(t.edge) ??
    (model_prob != null && odds != null && odds > 0 ? model_prob - 1 / odds : null)

  return {
    event_id: (t.af_fixture_id ?? t.event_id ?? t.fixture_id ?? t.match_id ?? t.id ?? "") as string | number,
    league: getLeagueName(String(t.league ?? "")),
    leagueCode: String(t.league ?? ""),
    home: String(t.home ?? t.home_team ?? ""),
    away: String(t.away ?? t.away_team ?? ""),
    // Gotowy URL herbu z Oracle, a w razie braku — zbudowany z team_id (API-Football).
    homeLogo: pickLogo(t.home_team_logo ?? t.home_logo ?? t.home_logo_url) ?? logoFromTeamId(t.home_team_id ?? t.home_id ?? t.homeId),
    awayLogo: pickLogo(t.away_team_logo ?? t.away_logo ?? t.away_logo_url) ?? logoFromTeamId(t.away_team_id ?? t.away_id ?? t.awayId),
    // null gdy mecz nie ma fixture (sierota) — inaczej znormalizowany ISO
    kickoff_utc: t.kickoff_utc != null ? normalizeIso(t.kickoff_utc) : t.match_date != null ? normalizeIso(t.match_date) : null,
    bet_type: mapBetType(t.bet_type),
    bet_type_raw: t.bet_type != null ? String(t.bet_type) : undefined,
    bet_side: mapBetSide(t.bet_side),
    bet_side_raw: t.bet_side != null ? String(t.bet_side) : undefined,
    model_prob,
    odds,
    edge,
    q_score: numOrNull(t.q_score),
    actual_result: mapResult(t),
    is_primary: isPrimary(t),
    tier: mapTier(t.recommendation_tier ?? t.tier),
    home_score: t.home_score != null ? num(t.home_score) : null,
    away_score: t.away_score != null ? num(t.away_score) : null,
    match_status: t.match_status != null ? String(t.match_status) : undefined,
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

  // Zachowaj surową etykietę rynku z Oracle ("Team O1.5", "BTTS", "Over", "1X2", "Handicap").
  const by_market: MarketStat[] = []
  for (const [k, v] of asEntries(r.by_market)) {
    by_market.push({ label: String(k), tips: pickCount(v), win_rate: pickWinRate(v), roi: pickRoi(v) })
  }

  const by_league: LeagueStat[] = (Array.isArray(r.by_league) ? r.by_league : []).map((l) => {
    const o = (l ?? {}) as Record<string, unknown>
    // Oracle zwraca league_name (np. "Superettan"); zachowaj fallbacki.
    return { league: String(o.league_name ?? o.league ?? o.name ?? "—"), tips: pickCount(o), win_rate: pickWinRate(o), roi: pickRoi(o) }
  })

  const timeline: TimelinePoint[] = (Array.isArray(r.timeline) ? r.timeline : []).map((p) => {
    const o = (p ?? {}) as Record<string, unknown>
    return { date: String(o.date ?? ""), win_rate: pickWinRate(o), roi: pickRoi(o), tips: pickCount(o) }
  })

  // Oracle zwraca tablicę obiektów z polem "range" ("50-59", "60-69"...).
  const rawBuckets = r.q_score_buckets
  const bucketRows: { o: Record<string, unknown>; key: string }[] = Array.isArray(rawBuckets)
    ? (rawBuckets as unknown[]).map((v) => {
        const o = (v ?? {}) as Record<string, unknown>
        return { o, key: String(o.range ?? o.bucket ?? o.band ?? o.label ?? "") }
      })
    : rawBuckets && typeof rawBuckets === "object"
      ? Object.entries(rawBuckets as Record<string, unknown>).map(([k, v]) => ({ o: (v ?? {}) as Record<string, unknown>, key: k }))
      : []
  const q_score_buckets: QScoreBucket[] = bucketRows
    .filter((b) => b.key)
    .map((b) => ({
      bucket: b.key.replace(/-/g, "–"),
      tips: pickCount(b.o),
      win_rate: pickWinRate(b.o),
      roi: pickRoi(b.o),
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

// Standardowy URL herbu API-Football z team_id (gdy Oracle nie dał gotowego URL-a).
function logoFromTeamId(x: unknown): string | null {
  const n = Number(x)
  return Number.isFinite(n) && n > 0 ? `https://media.api-sports.io/football/teams/${n}.png` : null
}

// URL herbu/logo: zwraca string albo null (puste/„null" traktujemy jak brak).
function pickLogo(x: unknown): string | null {
  if (x == null) return null
  const s = String(x).trim()
  if (!s || s.toLowerCase() === "null" || s.toLowerCase() === "none") return null
  return s
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

// Rozbicie Q-Score: tolerancyjnie — tablica factors[] lub obiekt {label: delta}.
function adaptQScoreBreakdown(raw: unknown): QScoreBreakdown | null {
  if (raw == null || typeof raw !== "object") return null
  const o = rec(raw)
  let factors: QScoreFactor[] = []
  if (Array.isArray(o.factors)) {
    factors = (o.factors as unknown[])
      .map((f) => {
        const r = rec(f)
        return { label: String(r.label ?? r.name ?? ""), delta: num(r.delta ?? r.value ?? r.points) }
      })
      .filter((f) => f.label)
  } else {
    for (const [k, v] of Object.entries(o)) {
      if (["total", "base", "score", "q_score", "q"].includes(k.toLowerCase())) continue
      const d = Number(v)
      if (Number.isFinite(d)) factors.push({ label: k, delta: d })
    }
  }
  if (factors.length === 0 && o.total == null) return null
  const base = o.base != null ? num(o.base) : 50
  const sum = factors.reduce((a, f) => a + f.delta, 0)
  const total = o.total != null ? num(o.total) : o.score != null ? num(o.score) : base + sum
  return { total, base, factors }
}

function adaptPrediction(raw: unknown): MatchPrediction {
  const p = rec(raw)
  // Czytaj realne wartości (z fallbackiem na alternatywne nazwy); brak → null, NIGDY 0.
  const model_prob = numOrNull(p.model_prob ?? p.probability ?? p.prob)
  const odds = numOrNull(p.odds ?? p.odd)
  const q_score = numOrNull(p.q_score ?? p.qscore ?? p.q)
  // Edge: użyj podanego; gdy brak, a mamy prob+odds → policz przewagę nad kursem.
  const edge =
    numOrNull(p.edge) ??
    (model_prob != null && odds != null && odds > 0 ? model_prob - 1 / odds : null)
  // Oracle podaje gotowy market_label (np. "O1.5 Gość") — użyj go, inaczej mapuj bet_side.
  const label = p.market_label != null ? String(p.market_label) : mapBetSide(p.bet_side)
  return {
    bet_type: mapBetType(p.bet_type),
    bet_type_raw: p.bet_type != null ? String(p.bet_type) : undefined,
    bet_side_raw: p.bet_side != null ? String(p.bet_side) : undefined,
    bet_side: label,
    model_prob,
    odds,
    q_score,
    edge,
    actual_result: mapResult(p),
    is_primary: isPrimary(p),
    tier: mapTier(p.recommendation_tier ?? p.tier),
    // Wynik końcowy z predykcji (gdy Oracle dołącza po rozliczeniu).
    actual_home_score: numOrNull(p.actual_home_score ?? p.final_home_score ?? p.home_score),
    actual_away_score: numOrNull(p.actual_away_score ?? p.final_away_score ?? p.away_score),
    q_score_breakdown: adaptQScoreBreakdown(p.q_score_breakdown ?? p.qscore_breakdown ?? p.q_breakdown),
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
    event_id: (r.af_fixture_id ?? m.af_fixture_id ?? r.event_id ?? m.event_id ?? m.fixture_id ?? m.match_id ?? m.id ?? "") as string | number,
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

// Tolerancyjny bool: true/false/1/0/"yes"/"no"/"tak"/"nie" → boolean; brak → null.
function boolOrNull(x: unknown): boolean | null {
  if (x == null) return null
  if (typeof x === "boolean") return x
  const s = String(x).toLowerCase().trim()
  if (["1", "true", "yes", "tak", "t", "y"].includes(s)) return true
  if (["0", "false", "no", "nie", "n", "f"].includes(s)) return false
  return null
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
  // Oracle zwraca formę pod kluczem form_by_market; zachowujemy fallbacki.
  const list = Array.isArray(r.form_by_market)
    ? r.form_by_market
    : Array.isArray(r.form)
      ? r.form
      : Array.isArray(r.matches)
        ? r.matches
        : Array.isArray(r.recent)
          ? r.recent
          : []
  const matches: FormMatch[] = (list as unknown[]).map((mm) => {
    const m = rec(mm)
    // orientacja: home_away → która strona to nasza drużyna
    const ha = String(m.home_away ?? m.venue ?? m.location ?? "").toLowerCase()
    const isHome = m.home != null ? Boolean(m.home) : ha ? ha.startsWith("h") || ha.includes("dom") : undefined
    const hs = m.home_score != null ? num(m.home_score) : undefined
    const as = m.away_score != null ? num(m.away_score) : undefined

    let gf: number | undefined
    let ga: number | undefined
    if (hs != null && as != null && isHome != null) {
      gf = isHome ? hs : as
      ga = isHome ? as : hs
    } else {
      const gfRaw = m.goals_for ?? m.gf ?? m.scored
      const gaRaw = m.goals_against ?? m.ga ?? m.conceded
      gf = gfRaw != null ? num(gfRaw) : undefined
      ga = gaRaw != null ? num(gaRaw) : undefined
    }

    const score = gf != null && ga != null ? `${gf}:${ga}` : m.score != null ? String(m.score) : undefined
    // Rynki: preferuj jawne pola Oracle; w razie braku policz z gf/ga.
    const total = gf != null && ga != null ? gf + ga : null
    const btts = boolOrNull(m.btts) ?? (gf != null && ga != null ? gf > 0 && ga > 0 : null)
    const over15 = boolOrNull(m.over_1_5 ?? m.over15) ?? (total != null ? total > 1 : null)
    const over25 = boolOrNull(m.over_2_5 ?? m.over25) ?? (total != null ? total > 2 : null)
    const teamOver15 = boolOrNull(m.team_over_1_5 ?? m.team_over15) ?? (gf != null ? gf > 1 : null)
    return {
      result: formResult(m),
      opponent: m.opponent != null ? String(m.opponent) : undefined,
      score,
      date: m.date != null ? String(m.date) : undefined,
      gf,
      ga,
      home: isHome,
      btts,
      over15,
      over25,
      teamOver15,
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
      team: pickName(o.team ?? o.name ?? o.team_name) ?? "—",
      logo: pickLogo(o.team_logo ?? o.logo ?? o.crest),
      played: num(o.played ?? o.mp ?? o.games ?? o.matches),
      points: num(o.points ?? o.pts),
      gf: num(o.gf ?? o.goals_for ?? o.scored),
      ga: num(o.ga ?? o.goals_against ?? o.conceded),
    }
  })
}

// URL logo ligi z nagłówka odpowiedzi /league/{code}/standings (gdy dostępne).
export function adaptLeagueLogo(raw: unknown): string | null {
  const r = rec(raw)
  const league = rec(r.league)
  return pickLogo(r.league_logo ?? league.logo ?? r.logo)
}

export function adaptScorers(raw: unknown): Scorer[] {
  const r = rec(raw)
  const list = Array.isArray(raw) ? raw : Array.isArray(r.scorers) ? r.scorers : Array.isArray(r.players) ? r.players : []
  return (list as unknown[]).map((row) => {
    const o = rec(row)
    return {
      player: pickName(o.player ?? o.name ?? o.player_name) ?? "—",
      team: pickName(o.team ?? o.team_name) ?? "—",
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

// Nazwa z pola, które może być stringiem albo obiektem {name,...} (Oracle czasem zagnieżdża).
function pickName(v: unknown): string | null {
  if (v == null) return null
  if (typeof v === "string") return v
  if (typeof v === "object") {
    const o = v as Record<string, unknown>
    const n = o.name ?? o.label ?? o.title ?? o.full_name
    return n != null ? String(n) : null
  }
  return String(v)
}

export function adaptTeam(raw: unknown): TeamSeason | null {
  const r = rec(raw)
  const t = rec(r.team ?? r)
  const found = r.found !== false && (t.team_id != null || t.id != null || t.name != null || t.team != null)
  if (!found) return null

  // Statystyki mogą być na wierzchu lub zagnieżdżone (stats/season/...). Wierzch ma priorytet.
  const st: Record<string, unknown> = {
    ...rec(t.stats),
    ...rec(t.season_stats),
    ...rec(t.current_season),
    ...rec(t.season),
    ...t,
  }

  const leagueName = pickName(t.league ?? st.league) ?? "—"
  const leagueCountry =
    pickName(t.country ?? st.country) ??
    (typeof t.league === "object" ? pickName((t.league as Record<string, unknown>).country) : null) ??
    "—"

  return {
    team_id: (t.team_id ?? t.id ?? "") as string | number,
    name: pickName(t.name ?? t.team_name ?? t.team) ?? "—",
    league: leagueName,
    country: leagueCountry,
    logo: pickLogo(t.team_logo ?? t.logo ?? t.logo_url ?? t.crest),
    played: num(st.played ?? st.mp ?? st.games ?? st.matches ?? st.total_matches ?? st.matches_played ?? st.games_played ?? st.appearances),
    wins: num(st.wins ?? st.won ?? st.win ?? st.w),
    draws: num(st.draws ?? st.draw ?? st.drawn ?? st.d),
    losses: num(st.losses ?? st.lost ?? st.loss ?? st.l),
    gf: num(st.gf ?? st.goals_for ?? st.scored ?? st.goals_scored),
    ga: num(st.ga ?? st.goals_against ?? st.conceded ?? st.goals_conceded),
    position: st.position != null ? num(st.position) : st.rank != null ? num(st.rank) : undefined,
    btts_pct: pct(st.btts_pct ?? st.btts ?? st.btts_percentage),
    over15_pct: pct(st.over_1_5_pct ?? st.over15_pct ?? st.over_1_5 ?? st.over_1_5_percentage),
    over25_pct: pct(st.over_2_5_pct ?? st.over25_pct ?? st.over_2_5 ?? st.over_2_5_percentage),
    home_stats: sideStats(t.home_stats ?? rec(t.home_away_split).home ?? t.home ?? st.home_stats),
    away_stats: sideStats(t.away_stats ?? rec(t.home_away_split).away ?? t.away ?? st.away_stats),
    form: resultsFromForm(t.form ?? t.recent_form ?? st.form ?? r.form),
    scorers: adaptScorers(t.scorers ?? t.top_scorers ?? r.scorers ?? r.top_scorers),
  }
}

function sideStats(raw: unknown): SideStats | null {
  if (!raw || typeof raw !== "object") return null
  const o = rec(raw)
  const s: SideStats = {
    played: o.played != null ? num(o.played) : undefined,
    gf_avg: numOrNull(o.gf_avg ?? o.avg_gf ?? o.avg_goals_for),
    ga_avg: numOrNull(o.ga_avg ?? o.avg_ga ?? o.avg_goals_against),
    btts_pct: pct(o.btts_pct ?? o.btts),
    over15_pct: pct(o.over_1_5_pct ?? o.over15_pct ?? o.over_1_5),
    over25_pct: pct(o.over_2_5_pct ?? o.over25_pct ?? o.over_2_5),
    clean_sheets_pct: pct(o.clean_sheets_pct ?? o.clean_sheets ?? o.cs_pct ?? o.clean_sheet_pct),
  }
  const hasAny = Object.values(s).some((v) => v != null)
  return hasAny ? s : null
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
      event_id: (o.af_fixture_id ?? o.event_id ?? o.fixture_id ?? o.match_id ?? o.id ?? "") as string | number,
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

// Kursy rynków: czytaj 1:1 z r.odds_markets (klucze zgodne z Oracle). Brak → null.
export function adaptOddsMarkets(r: unknown): OddsMarkets | null {
  const raw = (r as Record<string, unknown>)?.odds_markets
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, number | null>
  return {
    btts_yes: o.btts_yes ?? null,
    btts_no: o.btts_no ?? null,
    home_win: o.home_win ?? null,
    draw: o.draw ?? null,
    away_win: o.away_win ?? null,
    over25: o.over25 ?? null,
    over35: o.over35 ?? null,
    cs_32: o.cs_32 ?? null,
    cs_23: o.cs_23 ?? null,
    home_team_o15: o.home_team_o15 ?? null,
    away_team_o15: o.away_team_o15 ?? null,
  }
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

  const predictions = (preds as unknown[]).map(adaptPrediction)

  return {
    found: Boolean(found),
    event_id: (r.af_fixture_id ?? m.af_fixture_id ?? r.event_id ?? m.event_id ?? m.fixture_id ?? m.match_id ?? m.id ?? "") as string | number,
    home,
    away,
    homeLogo: pickLogo(m.home_team_logo ?? m.home_logo),
    awayLogo: pickLogo(m.away_team_logo ?? m.away_logo),
    league: getLeagueName(String(m.league_code ?? r.league_code ?? m.league ?? "")),
    leagueCode: String(m.league_code ?? r.league_code ?? m.league ?? ""),
    kickoff_utc: normalizeIso(m.match_date ?? m.kickoff_utc ?? m.date),
    stadium: m.stadium != null ? String(m.stadium) : m.venue != null ? String(m.venue) : null,
    status: mapStatus(m.status ?? r.status, normalizeIso(m.match_date ?? m.kickoff_utc ?? m.date)),
    // Wynik końcowy (źródło prawdy po meczu) — defensywnie z wielu nazw pól.
    home_score: numOrNull(m.home_score ?? m.actual_home_score ?? m.final_home_score ?? r.home_score ?? r.actual_home_score),
    away_score: numOrNull(m.away_score ?? m.actual_away_score ?? m.final_away_score ?? r.away_score ?? r.actual_away_score),
    home_id: pickId(m, ["home_id", "home_team_id", "homeId"]),
    away_id: pickId(m, ["away_id", "away_team_id", "awayId"]),
    predictions,
    odds_markets: adaptOddsMarkets(r),
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
      event_id: (o.af_fixture_id ?? o.event_id ?? o.fixture_id ?? o.match_id ?? "") as string | number,
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
