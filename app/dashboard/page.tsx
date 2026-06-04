import Link from "next/link"
import { ArrowLeft, BarChart3 } from "lucide-react"
import { getTodayTips } from "@/lib/tips"
import TipsBoard from "@/components/tips-board"
import { Brand } from "@/components/brand"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogoutButton } from "@/components/logout-button"
import { getSession } from "@/lib/auth"
import { isOracleConfigured } from "@/lib/oracle"

// Server Component: pobiera typy server-side (Oracle gdy skonfigurowane, inaczej mock).
export default async function DashboardPage() {
  const [data, session] = await Promise.all([getTodayTips(), getSession()])
  const live = isOracleConfigured()

  const formattedDate = new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Warsaw",
  }).format(new Date(`${data.date}T12:00:00Z`))

  const activeCount = data.tips.filter((t) => t.bet_type !== "THRILLER").length

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--bg)] text-white">
      <div className="fixed inset-0 -z-10">
        <div className="absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-[var(--glow-1)] blur-3xl" />
        <div className="absolute right-[-120px] top-40 h-96 w-96 rounded-full bg-[var(--glow-2)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>

      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Brand />

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <Link
            href="/stats"
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent)]/30 bg-[var(--accent)]/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur transition hover:bg-[var(--accent)]/15"
          >
            <BarChart3 className="h-4 w-4 text-[color:var(--accent)]" />
            Statystyki
          </Link>
          {session ? (
            <LogoutButton />
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[color:var(--on-accent)] transition hover:scale-105"
            >
              Zaloguj
            </Link>
          )}
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-medium backdrop-blur transition hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden md:inline">Strona główna</span>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10 max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-[color:var(--accent)]/20 bg-[var(--accent)]/10 px-4 py-2 text-sm text-white/85 backdrop-blur">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
            </span>
            {activeCount} typów na dziś
          </div>

          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            Dzisiejsze typy
          </h1>

          <p className="mt-4 text-lg capitalize text-white/55">{formattedDate}</p>

          {!live && (
            <p className="mt-2 text-sm text-white/40">
              Dane testowe (mock). Po podłączeniu API Lupus Bota typy będą pobierane
              z tabeli <code className="text-white/60">bot_predictions</code>.
            </p>
          )}
          {live && data.tips.length === 0 && (
            <p className="mt-3 inline-block rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-sm text-amber-100/80">
              API odpowiedziało, ale nie ma typów na dziś (albo Oracle jest chwilowo niedostępne).
            </p>
          )}
        </div>

        <TipsBoard data={data} />
      </section>
    </main>
  )
}
