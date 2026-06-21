import { getLiveWindowTips } from "@/lib/tips"
import { getSession } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"
import { LiveView } from "@/components/live-view"

// Auto-odświeżanie listy co 60 s (spójnie z live-pollingiem klienta useLiveMatches).
export const revalidate = 60

export const metadata = {
  title: "Na żywo",
  description: "Typy na żywo — aktywne mecze, nadchodzące i rozliczone dziś.",
}

export default async function LivePage() {
  const [today, session] = await Promise.all([getLiveWindowTips(), getSession()])
  return (
    <AppShell loggedIn={Boolean(session)} isAdmin={session?.isAdmin}>
      <div className="mx-auto max-w-2xl lg:max-w-5xl">
        <LiveView tips={today.tips} />
      </div>
    </AppShell>
  )
}
