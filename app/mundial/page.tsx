import Link from "next/link"
import { ArrowRight, CalendarDays, ListTree, Target, Trophy } from "lucide-react"
import { getSession } from "@/lib/auth"
import { getWCGroups, getWCMatches, getWCOverview } from "@/lib/worldcup"
import { flagForNation, nationPL } from "@/lib/design"
import { AppShell } from "@/components/app-shell"
import { WCHero } from "@/components/mundial/wc-hero"
import { WCMatchCard } from "@/components/mundial/wc-match-card"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Mundial 2026",
  description: "Mistrzostwa Świata 2026 — grupy, drabinka, mecze i predykcje z Q-Score.",
}

const LINKS = [
  { href: "/mundial/grupy", label: "Grupy", icon: ListTree },
  { href: "/mundial/drabinka", label: "Drabinka", icon: Trophy },
  { href: "/mundial/mecze", label: "Wszystkie mecze", icon: CalendarDays },
  { href: "/typy", label: "Typy MŚ", icon: Target },
]

export default async function MundialPage() {
  const [overview, matches, session] = await Promise.all([getWCOverview(), getWCMatches(), getSession()])
  const phase = overview.phase

  // Najbliższe mecze (po czasie startu, jeszcze nierozegrane).
  const now = Date.now()
  const upcoming = [...matches]
    .filter((m) => {
      const t = new Date(m.kickoff_utc).getTime()
      return !Number.isFinite(t) || t >= now - 2 * 3600_000
    })
    .sort((a, b) => a.kickoff_utc.localeCompare(b.kickoff_utc))
    .slice(0, 6)

  // Skrót tabel grupowych pokazujemy tylko w fazie grupowej.
  const groups = phase === "group" ? await getWCGroups() : []

  return (
    <AppShell loggedIn={Boolean(session)} isAdmin={session?.isAdmin}>
      <WCHero overview={overview} />

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {LINKS.map((l) => {
          const Icon = l.icon
          return (
            <Link
              key={l.href}
              href={l.href}
              className="group flex items-center justify-between gap-2 rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-3 font-medium backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-[color:var(--accent)]" />
                {l.label}
              </span>
              <ArrowRight className="h-4 w-4 text-white/40 transition group-hover:translate-x-1" />
            </Link>
          )
        })}
      </div>

      {/* Faza pucharowa — teaser drabinki */}
      {phase === "knockout" && (
        <section className="mt-10">
          <div className="flex flex-col items-start gap-4 rounded-[1.8rem] border border-[color:var(--accent)]/25 bg-[var(--accent)]/[0.07] p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Faza pucharowa</h2>
              <p className="mt-1 text-white/65">Drabinka jest rozstrzygana — sprawdź pary i przewidywania.</p>
            </div>
            <Link href="/mundial/drabinka" className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 font-semibold text-[color:var(--on-accent)] transition hover:scale-105">
              <Trophy className="h-4 w-4" /> Zobacz drabinkę
            </Link>
          </div>
        </section>
      )}

      {/* Następne mecze */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold">
            {phase === "pre" ? "Pierwsze mecze turnieju" : "Najbliższe mecze"}
          </h2>
          <Link href="/mundial/mecze" className="inline-flex items-center gap-1 text-sm font-medium text-[color:var(--accent)] hover:gap-2">
            Wszystkie <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="rounded-[1.6rem] border border-white/12 bg-white/[0.04] p-8 text-center text-white/60">
            {phase === "finished" ? "Turniej zakończony — zobacz pełne wyniki w zakładce Mecze." : "Brak nadchodzących meczów w aktualnym źródle danych."}
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((m) => (
              <WCMatchCard key={String(m.event_id)} m={m} />
            ))}
          </div>
        )}
      </section>

      {/* Skrót tabel grupowych — faza grupowa */}
      {phase === "group" && groups.length > 0 && (
        <section className="mt-12">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="text-2xl font-semibold">Skrót tabel grupowych</h2>
            <Link href="/mundial/grupy" className="inline-flex items-center gap-1 text-sm font-medium text-[color:var(--accent)] hover:gap-2">
              Pełne tabele <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (
              <Link
                key={g.name}
                href="/mundial/grupy"
                className="rounded-[1.4rem] border border-white/12 bg-white/[0.04] p-4 transition hover:-translate-y-0.5 hover:bg-white/[0.07]"
              >
                <p className="mb-2 text-sm font-semibold text-[color:var(--accent)]">Grupa {g.name}</p>
                <div className="space-y-1.5">
                  {g.teams.slice(0, 4).map((t) => (
                    <div key={`${t.position}-${t.team}`} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${t.position <= 2 ? "bg-emerald-400" : t.position === 3 ? "bg-amber-300" : "bg-rose-400"}`} />
                        <span className="shrink-0">{flagForNation(t.team)}</span>
                        <span className="truncate text-white/85">{nationPL(t.team)}</span>
                      </span>
                      <span className="shrink-0 font-semibold text-white/70">{t.points} pkt</span>
                    </div>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="mt-10 text-center text-xs text-white/55">
        18+ · Predykcje to analiza statystyczna, nie gwarancja wygranej. Graj odpowiedzialnie.
      </p>
    </AppShell>
  )
}
