import { getStats } from "@/lib/stats"
import { getTipsHistory } from "@/lib/tips"
import { getSession } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"
import { StatsScreen } from "@/components/stats-screen"

export const dynamic = "force-dynamic"

export const metadata = { title: "Statystyki", description: "Statystyki skuteczności modelu — ROI, trafienia, Q-Score buckets." }

export default async function StatsPage() {
  // „Ostatnie rozliczone typy" z dedykowanego endpointu historii (zamiast sklejania ostatnich dni).
  const [data, session, recent] = await Promise.all([getStats("30"), getSession(), getTipsHistory(15)])

  return (
    <AppShell loggedIn={Boolean(session)} isAdmin={session?.isAdmin}>
      <StatsScreen initial={data} recentTips={recent} />
    </AppShell>
  )
}
