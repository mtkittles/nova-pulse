import Link from "next/link"
import { ArrowRight, CalendarDays, ListTree, Target, Trophy } from "lucide-react"
import { getSession } from "@/lib/auth"
import { getWCInfo, getWCMatches } from "@/lib/worldcup"
import { AppShell } from "@/components/app-shell"
import { WCHero } from "@/components/mundial/wc-hero"
import { WCMatchCard } from "@/components/mundial/wc-match-card"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Mundial 2026",
  description: "Mistrzostwa Świata 2026 — grupy, drabinka, mecze i predykcje z Q-Score.",
}

function todayWarsaw(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
}

const LINKS = [
  { href: "/mundial/grupy", label: "Grupy", icon: ListTree },
  { href: "/mundial/drabinka", label: "Drabinka", icon: Trophy },
  { href: "/mundial/mecze", label: "Wszystkie mecze", icon: CalendarDays },
  { href: "/typy", label: "Typy MŚ", icon: Target },
]

export default async function MundialPage() {
  const [info, matches, session] = await Promise.all([getWCInfo(), getWCMatches(), getSession()])

  const today = todayWarsaw()
  const tomorrow = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(Date.now() + 864e5))
  const soon = matches.filter((m) => {
    const d = m.kickoff_utc.slice(0, 10)
    return d === today || d === tomorrow
  })
  const upcoming = (soon.length ? soon : [...matches].sort((a, b) => a.kickoff_utc.localeCompare(b.kickoff_utc))).slice(0, 6)

  return (
    <AppShell loggedIn={Boolean(session)} isAdmin={session?.isAdmin}>
      <WCHero info={info} />

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

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold">{soon.length ? "Dziś i jutro" : "Najbliższe mecze"}</h2>
          <Link href="/mundial/mecze" className="inline-flex items-center gap-1 text-sm font-medium text-[color:var(--accent)] hover:gap-2">
            Wszystkie <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="rounded-[1.6rem] border border-white/12 bg-white/[0.04] p-8 text-center text-white/60">
            Brak nadchodzących meczów w aktualnym źródle danych.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((m) => (
              <WCMatchCard key={String(m.event_id)} m={m} />
            ))}
          </div>
        )}
      </section>

      <p className="mt-10 text-center text-xs text-white/55">
        18+ · Predykcje to analiza statystyczna, nie gwarancja wygranej. Graj odpowiedzialnie.
      </p>
    </AppShell>
  )
}
