import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getSession } from "@/lib/auth"
import { getWCGroups } from "@/lib/worldcup"
import { AppShell } from "@/components/app-shell"
import { GroupsView } from "@/components/mundial/groups-view"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Mundial 2026 — Grupy",
  description: "Tabele 12 grup Mistrzostw Świata 2026 z szansami awansu.",
}

export default async function GrupyPage() {
  const [groups, session] = await Promise.all([getWCGroups(), getSession()])
  return (
    <AppShell loggedIn={Boolean(session)} isAdmin={session?.isAdmin}>
      <Link href="/mundial" className="mb-6 inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Mundial 2026
      </Link>
      <h1 className="mb-6 text-4xl font-semibold tracking-tight md:text-5xl">Grupy</h1>
      <GroupsView groups={groups} />
    </AppShell>
  )
}
