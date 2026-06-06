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

  return (
    <AppShell loggedIn={Boolean(session)}>
      <TypyPage initialDate={defaultDate} initialTips={tips.tips} availableDates={dates.dates} />

      <p className="mt-10 text-center text-xs text-white/30">
        18+ · Typy to analiza statystyczna, nie gwarancja wygranej. Graj odpowiedzialnie.
      </p>
    </AppShell>
  )
}
