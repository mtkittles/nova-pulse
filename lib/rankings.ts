import "server-only"
import type { MarketRankings, RankingTeam, RankingUser, UserRankings } from "./extra-types"
import { ensureLeagueNames, isOracleConfigured, oracleFetch } from "./oracle"

function rec(x: unknown): Record<string, unknown> {
  return x && typeof x === "object" ? (x as Record<string, unknown>) : {}
}
function num(x: unknown): number {
  const n = Number(x)
  return Number.isFinite(n) ? n : 0
}
function numOrNull(x: unknown): number | null {
  if (x == null) return null
  const n = Number(x)
  return Number.isFinite(n) ? n : null
}
function logoOf(x: unknown): string | null {
  if (x == null) return null
  const s = String(x).trim()
  return s && s.toLowerCase() !== "null" ? s : null
}

// pctKey/probKey różnią się per rynek.
function adaptRow(raw: unknown, pctKey: string, probKey: string): RankingTeam {
  const o = rec(raw)
  const nm = rec(o.next_match)
  const hasNext = o.next_match != null && Object.keys(nm).length > 0
  return {
    team_id: (o.team_id ?? o.id ?? "") as string | number,
    team_name: String(o.team_name ?? o.team ?? o.name ?? "—"),
    logo: logoOf(o.team_logo ?? o.logo),
    league: String(o.league ?? o.league_name ?? "—"),
    league_code: String(o.league_code ?? o.league ?? ""),
    pct_last10: num(o[pctKey] ?? o.pct_last10 ?? o.pct),
    next_match: hasNext
      ? {
          event_id: (nm.event_id ?? nm.af_fixture_id ?? nm.id ?? null) as string | number | null,
          opponent: String(nm.opponent ?? nm.opp ?? "—"),
          date: String(nm.date ?? nm.kickoff_utc ?? ""),
          home_away: String(nm.home_away ?? nm.venue ?? ""),
          predicted_prob: numOrNull(nm[probKey] ?? nm.predicted_prob ?? nm.prob),
          q_score: numOrNull(nm.q_score),
        }
      : null,
  }
}

function adaptList(x: unknown, pctKey: string, probKey: string): RankingTeam[] {
  return (Array.isArray(x) ? x : []).map((r) => adaptRow(r, pctKey, probKey))
}

function mockRankings(): MarketRankings {
  const teams = [
    ["Kashima Antlers", "J1 League", "J1", 80, "FC Tokyo"],
    ["FC Tokyo", "J1 League", "J1", 74, "Cerezo Osaka"],
    ["Urawa Reds", "J1 League", "J1", 70, "Gamba Osaka"],
    ["Vissel Kobe", "J1 League", "J1", 66, "Sanfrecce"],
    ["Cerezo Osaka", "J1 League", "J1", 61, "Nagoya"],
    ["Gamba Osaka", "J1 League", "J1", 58, "Kyoto"],
  ] as const
  const make = (pct: number, prob: number | null) =>
    teams.map((t, i) => ({
      team_id: 1000 + i,
      team_name: t[0],
      league: t[1],
      league_code: t[2],
      pct_last10: Math.max(35, pct - i * 4),
      next_match: {
        event_id: `mock_${i}`,
        opponent: t[4],
        date: new Date(Date.now() + (i + 1) * 864e5).toISOString().slice(0, 16) + ":00Z",
        home_away: i % 2 === 0 ? "home" : "away",
        predicted_prob: prob != null ? Math.max(0.4, prob / 100 - i * 0.03) : null,
        q_score: 80 - i * 3,
      },
    }))
  return { btts: make(80, 72), over_15: make(88, null) }
}

// Maskuje identyfikator: "12345678" → "123***78" (prywatność typerów).
function maskId(raw: unknown): string {
  const s = String(raw ?? "").trim()
  if (!s) return "anon"
  if (s.includes("*")) return s // już zamaskowany przez Oracle
  if (s.length <= 4) return `${s[0] ?? ""}***`
  return `${s.slice(0, 3)}***${s.slice(-2)}`
}

// Ranking typerów (/rankings/users). Pusty/niedostępny → bez crasha.
export async function getUserRankings(): Promise<UserRankings> {
  if (!isOracleConfigured()) return { users: [], updated_at: null, error: false }
  try {
    const data = await oracleFetch<unknown>("/rankings/users", 120)
    const r = rec(data)
    const list = Array.isArray(data) ? data : Array.isArray(r.users) ? r.users : Array.isArray(r.rankings) ? r.rankings : []
    const users: RankingUser[] = (list as unknown[]).map((u) => {
      const o = rec(u)
      const total = num(o.total_picks ?? o.total ?? o.picks)
      const won = num(o.won_picks ?? o.won ?? o.wins)
      const wrRaw = o.win_rate ?? o.winrate ?? (total ? won / total : 0)
      const wr = Number(wrRaw)
      return {
        display_id: maskId(o.display_id ?? o.masked_id ?? o.telegram_id ?? o.uid ?? o.user_id),
        total_picks: total,
        won_picks: won,
        win_rate: Number.isFinite(wr) ? Math.round((wr <= 1 ? wr * 100 : wr) * 10) / 10 : 0,
      }
    })
    return { users, updated_at: r.updated_at != null ? String(r.updated_at) : null, error: false }
  } catch (err) {
    console.error("getUserRankings: Oracle niedostępne →", err)
    return { users: [], updated_at: null, error: true }
  }
}

export async function getMarketRankings(): Promise<MarketRankings> {
  if (!isOracleConfigured()) return mockRankings()
  try {
    await ensureLeagueNames()
    const data = await oracleFetch<unknown>("/rankings/markets", 300)
    const r = rec(data)
    const btts = adaptList(r.btts, "btts_pct_last10", "predicted_btts_prob")
    const over_15 = adaptList(r.over_15, "over_15_pct_last10", "predicted_over_15_prob")
    if (btts.length === 0 && over_15.length === 0) return mockRankings()
    return { btts, over_15 }
  } catch (err) {
    console.error("getMarketRankings: Oracle niedostępne →", err)
    return { btts: [], over_15: [] }
  }
}
