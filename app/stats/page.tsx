import { getStats, getSettledTips } from "@/lib/stats"
import { getSession } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"
import { StatsView } from "@/components/stats-view"

export const dynamic = "force-dynamic"

export default async function StatsPage() {
  const [data, session, settledTips] = await Promise.all([
    getStats("30"),
    getSession(),
    getSettledTips(15),
  ])
  return (
    <AppShell loggedIn={Boolean(session)} isAdmin={session?.isAdmin}>
      <StatsView initial={data} initialPeriod="30" loggedIn={Boolean(session)} settledTips={settledTips} />
    </AppShell>
  )
}
