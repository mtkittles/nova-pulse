import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, SearchX } from "lucide-react"
import { getTeam, getTeamUpcoming } from "@/lib/team"
import { getSession } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"
import { TeamPage } from "@/components/team-page"

export const dynamic = "force-dynamic"

export default async function Page({ params }: { params: Promise<{ team_id: string }> }) {
  const { team_id } = await params
  const session = await getSession()
  if (!session) redirect("/login")

  const [team, upcoming] = await Promise.all([getTeam(team_id), getTeamUpcoming(team_id)])

  return (
    <AppShell loggedIn isAdmin={session.isAdmin}>
      <Link
        href="/ligi"
        className="mb-6 inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Wróć do lig
      </Link>

      {team ? (
        <TeamPage team={team} upcoming={upcoming} />
      ) : (
        <div className="grid min-h-[40vh] place-items-center">
          <div className="max-w-md rounded-[2rem] border border-white/12 bg-white/[0.05] p-10 text-center backdrop-blur">
            <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-white/12 bg-white/[0.05] text-white/60">
              <SearchX className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold">Nie znaleziono drużyny</h1>
            <p className="mt-3 text-white/55">Brak danych (team_id: {team_id}).</p>
          </div>
        </div>
      )}
    </AppShell>
  )
}
