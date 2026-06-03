import Link from "next/link"
import { ArrowLeft, Flame, Gauge, Percent, Target, TrendingUp } from "lucide-react"
import { getStats } from "@/lib/stats"
import StatsCharts from "@/components/stats-charts"
import { Brand } from "@/components/brand"
import { ThemeToggle } from "@/components/theme-toggle"

export default async function StatsPage() {
  const data = await getStats()
  const s = data.summary

  const streakLabel =
    s.current_streak === 0
      ? "—"
      : s.current_streak > 0
        ? `${s.current_streak} W`
        : `${Math.abs(s.current_streak)} P`

  const kpis = [
    {
      icon: Target,
      label: "Trafialność",
      value: `${(s.win_rate * 100).toFixed(1)}%`,
      tone: "text-[color:var(--accent)]",
    },
    {
      icon: TrendingUp,
      label: "ROI",
      value: `${s.roi >= 0 ? "+" : ""}${(s.roi * 100).toFixed(1)}%`,
      tone: s.roi >= 0 ? "text-emerald-300" : "text-rose-300",
    },
    {
      icon: Percent,
      label: "Typy rozliczone",
      value: `${s.settled_tips}`,
      tone: "text-violet-300",
    },
    {
      icon: Flame,
      label: "Seria",
      value: streakLabel,
      tone: s.current_streak >= 0 ? "text-emerald-300" : "text-rose-300",
    },
    {
      icon: Gauge,
      label: "Śr. Q-Score",
      value: `${s.avg_q_score}`,
      tone: "text-amber-300",
    },
  ]

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
            href="/dashboard"
            className="rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-medium backdrop-blur transition hover:bg-white/15"
          >
            Dzisiejsze typy
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-medium backdrop-blur transition hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden md:inline">Start</span>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10 max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            Statystyki skuteczności
          </h1>
          <p className="mt-4 text-lg text-white/55">
            Wyniki typów z ostatnich {data.range_days} dni — trafialność, ROI, podział
            na rynki i ligi oraz kalibracja Q-Score.
          </p>
          <p className="mt-2 text-sm text-white/40">
            Dane testowe (mock). Po podłączeniu API agregaty będą liczone przez bota
            z tabeli <code className="text-white/60">bot_predictions</code>.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {kpis.map((kpi) => {
            const Icon = kpi.icon
            return (
              <div
                key={kpi.label}
                className="rounded-[1.6rem] border border-white/12 bg-white/[0.055] p-5 shadow-2xl shadow-black/20 backdrop-blur"
              >
                <div className="mb-4 grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-white/70">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm text-white/45">{kpi.label}</p>
                <p className={`mt-1 text-3xl font-semibold ${kpi.tone}`}>{kpi.value}</p>
              </div>
            )
          })}
        </div>

        <StatsCharts data={data} />
      </section>
    </main>
  )
}
