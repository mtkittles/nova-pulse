import "server-only"
import type { WCGroup, WCInfo, WCMatch, WCStage, WCStanding, WCTie, WCStatus } from "./extra-types"
import { isOracleConfigured, oracleFetch } from "./oracle"

export const WC_START = "2026-06-11T18:00:00-06:00"

// ——— pomoc ———
function rec(x: unknown): Record<string, unknown> {
  return x && typeof x === "object" ? (x as Record<string, unknown>) : {}
}
function n(x: unknown): number {
  const v = Number(x)
  return Number.isFinite(v) ? v : 0
}
function nOrNull(x: unknown): number | null {
  if (x == null) return null
  const v = Number(x)
  return Number.isFinite(v) ? v : null
}
function s(x: unknown): string {
  return x != null ? String(x) : ""
}
function mapStage(raw: unknown): WCStage {
  const v = s(raw).toLowerCase()
  if (v.includes("final") && !v.includes("semi") && !v.includes("quarter")) return v.includes("3") ? "3RD" : "FINAL"
  if (v.includes("3rd") || v.includes("third")) return "3RD"
  if (v.includes("semi") || v === "sf") return "SF"
  if (v.includes("quarter") || v === "qf") return "QF"
  if (v.includes("16") || v === "r16") return "R16"
  if (v.includes("32") || v === "r32") return "R32"
  return "group"
}
function mapWcStatus(played: boolean, position: number): WCStatus {
  if (position <= 2) return "advance"
  if (position === 3) return "playoff"
  return "out"
}

// ——— MOCK ———
const NATIONS = [
  "Mexico", "Canada", "United States", "Brazil", "Argentina", "France", "England", "Spain",
  "Germany", "Portugal", "Netherlands", "Italy", "Belgium", "Croatia", "Uruguay", "Colombia",
  "Japan", "South Korea", "Australia", "Iran", "Saudi Arabia", "Qatar", "Morocco", "Senegal",
  "Ghana", "Nigeria", "South Africa", "Cameroon", "Ivory Coast", "Egypt", "Algeria", "Tunisia",
  "Ecuador", "Chile", "Peru", "Paraguay", "Poland", "Denmark", "Switzerland", "Serbia",
  "Austria", "Sweden", "Norway", "Turkey", "Ukraine", "Costa Rica", "Panama", "New Zealand",
]
const VENUES = [
  ["Meksyk", "Estadio Azteca"], ["Guadalajara", "Estadio Akron"], ["Monterrey", "Estadio BBVA"],
  ["Toronto", "BMO Field"], ["Vancouver", "BC Place"], ["Nowy Jork", "MetLife Stadium"],
  ["Los Angeles", "SoFi Stadium"], ["Dallas", "AT&T Stadium"], ["Miami", "Hard Rock Stadium"],
  ["Atlanta", "Mercedes-Benz Stadium"], ["Seattle", "Lumen Field"], ["Boston", "Gillette Stadium"],
]
const GROUPS = "ABCDEFGHIJKL".split("")

function mockGroups(): WCGroup[] {
  return GROUPS.map((name, gi) => {
    const teams: WCStanding[] = Array.from({ length: 4 }, (_, ti) => {
      const team = NATIONS[gi * 4 + ti] ?? `Drużyna ${gi}-${ti}`
      const position = ti + 1
      const win = [3, 2, 1, 0][ti]
      const draw = [0, 0, 0, 0][ti]
      const loss = [0, 1, 2, 3][ti]
      const gf = [7, 4, 3, 1][ti]
      const ga = [1, 3, 4, 7][ti]
      return {
        position,
        team,
        team_id: gi * 4 + ti + 1000,
        played: 3,
        win,
        draw,
        loss,
        gf,
        ga,
        points: win * 3 + draw,
        advance_pct: [92, 64, 28, 5][ti],
        status: mapWcStatus(true, position),
      }
    })
    return { name, teams }
  })
}

