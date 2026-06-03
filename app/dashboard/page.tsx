import Link from "next/link"
import { ArrowLeft, BarChart3, Sparkles } from "lucide-react"
import { getTodayTips } from "@/lib/tips"
import TipsBoard from "@/components/tips-board"

// Server Component: pobiera typy server-side (mock w MVP, później Oracle).
export default async function DashboardPage() {
  const data = await getTodayTips()

  const formattedDate = new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Warsaw",
  }).format(new Date(`${data.date}T12:00:00Z`))

  const activeCount = data.tips.filter((t) => t.bet_type !== "THRILLER").length

  return (
    <main className="min-h-screen overflow-hidden bg-[#070812] text-white">
      <div className="fixed inset-0 -z-10">
        <div className="absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-cyan-500/25 blur-3xl" />
        <div className="absolute right-[-120px] top-40 h-96 w-96 rounded-full bg-violet-600/25 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>

      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur">
            <Sparkles className="h-5 w-5 text-cyan-300" />
          </div>
          <span className="text-xl font-semibold">NovaPulse</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/stats"
            className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-2.5 text-sm font-medium text-cyan-100 backdrop-blur transition hover:bg-cyan-300/15"
          >
            <BarChart3 className="h-4 w-4" />
            Statystyki
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-medium backdrop-blur transition hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" />
            Strona główna
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10 max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 backdrop-blur">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-300" />
            </span>
            {activeCount} typów na dziś
          </div>

          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            Dzisiejsze typy
          </h1>

          <p className="mt-4 text-lg capitalize text-white/55">{formattedDate}</p>

          <p className="mt-2 text-sm text-white/40">
            Dane testowe (mock). Po podłączeniu API Lupus Bota typy będą pobierane
            z tabeli <code className="text-white/60">bot_predictions</code>.
          </p>
        </div>

        <TipsBoard data={data} />
      </section>
    </main>
  )
}
