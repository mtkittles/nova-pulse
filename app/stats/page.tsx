import { getStats } from "@/lib/stats"
import { getTodayTips } from "@/lib/tips"
import { getSession } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"
import { StatsScreen } from "@/components/stats-screen"

export const dynamic = "force-dynamic"

export const metadata = { title: "Statystyki", description: "Skuteczność modelu: trafialność, ROI, kalibracja Q-Score i podział po rynkach." }

export default async function StatsPage() {
  const [data, today, session] = await Promise.all([getStats("30"), getTodayTips(), getSession()])
  // „Ostatnie typy" = dzisiejsze rozliczone (brak dedykowanego endpointu historii).
  const recent = today.tips.filter((t) => t.actual_result != null || t.match_status === "FINISHED")
  return (
    <AppShell loggedIn={Boolean(session)} isAdmin={session?.isAdmin}>
      <StatsScreen initial={data} recentTips={recent} />
    </AppShell>
  )
}