function mockMatches(): WCMatch[] {
  const groups = mockGroups()
  const out: WCMatch[] = []
  let idx = 0
  const dayMs = 864e5
  const base = new Date("2026-06-11T18:00:00Z").getTime()
  for (let gi = 0; gi < groups.length; gi++) {
    const g = groups[gi]
    const pairs: [number, number][] = [
      [0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2],
    ]
    for (let pi = 0; pi < pairs.length; pi++) {
      const [a, b] = pairs[pi]
      const ko = new Date(base + (gi + pi * 2) * dayMs * 0.5).toISOString()
      const [city, stadium] = VENUES[(gi + pi) % VENUES.length]
      const ph = 0.32 + ((idx * 7) % 40) / 100
      const pa = 0.28 + ((idx * 5) % 30) / 100
      out.push({
        event_id: `wc_${g.name}_${pi}`,
        home: g.teams[a].team,
        away: g.teams[b].team,
        home_id: g.teams[a].team_id,
        away_id: g.teams[b].team_id,
        group: g.name,
        stage: "group",
        stadium,
        city,
        kickoff_utc: ko,
        status: "upcoming",
        predicted_home: (idx % 3) + 1,
        predicted_away: idx % 2,
        prob_home: Math.min(0.7, ph),
        prob_draw: 0.26,
        prob_away: Math.min(0.6, pa),
        btts_pct: 45 + ((idx * 9) % 40),
        over25_pct: 40 + ((idx * 11) % 45),
        q_score: 55 + ((idx * 13) % 40),
      })
      idx++
    }
  }
  return out
}

function mockBracket(): WCTie[] {
  const stages: { stage: WCStage; count: number }[] = [
    { stage: "R32", count: 16 },
    { stage: "R16", count: 8 },
    { stage: "QF", count: 4 },
    { stage: "SF", count: 2 },
    { stage: "FINAL", count: 1 },
    { stage: "3RD", count: 1 },
  ]
  const ties: WCTie[] = []
  for (const st of stages) {
    for (let i = 0; i < st.count; i++) {
      ties.push({
        stage: st.stage,
        slot: `${st.stage}-${i + 1}`,
        home: st.stage === "R32" ? NATIONS[i * 2] : null,
        away: st.stage === "R32" ? NATIONS[i * 2 + 1] : null,
        home_id: st.stage === "R32" ? i * 2 + 1000 : null,
        away_id: st.stage === "R32" ? i * 2 + 1001 : null,
        winner: null,
        prob_home: 0.4 + ((i * 7) % 25) / 100,
      })
    }
  }
  return ties
}

function mockInfo(): WCInfo {
  const matches = mockMatches()
  const next = matches.find((m) => new Date(m.kickoff_utc).getTime() > Date.now()) ?? matches[0]
  return { phase: "Faza grupowa", start_utc: WC_START, next_match: next ?? null }
}

// ——— ADAPTERY (lenient) ———
function adaptStanding(raw: unknown, i: number): WCStanding {
  const o = rec(raw)
  const position = n(o.position ?? o.pos ?? o.rank ?? i + 1)
  return {
    position,
    team: s(o.team ?? o.name ?? o.team_name) || "—",
    team_id: (o.team_id ?? o.id ?? null) as string | number | null,
    played: n(o.played ?? o.mp ?? o.games),
    win: n(o.win ?? o.wins ?? o.w),
    draw: n(o.draw ?? o.draws ?? o.d),
    loss: n(o.loss ?? o.losses ?? o.l),
    gf: n(o.gf ?? o.goals_for ?? o.scored),
    ga: n(o.ga ?? o.goals_against ?? o.conceded),
    points: n(o.points ?? o.pts),
    advance_pct: nOrNull(o.advance_pct ?? o.qualify_pct ?? o.advance_probability),
    status: (s(o.status) as WCStatus) || mapWcStatus(true, position),
  }
}

