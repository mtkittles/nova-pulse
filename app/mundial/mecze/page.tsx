import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getSession } from "@/lib/auth"
import { getWCMatches } from "@/lib/worldcup"
import { AppShell } from "@/components/app-shell"
import { MatchesView } from "@/components/mundial/matches-view"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Mundial 2026 — Mecze",
  description: "Wszystkie mecze Mistrzostw Świata 2026 z kursami, Q-Score i przewidywaniami.",
}

export default async function MeczePage() {
  const [matches, session] = await Promise.all([getWCMatches(), getSession()])
  return (
    <AppShell loggedIn={Boolean(session)} isAdmin={session?.isAdmin}>
      <Link href="/mundial" className="mb-6 inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Mundial 2026
      </Link>
      <h1 className="mb-6 text-4xl font-semibold tracking-tight md:text-5xl">Wszystkie mecze</h1>
      <MatchesView matches={matches} />
    </AppShell>
  )
}
