import { getStats } from "@/lib/stats"
import { getTips } from "@/lib/tips"
import { getSession } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"
import { StatsScreen } from "@/components/stats-screen"
import type { Tip } from "@/lib/types"

export const dynamic = "force-dynamic"

export const metadata = { title: "Statystyki", description: "Skuteczność modelu: trafialność, ROI, kalibracja Q-Score i podział po rynkach." }

// Data YYYY-MM-DD przesunięta o `offset` dni (strefa Europe/Warsaw — jak default getTips).
function ymd(offset: number): string {
  const now = new Date()
  const d = new Date(now.getTime() + offset * 864e5)
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit", day: "2-digit" }).format(d)
}

export default async function StatsPage() {
  const days = [0, -1, -2, -3].map(ymd)
  const [data, session, ...byDay] = await Promise.all([getStats("30"), getSession(), ...days.map((d) => getTips(d))])

  // „Ostatnie rozliczone typy" z ostatnich kilku dni (brak dedykowanego endpointu historii).
  const recent: Tip[] = byDay
    .flatMap((r) => r.tips)
    .filter((t) => t.actual_result != null || t.match_status === "FINISHED")
    .sort((a, b) => (b.kickoff_utc ?? "").localeCompare(a.kickoff_utc ?? ""))
    .slice(0, 15)

  return (
    <AppShell loggedIn={Boolean(session)} isAdmin={session?.isAdmin}>
      <StatsScreen initial={data} recentTips={recent} />
    </AppShell>
  )
}
