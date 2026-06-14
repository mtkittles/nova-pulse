import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getSession } from "@/lib/auth"
import { getWCBracket, getWCOverview } from "@/lib/worldcup"
import { AppShell } from "@/components/app-shell"
import { BracketView } from "@/components/mundial/bracket-view"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Mundial 2026 — Drabinka",
  description: "Drabinka fazy pucharowej Mistrzostw Świata 2026 z przewidywaniami.",
}

export default async function DrabinkaPage() {
  const [ties, overview, session] = await Promise.all([getWCBracket(), getWCOverview(), getSession()])
  const decided = overview.phase === "knockout" || overview.phase === "finished"
  return (
    <AppShell loggedIn={Boolean(session)} isAdmin={session?.isAdmin}>
      <Link href="/mundial" className="mb-6 inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Mundial 2026
      </Link>
      <h1 className="mb-2 text-4xl font-semibold tracking-tight md:text-5xl">Drabinka</h1>
      <p className="mb-6 text-white/55">
        {decided
          ? "Faza pucharowa — wynik lub szansa awansu (podświetlony faworyt)."
          : "Drabinka ustali się po fazie grupowej. Prognoza modelu w zakładce „Symulacja”."}
      </p>
      <BracketView ties={ties} decided={decided} />
    </AppShell>
  )
}
