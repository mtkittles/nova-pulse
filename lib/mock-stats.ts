import type { StatsResponse, TimelinePoint } from "./stats-types"

// DANE TESTOWE (mock) — deterministyczne, by SSR i klient miały identyczne dane
// (bez Math.random w runtime → brak rozjazdu hydratacji).
// Zastąpione realnym fetchem do Oracle w lib/stats.ts.

const RANGE_DAYS = 30
const END_DATE = new Date("2026-06-03T12:00:00Z")
const AVG_ODDS = 1.74
const WIN_PROB = 0.62

function buildTimeline(): {
  timeline: TimelinePoint[]
  totalTips: number
  wins: number
  cumStake: number
  cumReturn: number
  lastResults: boolean[]
} {
  // Prosty deterministyczny LCG (stały seed) — powtarzalne, realistyczne dane.
  let seed = 1234567
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }

  const timeline: TimelinePoint[] = []
  let cumStake = 0
  let cumReturn = 0
  let cumWins = 0
  let cumTips = 0
  const lastResults: boolean[] = []

  for (let i = RANGE_DAYS - 1; i >= 0; i--) {
    const d = new Date(END_DATE)
    d.setUTCDate(END_DATE.getUTCDate() - i)
    const tips = 4 + Math.floor(rand() * 6) // 4..9 typów dziennie

    for (let t = 0; t < tips; t++) {
      const won = rand() < WIN_PROB
      cumStake += 1
      if (won) {
        cumWins += 1
        cumReturn += AVG_ODDS
      }
      lastResults.push(won)
    }
    cumTips += tips

    timeline.push({
      date: d.toISOString().slice(0, 10),
      win_rate: cumWins / cumTips,
      roi: (cumReturn - cumStake) / cumStake,
      tips,
    })
  }

  return { timeline, totalTips: cumTips, wins: cumWins, cumStake, cumReturn, lastResults }
}

function currentStreak(results: boolean[]): number {
  if (results.length === 0) return 0
  const last = results[results.length - 1]
  let streak = 0
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i] === last) streak++
    else break
  }
  return last ? streak : -streak
}

const built = buildTimeline()
const wins = built.wins
const losses = built.totalTips - wins

export const mockStats: StatsResponse = {
  generated_at: "2026-06-03T11:30:00Z",
  range_days: RANGE_DAYS,
  source: "mock",
  summary: {
    total_tips: built.totalTips,
    settled_tips: built.totalTips,
    wins,
    losses,
    win_rate: wins / built.totalTips,
    roi: (built.cumReturn - built.cumStake) / built.cumStake,
    current_streak: currentStreak(built.lastResults),
    avg_q_score: 68,
  },
  timeline: built.timeline,
  by_market: [
    { market: "BTTS", tips: 78, win_rate: 0.64, roi: 0.09 },
    { market: "Over", tips: 71, win_rate: 0.71, roi: 0.07 },
    { market: "1X2", tips: 33, win_rate: 0.55, roi: 0.14 },
  ],
  by_league: [
    { league: "Premier League", tips: 41, win_rate: 0.68 },
    { league: "La Liga", tips: 36, win_rate: 0.64 },
    { league: "Bundesliga", tips: 33, win_rate: 0.7 },
    { league: "Serie A", tips: 29, win_rate: 0.59 },
    { league: "Ligue 1", tips: 24, win_rate: 0.63 },
    { league: "Eredivisie", tips: 19, win_rate: 0.74 },
  ],
  q_score_buckets: [
    { bucket: "50–60", tips: 38, win_rate: 0.52 },
    { bucket: "60–70", tips: 57, win_rate: 0.61 },
    { bucket: "70–80", tips: 49, win_rate: 0.68 },
    { bucket: "80–90", tips: 28, win_rate: 0.77 },
    { bucket: "90–100", tips: 11, win_rate: 0.84 },
  ],
}
