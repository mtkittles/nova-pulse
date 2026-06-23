"use client"

import { useState } from "react"
import type { DataSourceStatus, StatsResponse } from "@/lib/stats-types"
import type { Tip } from "@/lib/types"
import { CheckCircle2, Database, Hourglass, Percent, Star, Target, TrendingUp, TriangleAlert } from "lucide-react"
import StatsCharts from "./stats-charts"
import { SettledTips } from "./settled-tips"
import { LockedSection } from "./locked-section"

const PERIODS = [
  { k: "7", l: "7 dni" },
  { k: "30", l: "30 dni" },
  { k: "all", l: "Całość" },
]

export function StatsView({
  initial,
  initialPeriod,
  initialSource,
  initialSourceMessage,
  loggedIn,
  settledTips = [],
}: {
  initial: StatsResponse
  initialPeriod: string
  initialSource: DataSourceStatus
  initialSourceMessage?: string
  loggedIn: boolean
  settledTips?: Tip[]
}) {
  const [period, setPeriod] = useState(initialPeriod)
  const [data, setData] = useState(initial)
  const [source, setSource] = useState<DataSourceStatus>(initialSource)
  const [sourceMessage, setSourceMessage] = useState<string | undefined>(initialSourceMessage)
  const [loading, setLoading] = useState(false)

  async function pick(p: string) {
    if (p === period) return
    setPeriod(p)
    setLoading(true)
    try {
      const res = await fetch(`/api/stats?period=${p}`)
      const j = await res.json()
      setSource(j?.source === "live" || j?.source === "mock" || j?.source === "error" ? j.source : "error")
      setSourceMessage(typeof j?.source_message === "string" ? j.source_message : undefined)
      if (j && j.summary) setData(j)
    } catch {
      setSource("error")
      setSourceMessage("Nie udało się odczytać odpowiedzi API.")
      /* zostaw poprzednie */
    } finally {
      setLoading(false)
    }
  }

  const s = data.summary
  const empty = s.total_tips === 0

  const avgQ = s.avg_q_score
  const sourceClass =
    source === "live"
      ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
      : source === "mock"
        ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
        : "border-rose-300/30 bg-rose-300/10 text-rose-100"
  const sourceLabel = source === "live" ? "live" : source === "mock" ? "mock" : "error"
  const sourceTitle = source === "live" ? "Dane realne" : source === "mock" ? "Dane testowe" : "Błąd źródła"
  const sourceHint =
    source === "live"
      ? "Statystyki pobrane z Oracle."
      : source === "mock"
        ? "Pokazuję mock, bo Oracle nie jest skonfigurowane."
        : sourceMessage || "Oracle zwróciło błąd lub jest niedostępne."
  const kpis = [
    { icon: Target, label: "Typy", value: `${s.total_tips}`, tone: "text-[color:var(--accent)]" },
    { icon: CheckCircle2, label: "Trafione", value: `${s.wins}`, tone: "text-emerald-300" },
    { icon: Percent, label: "Skuteczność", value: `${(s.win_rate * 100).toFixed(1)}%`, tone: "text-violet-300" },
    {
      icon: TrendingUp,
      label: "ROI",
      value: `${s.roi >= 0 ? "+" : ""}${(s.roi * 100).toFixed(1)}%`,
      tone: s.roi >= 0 ? "text-emerald-300" : "text-rose-300",
    },
    {
      icon: Star,
      label: "Śr. Q-Score",
      value: avgQ != null && avgQ > 0 ? avgQ.toFixed(1) : "—",
      tone: avgQ != null && avgQ >= 65 ? "text-amber-300" : "text-white/60",
    },
  ]

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Statystyki skuteczności</h1>
          <p className="mt-3 text-white/55">Trafialność, ROI i kalibracja Q-Score — z auto-weryfikacji wyników.</p>
          <div className={`mt-4 flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 ${sourceClass}`}>
            <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em]">
              {source === "error" ? <TriangleAlert className="h-4 w-4" /> : <Database className="h-4 w-4" />}
              {sourceTitle}
            </span>
            <span className="rounded-full bg-black/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
              {sourceLabel}
            </span>
            <span className="text-sm text-white/80">{sourceHint}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.k}
              type="button"
              onClick={() => pick(p.k)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                period === p.k
                  ? "border-[color:var(--accent)]/40 bg-[var(--accent)]/15 text-white"
                  : "border-white/12 bg-white/[0.05] text-white/60 hover:bg-white/10"
              }`}
            >
              {p.l}
            </button>
          ))}
        </div>
      </div>

      <div className={`mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5 ${loading ? "opacity-50" : ""}`}>
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

      {source === "error" ? (
        <div className="rounded-[1.8rem] border border-rose-300/25 bg-rose-300/[0.08] p-12 text-center text-rose-100/90">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-rose-300/30 bg-rose-300/10 text-rose-100">
            <TriangleAlert className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold">Nie udało się pobrać statystyk</h3>
          <p className="mt-2 text-rose-100/75">{sourceMessage || "Oracle zwróciło błąd lub jest niedostępne."}</p>
        </div>
      ) : empty ? (
        <div className="rounded-[1.8rem] border border-white/12 bg-white/[0.04] p-12 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-[color:var(--accent)]/30 bg-[var(--accent)]/10 text-[color:var(--accent)]">
            <Hourglass className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold">Statystyki pojawią się po rozegraniu meczów</h3>
          <p className="mt-2 text-white/55">
            Baza typów dopiero się zapełnia. Po zakończeniu meczów bot automatycznie zweryfikuje wyniki
            i wykresy ożyją.
          </p>
        </div>
      ) : loggedIn ? (
        <div className={loading ? "opacity-50 transition" : "transition"}>
          <StatsCharts data={data} />

          {settledTips.length > 0 && (
            <div className="mt-8 rounded-[1.8rem] border border-white/12 bg-white/[0.055] p-6 shadow-2xl shadow-black/20 backdrop-blur">
              <h3 className="text-lg font-semibold">Ostatnie rozliczone typy</h3>
              <p className="mt-1 text-sm text-white/45">
                {settledTips.length} ostatnich typów z weryfikacją wyniku
              </p>
              <div className="mt-5">
                <SettledTips tips={settledTips} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <LockedSection />
      )}
    </div>
  )
}
