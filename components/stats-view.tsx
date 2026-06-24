"use client"

import { useState } from "react"
import type { DataSourceStatus, StatsResponse } from "@/lib/stats-types"
import type { Tip } from "@/lib/types"
import { Activity, CheckCircle2, Database, Hourglass, Percent, Star, Target, TrendingUp, TriangleAlert } from "lucide-react"
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
      ? "signal-badge-live"
      : source === "mock"
        ? "signal-badge-mock"
        : "signal-badge-error"
  const sourceLabel = source === "live" ? "live" : source === "mock" ? "mock" : "error"
  const sourceTitle = source === "live" ? "Dane realne" : source === "mock" ? "Dane testowe" : "Błąd źródła"
  const sourceHint =
    source === "live"
      ? "Statystyki pobrane z Oracle."
      : source === "mock"
        ? "Dane demo/mock do podglądu UI — nie interpretuj KPI jako realnej skuteczności."
        : sourceMessage || "Oracle zwróciło błąd lub jest niedostępne."
  const kpis = [
    { icon: Target, label: "Typy", value: `${s.total_tips}`, context: `${s.settled_tips} rozliczonych`, tone: "text-[color:var(--accent)]" },
    { icon: CheckCircle2, label: "Trafione", value: `${s.wins}`, context: `${s.losses} stratnych`, tone: "text-emerald-300" },
    { icon: Percent, label: "Skuteczność", value: `${(s.win_rate * 100).toFixed(1)}%`, context: "win-rate modelu", tone: "text-violet-300" },
    {
      icon: TrendingUp,
      label: "ROI",
      value: `${s.roi >= 0 ? "+" : ""}${(s.roi * 100).toFixed(1)}%`,
      context: "flat stake 1u",
      tone: s.roi >= 0 ? "text-emerald-300" : "text-rose-300",
    },
    {
      icon: Star,
      label: "Śr. Q-Score",
      value: avgQ != null && avgQ > 0 ? avgQ.toFixed(1) : "—",
      context: "kalibracja sygnałów",
      tone: avgQ != null && avgQ >= 65 ? "text-amber-300" : "text-white/60",
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="signal-hero relative overflow-hidden rounded-[2rem] p-5 sm:p-7 lg:p-8">
        <div className="absolute right-[-5rem] top-[-5rem] hidden h-60 w-60 rounded-full bg-[var(--glow-2)] blur-3xl sm:block" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[color:var(--line-soft)] bg-black/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
              <Activity className="h-3.5 w-3.5" /> Analytics OS
            </div>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">Dashboard skuteczności</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--text-secondary)] sm:text-base">
              Trafialność, ROI, rynki i kalibracja Q-Score z auto-weryfikacji wyników.
            </p>
          </div>

          <div className="signal-control grid grid-cols-3 rounded-2xl p-1">
          {PERIODS.map((p) => (
            <button
              key={p.k}
              type="button"
              onClick={() => pick(p.k)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                period === p.k
                  ? "bg-[var(--accent)] text-[color:var(--on-accent)]"
                  : "text-[color:var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[color:var(--text-primary)]"
              }`}
            >
              {p.l}
            </button>
          ))}
          </div>
        </div>

        <div className={`relative mt-5 flex flex-wrap items-center gap-2 rounded-2xl border px-3 py-2.5 ${sourceClass}`}>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] sm:text-sm">
            {source === "error" ? <TriangleAlert className="h-4 w-4" /> : <Database className="h-4 w-4" />}
            {sourceTitle}
          </span>
          <span className="rounded-full bg-black/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
            {sourceLabel}
          </span>
          <span className="text-xs leading-relaxed text-white/75 sm:text-sm">{sourceHint}</span>
        </div>
      </header>

      <div className={`grid grid-cols-2 gap-3 lg:grid-cols-5 ${loading ? "opacity-50" : ""}`}>
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.label}
              className="signal-insight-card rounded-[1.45rem] p-4 sm:p-5"
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/[0.07] text-white/70">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="h-2 w-2 rounded-full bg-[var(--accent)]/70" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-faint)]">{kpi.label}</p>
              <p className={`mt-2 text-3xl font-semibold tracking-[-0.03em] tabular-nums ${kpi.tone}`}>{kpi.value}</p>
              <p className="mt-2 text-xs text-[color:var(--text-muted)]">{kpi.context}</p>
            </div>
          )
        })}
      </div>

      {source === "error" ? (
        <div className="signal-card rounded-[1.8rem] p-12 text-center text-rose-100/90">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-rose-300/30 bg-rose-300/10 text-rose-100">
            <TriangleAlert className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold">Nie udało się pobrać statystyk</h3>
          <p className="mt-2 text-rose-100/75">{sourceMessage || "Oracle zwróciło błąd lub jest niedostępne."}</p>
        </div>
      ) : empty ? (
        <div className="signal-card rounded-[1.8rem] p-12 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-[color:var(--accent)]/30 bg-[var(--accent)]/10 text-[color:var(--accent)]">
            <Hourglass className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold">
            {source === "mock" ? "Brak danych testowych dla tego okresu" : "Brak rozliczonych typów w wybranym okresie"}
          </h3>
          <p className="mt-2 text-white/55">
            {source === "mock"
              ? "Widok działa na mocku, ale w tym zakresie nie ma rekordów do agregacji."
              : "Mecze nie zostały jeszcze rozliczone albo wybrany zakres nie zawiera gotowych wyników."}
          </p>
        </div>
      ) : loggedIn ? (
        <div className={loading ? "opacity-50 transition" : "transition"}>
          <StatsCharts data={data} />

          <div className="signal-card rounded-[1.55rem] p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-faint)]">Settlement log</p>
                <h3 className="mt-1 text-xl font-semibold tracking-[-0.02em]">Ostatnie rozliczone typy</h3>
                <p className="signal-muted mt-1 text-sm">
                  {source === "mock"
                    ? "Sekcja ukrywa mocki i pokazuje tylko realnie rozliczone rekordy z Oracle."
                    : `${settledTips.length} ostatnich typów z weryfikacją wyniku`}
                </p>
              </div>
            </div>
            <div className="mt-5">
              <SettledTips tips={settledTips} />
            </div>
          </div>
        </div>
      ) : (
        <LockedSection />
      )}
    </div>
  )
}
