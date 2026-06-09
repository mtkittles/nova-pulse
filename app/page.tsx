import LandingPage from "@/components/landing-page"
import { getStats } from "@/lib/stats"
import { getTodayTips } from "@/lib/tips"
import { getSession } from "@/lib/auth"
import type { Tip } from "@/lib/types"

// Strona zależy od danych na żywo i sesji — renderuj per żądanie (nie prerender).
export const dynamic = "force-dynamic"

// Mecze MŚ rozpoznajemy po nazwie ligi (brak osobnego kodu w Oracle).
function isWorldCup(league: string): boolean {
  const l = (league || "").toLowerCase()
  return (
    l.includes("world cup") ||
    l.includes("mundial") ||
    l.includes("mistrzostwa świata") ||
    l.includes("fifa world")
  )
}

export default async function Home() {
  const [stats, today, session] = await Promise.all([
    getStats(),
    getTodayTips(),
    getSession(),
  ])

  const tips = today.tips
  const byQ = [...tips].sort((a, b) => b.q_score - a.q_score)
  const topTips: Tip[] = byQ.slice(0, 3)
  const wcTips: Tip[] = tips.filter((t) => isWorldCup(t.league))
  const matchesToday = new Set(tips.map((t) => String(t.event_id))).size
  const leaguesCount =
    stats.by_league.length || new Set(tips.map((t) => t.league)).size

  return (
    <LandingPage
      loggedIn={Boolean(session)}
      topTips={topTips}
      todayTips={tips}
      wcTips={wcTips}
      matchesToday={matchesToday}
      winRate={stats.summary.win_rate}
      roi={stats.summary.roi}
      totalTips={stats.summary.total_tips}
      settledTips={stats.summary.settled_tips}
      avgQScore={stats.summary.avg_q_score}
      leaguesCount={leaguesCount}
    />
  )
}
