import LandingPage from "@/components/landing-page"
import { getStats } from "@/lib/stats"
import { getTipsHistory, getTodayTips, getThrillerSpotlight } from "@/lib/tips"
import { getSession } from "@/lib/auth"
import { sortKey } from "@/lib/format"
import type { Tip } from "@/lib/types"

// Strona zależy od danych na żywo i sesji — renderuj per żądanie (nie prerender).
export const dynamic = "force-dynamic"

export default async function Home() {
  // getTipsHistory zasila sekcję „Ostatnio rozliczone" (proof bar).
  // getThrillerSpotlight: null poza trybem demo (sekcja się wtedy nie renderuje).
  const [stats, today, session, history, thriller] = await Promise.all([
    getStats(),
    getTodayTips(),
    getSession(),
    getTipsHistory(12),
    getThrillerSpotlight(),
  ])

  const tips = today.tips
  const byQ = [...tips].sort((a, b) => sortKey(b.q_score) - sortKey(a.q_score))
  // Rekomendacje value: tylko dodatni Edge, maks. 2 (nie promujemy ujemnego Edge).
  const valueTips = byQ.filter((t) => (t.edge ?? 0) > 0)
  const topTips: Tip[] = valueTips.slice(0, 2)
  const matchesToday = new Set(tips.map((t) => String(t.event_id))).size
  const leaguesCount =
    stats.by_league.length || new Set(tips.map((t) => t.league)).size

  return (
    <LandingPage
      loggedIn={Boolean(session)}
      topTips={topTips}
      todayTips={tips}
      matchesToday={matchesToday}
      winRate={stats.summary.win_rate}
      roi={stats.summary.roi}
      totalTips={stats.summary.total_tips}
      settledTips={stats.summary.settled_tips}
      avgQScore={stats.summary.avg_q_score}
      leaguesCount={leaguesCount}
      timeline={stats.timeline}
      recentSettled={history}
      thriller={thriller}
    />
  )
}
