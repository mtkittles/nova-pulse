import LandingPage from "@/components/landing-page"
import { getStats } from "@/lib/stats"
import { getTodayTips } from "@/lib/tips"
import { getSession } from "@/lib/auth"

// Strona zależy od danych na żywo i sesji — renderuj per żądanie (nie prerender).
export const dynamic = "force-dynamic"

export default async function Home() {
  const [stats, tips, session] = await Promise.all([
    getStats(),
    getTodayTips(),
    getSession(),
  ])
  const tipsToday = tips.tips.filter((t) => t.bet_type !== "THRILLER").length

  return (
    <LandingPage
      tipsToday={tipsToday}
      winRate={stats.summary.win_rate}
      roi={stats.summary.roi}
      totalTips={stats.summary.total_tips}
      loggedIn={Boolean(session)}
    />
  )
}