function adaptMatch(raw: unknown): WCMatch {
  const o = rec(raw)
  return {
    event_id: (o.event_id ?? o.id ?? "") as string | number,
    home: s(o.home_team ?? o.home) || "—",
    away: s(o.away_team ?? o.away) || "—",
    home_id: (o.home_id ?? o.home_team_id ?? null) as string | number | null,
    away_id: (o.away_id ?? o.away_team_id ?? null) as string | number | null,
    group: o.group != null ? s(o.group) : null,
    stage: mapStage(o.stage ?? o.round ?? o.phase),
    stadium: o.stadium != null ? s(o.stadium) : o.venue != null ? s(o.venue) : null,
    city: o.city != null ? s(o.city) : null,
    kickoff_utc: s(o.kickoff_utc ?? o.match_date ?? o.date),
    status: "upcoming",
    home_score: nOrNull(o.home_score),
    away_score: nOrNull(o.away_score),
    predicted_home: nOrNull(o.predicted_home ?? o.pred_home),
    predicted_away: nOrNull(o.predicted_away ?? o.pred_away),
    prob_home: nOrNull(o.prob_home ?? o.home_win_prob),
    prob_draw: nOrNull(o.prob_draw ?? o.draw_prob),
    prob_away: nOrNull(o.prob_away ?? o.away_win_prob),
    btts_pct: nOrNull(o.btts_pct ?? o.btts_prob),
    over25_pct: nOrNull(o.over_2_5_pct ?? o.over25_pct),
    q_score: nOrNull(o.q_score),
  }
}

async function tryOracle<T>(path: string, revalidate: number): Promise<unknown | null> {
  if (!isOracleConfigured()) return null
  try {
    const data = await oracleFetch<unknown>(path, revalidate)
    console.log(`[oracle] ${path} raw:`, JSON.stringify(data).slice(0, 400))
    return data
  } catch (err) {
    console.error(`worldcup ${path}: Oracle niedostępne →`, err)
    return null
  }
}

export async function getWCGroups(): Promise<WCGroup[]> {
  const data = await tryOracle("/worldcup/groups", 300)
  if (!data) return mockGroups()
  const r = rec(data)
  const arr = Array.isArray(data) ? data : Array.isArray(r.groups) ? (r.groups as unknown[]) : []
  const groups: WCGroup[] = arr.map((g) => {
    const o = rec(g)
    const teams = Array.isArray(o.teams) ? o.teams : Array.isArray(o.standings) ? o.standings : []
    return { name: s(o.name ?? o.group) || "?", teams: (teams as unknown[]).map(adaptStanding) }
  })
  return groups.length ? groups : mockGroups()
}

export async function getWCMatches(): Promise<WCMatch[]> {
  const data = await tryOracle("/worldcup/matches", 300)
  if (!data) return mockMatches()
  const r = rec(data)
  const arr = Array.isArray(data) ? data : Array.isArray(r.matches) ? (r.matches as unknown[]) : []
  const matches = (arr as unknown[]).map(adaptMatch).filter((m) => m.home !== "—")
  return matches.length ? matches : mockMatches()
}

export async function getWCBracket(): Promise<WCTie[]> {
  const data = await tryOracle("/worldcup/bracket", 300)
  if (!data) return mockBracket()
  const r = rec(data)
  const arr = Array.isArray(data) ? data : Array.isArray(r.bracket) ? (r.bracket as unknown[]) : Array.isArray(r.ties) ? (r.ties as unknown[]) : []
  const ties: WCTie[] = (arr as unknown[]).map((t) => {
    const o = rec(t)
    return {
      stage: mapStage(o.stage ?? o.round),
      slot: o.slot != null ? s(o.slot) : undefined,
      event_id: (o.event_id ?? o.id ?? null) as string | number | null,
      home: o.home != null || o.home_team != null ? s(o.home ?? o.home_team) : null,
      away: o.away != null || o.away_team != null ? s(o.away ?? o.away_team) : null,
      home_id: (o.home_id ?? null) as string | number | null,
      away_id: (o.away_id ?? null) as string | number | null,
      home_score: nOrNull(o.home_score),
      away_score: nOrNull(o.away_score),
      winner: (o.winner as "home" | "away" | null) ?? null,
      prob_home: nOrNull(o.prob_home ?? o.home_advance_prob),
      kickoff_utc: o.kickoff_utc != null ? s(o.kickoff_utc) : null,
    }
  })
  return ties.length ? ties : mockBracket()
}

export async function getWCInfo(): Promise<WCInfo> {
  const data = await tryOracle("/worldcup/info", 120)
  if (!data) return mockInfo()
  const r = rec(data)
  const next = r.next_match ? adaptMatch(r.next_match) : null
  return {
    phase: s(r.phase ?? r.stage) || "Mistrzostwa Świata 2026",
    start_utc: s(r.start_utc ?? r.start) || WC_START,
    next_match: next,
  }
}
