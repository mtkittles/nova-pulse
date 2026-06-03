import LandingPage from "@/components/landing-page"
import { getStats } from "@/lib/stats"
import { getTodayTips } from "@/lib/tips"

export default async function Home() {
  const [stats, tips] = await Promise.all([getStats(), getTodayTips()])
  const tipsToday = tips.tips.filter((t) => t.bet_type !== "THRILLER").length

  return (
    <LandingPage
      tipsToday={tipsToday}
      winRate={stats.summary.win_rate}
      roi={stats.summary.roi}
      totalTips={stats.summary.total_tips}
    />
  )
}
