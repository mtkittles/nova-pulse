import { getDates } from "@/lib/dates"
import { getTips } from "@/lib/tips"
import { getSession } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"
import TypyPage from "@/components/typy-page"

export const dynamic = "force-dynamic"

function todayWarsaw(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

export default async function Page() {
  const [dates, session] = await Promise.all([getDates(), getSession()])
  const today = todayWarsaw()
  // domyślnie: najbliższy dzień z typami >= dziś, inaczej ostatni dostępny, inaczej dziś
  const defaultDate =
    dates.dates.find((d) => d >= today) ?? dates.dates[dates.dates.length - 1] ?? today
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
        initialSource={tips.source}
        initialSourceMessage={tips.source_message}
        availableDates={dates.dates}
        loggedIn={loggedIn}
      />

      <p className="mt-10 text-center text-xs text-white/30">
        18+ · Typy to analiza statystyczna, nie gwarancja wygranej. Graj odpowiedzialnie.
      </p>
    </AppShell>
  )
}
