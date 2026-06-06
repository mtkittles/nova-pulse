import { Flame, Gauge, Percent, Target, TrendingUp } from "lucide-react"
import { getStats } from "@/lib/stats"
import StatsCharts from "@/components/stats-charts"
import { LockedSection } from "@/components/locked-section"
import { AppShell } from "@/components/app-shell"
import { getSession } from "@/lib/auth"
import { isOracleConfigured } from "@/lib/oracle"

export const dynamic = "force-dynamic"

export default async function StatsPage() {
  const [data, session] = await Promise.all([getStats(), getSession()])
  const s = data.summary
  const live = isOracleConfigured()

  const streakLabel =
    s.current_streak === 0
      ? "—"
      : s.current_streak > 0
        ? `${s.current_streak} W`
        : `${Math.abs(s.current_streak)} P`

  const kpis = [
    { icon: Target, label: "Trafialność", value: `${(s.win_rate * 100).toFixed(1)}%`, tone: "text-[color:var(--accent)]" },
    {
      icon: TrendingUp,
      label: "ROI",
      value: `${s.roi >= 0 ? "+" : ""}${(s.roi * 100).toFixed(1)}%`,
      tone: s.roi >= 0 ? "text-emerald-300" : "text-rose-300",
    },
    { icon: Percent, label: "Typy rozliczone", value: `${s.settled_tips}`, tone: "text-violet-300" },
    {
      icon: Flame,
      label: "Seria",
      value: streakLabel,
      tone: s.current_streak >= 0 ? "text-emerald-300" : "text-rose-300",
    },
    { icon: Gauge, label: "Śr. Q-Score", value: `${s.avg_q_score}`, tone: "text-amber-300" },
  ]

  return (
    <AppShell loggedIn={Boolean(session)}>
      <div className="mb-10 max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Statystyki skuteczności</h1>
        <p className="mt-4 text-lg text-white/55">
          Wyniki typów z ostatnich {data.range_days} dni — trafialność, ROI, podział na rynki i ligi
          oraz kalibracja Q-Score.
        </p>
        {!session && (
          <p className="mt-3 inline-block rounded-full border border-[color:var(--accent)]/25 bg-[var(--accent)]/10 px-4 py-2 text-sm text-white/75">
            Podstawowe wskaźniki widzisz za darmo. Zaloguj się, aby odblokować pełne wykresy.
          </p>
        )}
        {live && s.total_tips === 0 && (
          <p className="mt-3 inline-block rounded-full border border-[color:var(--accent)]/25 bg-[var(--accent)]/10 px-4 py-2 text-sm text-white/75">
            Statystyki pojawią się, gdy rozegrane mecze zostaną zweryfikowane przez bota — baza typów
            dopiero się zapełnia. To normalne na starcie.
          </p>
        )}
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

      {session ? <StatsCharts data={data} /> : <LockedSection />}
    </AppShell>
  )
}
