import Link from "next/link"
import { ArrowLeft, SearchX } from "lucide-react"
import { getMatch } from "@/lib/match"
import { getSession } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"
import { MatchDetail } from "@/components/match-detail"

export const dynamic = "force-dynamic"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [match, session] = await Promise.all([getMatch(id), getSession()])

  return (
    <AppShell loggedIn={Boolean(session)}>
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
