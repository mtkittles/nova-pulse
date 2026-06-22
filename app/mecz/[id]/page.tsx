import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { SearchX } from "lucide-react"
import { getMatchDetailed } from "@/lib/match"
import { getStandings } from "@/lib/league"
import { getTeam } from "@/lib/team"
import { getUserPicks } from "@/lib/picks"
import { leagueCodeByName } from "@/lib/leagues"
import { getSession } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"
import { MatchDetail } from "@/components/match-detail"
import { EmptyState } from "@/components/ui/empty-state"

export const dynamic = "force-dynamic"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nova-pulse-sage.vercel.app"

// Canonical per dynamiczny URL meczu (ryzyko duplikatów). OG zostaje z konwencji pliku.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return {
    title: "Szczegóły meczu",
    description: "Predykcje, forma, H2H i rozkład wyników dla meczu.",
    alternates: { canonical: `${SITE_URL.replace(/\/$/, "")}/mecz/${id}` },
  }
}


const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim()

// /match nie zwraca team_id — pobieramy go ze standings ligi (po nazwie drużyny).
async function resolveTeamIds(match: Awaited<ReturnType<typeof getMatchDetailed>>) {
  if (!match.found) return
  if (match.home_id != null && match.away_id != null) return
  const code = match.leagueCode || leagueCodeByName(match.league)
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
  const match = await getMatchDetailed(id)
  await resolveTeamIds(match)

  // profile drużyn (split dom/wyjazd) + typy usera (do stanu "śledzony") — równolegle
  const [homeTeam, awayTeam, picks] = await Promise.all([
    match.found && match.home_id != null ? getTeam(String(match.home_id)) : Promise.resolve(null),
    match.found && match.away_id != null ? getTeam(String(match.away_id)) : Promise.resolve(null),
    getUserPicks(session.uid),
  ])
  // klucze już śledzonych typów: "event_id|bet_type"
  const trackedKeys = picks.map((p) => `${p.event_id}|${p.bet_type}`)

  // Structured data (Schema.org SportsEvent) — tylko gdy mecz istnieje.
  const structuredData = match.found
    ? {
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        name: `${match.home} vs ${match.away}`,
        startDate: match.kickoff_utc || undefined,
        location: { "@type": "Place", name: match.league || "Football" },
        sport: "Football",
        homeTeam: { "@type": "SportsTeam", name: match.home },
        awayTeam: { "@type": "SportsTeam", name: match.away },
      }
    : null

  return (
    <AppShell loggedIn isAdmin={session.isAdmin}>
      {structuredData && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      )}
      {match.found ? (
        <MatchDetail
          match={match}
          homeSide={homeTeam?.home_stats ?? null}
          awaySide={awayTeam?.away_stats ?? null}
          trackedKeys={trackedKeys}
        />
      ) : (
        <div className="mx-auto grid min-h-[40vh] max-w-md place-items-center px-4">
          <EmptyState
            icon={SearchX}
            title="Nie znaleziono meczu"
            description={`Brak danych dla tego meczu (event_id: ${id}).`}
            cta={{ label: "Wróć do typów", href: "/typy" }}
          />
        </div>
      )}
    </AppShell>
  )
}
