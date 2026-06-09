import { getTips } from "@/lib/tips"
import { getCalendar } from "@/lib/calendar"
import { getSession } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"
import TypyPage from "@/components/typy-page"

export const dynamic = "force-dynamic"

export const metadata = { title: "Typy", description: "Typy meczowe z kalendarzem, filtrami i Q-Score — BTTS, Over 1.5, Mix, Thriller." }


function todayWarsaw(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

export default async function Page() {
  const [calendar, session] = await Promise.all([getCalendar(), getSession()])
  const today = todayWarsaw()

  // dni z typami (tips !== 0) → wybór domyślnej daty: najbliższy dzień ≥ dziś
  const withTips = calendar
    .filter((d) => d.tips !== 0)
    .map((d) => d.date)
    .sort()
  const defaultDate = withTips.find((d) => d >= today) ?? withTips[withTips.length - 1] ?? today
  const tips = await getTips(defaultDate)
  const loggedIn = Boolean(session)

  return (
    <AppShell loggedIn={loggedIn} isAdmin={session?.isAdmin}>
      {!loggedIn && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--accent)]/25 bg-[var(--accent)]/10 px-5 py-4">
          <p className="text-sm text-white/80">
            Widzisz dzisiejsze mecze. <strong>Zaloguj się</strong>, aby odblokować typ, kurs, Q-Score,
            kalendarz i statystyki — za darmo.
          </p>
        </div>
      )}

      <TypyPage
        initialDate={defaultDate}
        initialTips={tips.tips}
        calendar={calendar}
        loggedIn={loggedIn}
      />

      <p className="mt-10 text-center text-xs text-white/55">
        18+ · Typy to analiza statystyczna, nie gwarancja wygranej. Graj odpowiedzialnie.
      </p>
    </AppShell>
  )
}
