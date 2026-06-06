import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, SearchX } from "lucide-react"
import { getMatch } from "@/lib/match"
import { getStandings } from "@/lib/league"
import { leagueCodeByName } from "@/lib/leagues"
import { getSession } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"
import { MatchDetail } from "@/components/match-detail"

export const dynamic = "force-dynamic"

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim()

// /match nie zwraca team_id — pobieramy go ze standings ligi (po nazwie drużyny).
async function resolveTeamIds(match: Awaited<ReturnType<typeof getMatch>>) {
  if (!match.found) return
  if (match.home_id != null && match.away_id != null) return
  const code = leagueCodeByName(match.league)
  if (!code) return
  const standings = await getStandings(code)
  if (standings.length === 0) return
  const find = (name: string) => {
    const n = norm(name)
    return (
      standings.find((r) => norm(r.team) === n) ??
      standings.find((r) => norm(r.team).includes(n) || n.includes(norm(r.team)))
    )
  }
  if (match.home_id == null) match.home_id = find(match.home)?.team_id ?? null
  if (match.away_id == null) match.away_id = find(match.away)?.team_id ?? null
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect("/login")
  const match = await getMatch(id)
  await resolveTeamIds(match)

  return (
    <AppShell loggedIn isAdmin={session.isAdmin}>
      <Link
        href="/typy"
        className="mb-6 inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Wróć do typów
      </Link>

      {match.found ? (
        <MatchDetail match={match} />
      ) : (
        <div className="grid min-h-[40vh] place-items-center">
          <div className="max-w-md rounded-[2rem] border border-white/12 bg-white/[0.05] p-10 text-center backdrop-blur">
            <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-white/12 bg-white/[0.05] text-white/60">
              <SearchX className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold">Nie znaleziono meczu</h1>
            <p className="mt-3 text-white/55">
              Brak danych dla tego meczu (event_id: {id}). Wróć do listy typów.
            </p>
          </div>
        </div>
      )}
    </AppShell>
  )
}
