"use client"

import { useMemo, useState } from "react"
import type { BetType, DataSourceStatus, Tip } from "@/lib/types"
import { BET_TYPE_SHORT } from "@/lib/labels"
import { CalendarOff, Database, SlidersHorizontal, Sparkles, TriangleAlert } from "lucide-react"
import TipCard from "./tip-card"
import { Calendar } from "./calendar"

type Sort = "q" | "date" | "odds"

const MODES: { key: "ALL" | BetType; label: string; disabled?: boolean; suffix?: string }[] = [
  { key: "ALL", label: "Wszystkie" },
  { key: "BTTS", label: BET_TYPE_SHORT.BTTS },
  { key: "OVER_1_5", label: BET_TYPE_SHORT.OVER_1_5 },
  { key: "MIX", label: BET_TYPE_SHORT.MIX },
  { key: "THRILLER", label: BET_TYPE_SHORT.THRILLER, disabled: true, suffix: "wkrótce" },
]

function dateLabel(d: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Warsaw",
  }).format(new Date(`${d}T12:00:00Z`))
}

function shortDateLabel(d: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Warsaw",
  }).format(new Date(`${d}T12:00:00Z`))
}

function nearest(target: string, dates: string[]): string | null {
  if (dates.length === 0) return null
  const t = new Date(`${target}T12:00:00Z`).getTime()
  let best = dates[0]
  let bestDiff = Infinity
  for (const d of dates) {
    const diff = Math.abs(new Date(`${d}T12:00:00Z`).getTime() - t)
    if (diff < bestDiff) {
      bestDiff = diff
      best = d
    }
  }
  return best
}

export default function TypyPage({
  initialDate,
  initialTips,
  initialSource,
  initialSourceMessage,
  availableDates,
  loggedIn = false,
}: {
  initialDate: string
  initialTips: Tip[]
  initialSource: DataSourceStatus
  initialSourceMessage?: string
  availableDates: string[]
  loggedIn?: boolean
}) {
  const [date, setDate] = useState(initialDate)
  const [tips, setTips] = useState<Tip[]>(initialTips)
  const [source, setSource] = useState<DataSourceStatus>(initialSource)
  const [sourceMessage, setSourceMessage] = useState<string | undefined>(initialSourceMessage)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"ALL" | BetType>("ALL")
  const [league, setLeague] = useState("ALL")
  const [minQ, setMinQ] = useState(0)
  const [sort, setSort] = useState<Sort>("q")

  async function selectDate(d: string) {
    if (d === date) return
    setDate(d)
    setLeague("ALL")
    setLoading(true)
    try {
      const res = await fetch(`/api/tips?date=${d}`)
      const data = await res.json()
      setSource(data?.source === "live" || data?.source === "mock" || data?.source === "error" ? data.source : "error")
      setSourceMessage(typeof data?.source_message === "string" ? data.source_message : undefined)
      setTips(Array.isArray(data?.tips) ? data.tips : [])
    } catch {
      setSource("error")
      setSourceMessage("Nie udało się odczytać odpowiedzi API.")
      setTips([])
    } finally {
      setLoading(false)
    }
  }

  const leagues = useMemo(() => [...new Set(tips.map((t) => t.league))].sort(), [tips])

  const visible = useMemo(() => {
    const out = tips
      .filter((t) => (mode === "ALL" ? true : t.bet_type === mode))
      .filter((t) => (league === "ALL" ? true : t.league === league))
      .filter((t) => t.q_score >= minQ)
    out.sort((a, b) => {
      if (sort === "q") return b.q_score - a.q_score
      if (sort === "odds") return b.odds - a.odds
      return new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime()
    })
    return out
  }, [tips, mode, league, minQ, sort])

  const suggestion = useMemo(() => {
    if (tips.length > 0) return null
    const n = nearest(date, availableDates)
    return n && n !== date ? n : null
  }, [tips.length, date, availableDates])

  const feedStats = useMemo(() => {
    const avgQ = tips.length > 0 ? tips.reduce((sum, t) => sum + t.q_score, 0) / tips.length : null
    const marketCounts = tips.reduce<Record<string, number>>((acc, t) => {
      const label = BET_TYPE_SHORT[t.bet_type] ?? t.bet_type
      acc[label] = (acc[label] ?? 0) + 1
      return acc
    }, {})
    const bestMarket = Object.entries(marketCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"
    return {
      total: tips.length,
      visible: visible.length,
      avgQ: avgQ != null ? avgQ.toFixed(1) : "—",
      bestMarket,
    }
  }, [tips, visible.length])

  const selectClass =
    "signal-control min-h-11 rounded-2xl px-4 py-2 text-sm outline-none transition focus:border-[color:var(--accent)]/45"
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
      ? "Pobieram typy z Oracle."
      : source === "mock"
        ? "Dane demo/mock do podglądu UI — nie traktuj ich jako realnych typów."
        : sourceMessage || "Oracle zwróciło błąd lub jest niedostępne."

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="signal-hero relative overflow-hidden rounded-[2rem] p-5 sm:p-7 lg:p-8">
        <div className="absolute right-[-5rem] top-[-5rem] hidden h-56 w-56 rounded-full bg-[var(--glow-1)] blur-3xl sm:block" />
        <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[color:var(--line-soft)] bg-black/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
              <Sparkles className="h-3.5 w-3.5" /> Signal Feed
            </div>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">Dzisiejsze typy</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--text-secondary)] sm:text-base">
              {dateLabel(date)}. Q-Score, edge, kurs i status meczu w jednym feedzie analitycznym.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="signal-stat-tile rounded-2xl p-3 sm:p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--text-faint)]">Typy</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums sm:text-3xl">{feedStats.total}</p>
            </div>
            <div className="signal-stat-tile rounded-2xl p-3 sm:p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--text-faint)]">Śr. Q</p>
              <p className="mt-2 text-2xl font-semibold text-[color:var(--accent)] tabular-nums sm:text-3xl">{feedStats.avgQ}</p>
            </div>
            <div className="signal-stat-tile rounded-2xl p-3 sm:p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--text-faint)]">Top rynek</p>
              <p className="mt-2 truncate text-2xl font-semibold sm:text-3xl">{feedStats.bestMarket}</p>
            </div>
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

      <section className="signal-card rounded-[1.7rem] p-4 lg:hidden">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-faint)]">Data</p>
            <p className="mt-1 text-sm font-medium capitalize text-[color:var(--text-secondary)]">{dateLabel(date)}</p>
          </div>
          <SlidersHorizontal className="h-5 w-5 text-[color:var(--accent)]" />
        </div>
        <div className="signal-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {availableDates.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => selectDate(d)}
              className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                d === date ? "signal-chip-active" : "signal-chip"
              }`}
            >
              {shortDateLabel(d)}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr] xl:grid-cols-[320px_1fr]">
        <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
          <div className="signal-card rounded-[1.7rem] p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-faint)]">Control</p>
                <h2 className="mt-1 text-lg font-semibold">Dzień i źródło</h2>
              </div>
              <SlidersHorizontal className="h-5 w-5 text-[color:var(--accent)]" />
            </div>
            <Calendar value={date} available={availableDates} onSelect={selectDate} />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap gap-2">
            {MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => !m.disabled && setMode(m.key)}
                disabled={m.disabled}
                aria-disabled={m.disabled}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  m.disabled
                    ? "signal-chip cursor-not-allowed opacity-45"
                    : mode === m.key
                      ? "signal-chip-active"
                      : "signal-chip hover:bg-[var(--surface-hover)] hover:text-[color:var(--text-primary)]"
                }`}
              >
                {m.label}
                {m.suffix && <span className="ml-1 text-[10px] uppercase tracking-[0.16em]">{m.suffix}</span>}
              </button>
            ))}
          </div>

          <div className="signal-card mb-6 flex flex-col gap-3 rounded-[1.45rem] p-3 sm:flex-row sm:flex-wrap sm:items-center">
            <select value={league} onChange={(e) => setLeague(e.target.value)} className={selectClass}>
              <option value="ALL">Wszystkie ligi</option>
              {leagues.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>

            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={selectClass}>
              <option value="q">Sortuj: Q-Score</option>
              <option value="date">Sortuj: data</option>
              <option value="odds">Sortuj: kurs</option>
            </select>

            <label className="signal-control flex min-h-11 flex-1 items-center gap-3 rounded-2xl px-4 py-2 text-sm sm:min-w-[17rem] sm:flex-none">
              Min. Q-Score: <span className="font-semibold text-[color:var(--accent)]">{minQ}</span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={minQ}
                onChange={(e) => setMinQ(Number(e.target.value))}
                className="min-w-0 flex-1 accent-[var(--accent)]"
              />
            </label>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-[1.8rem] border border-white/10 bg-white/[0.035]" />
              ))}
            </div>
          ) : source === "error" ? (
            <div className="signal-card rounded-[1.8rem] p-10 text-center text-rose-100/90">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-rose-300/30 bg-rose-300/10 text-rose-100">
                <TriangleAlert className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Oracle niedostępne</h3>
              <p className="mt-2 text-sm text-rose-100/80">
                {sourceMessage || "Nie udało się pobrać typów. Spróbuj ponownie później."}
              </p>
            </div>
          ) : tips.length === 0 ? (
            <div className="signal-card rounded-[1.8rem] p-12 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-white/12 bg-white/[0.05] text-white/60">
                <CalendarOff className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Brak typów na ten dzień</h3>
              <p className="mt-2 text-white/55">Wybierz inny dzień z kalendarza.</p>
              {suggestion && (
                <button
                  type="button"
                  onClick={() => selectDate(suggestion)}
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-[color:var(--on-accent)] transition hover:scale-105"
                >
                  Najbliższe typy: {dateLabel(suggestion)}
                </button>
              )}
            </div>
          ) : visible.length === 0 ? (
            <div className="signal-card rounded-[1.8rem] p-10 text-center text-white/55">
              Brak typów dla wybranych filtrów.
            </div>
          ) : (
            <>
              <div className="mb-5 flex items-center justify-between gap-3">
                <p className="text-sm text-[color:var(--text-muted)]">
                  Pokazano <span className="font-semibold text-[color:var(--text-primary)]">{feedStats.visible}</span> z {tips.length} sygnałów
                </p>
                <span className="hidden rounded-full border border-[color:var(--line-soft)] bg-white/[0.035] px-3 py-1 text-xs text-[color:var(--text-muted)] sm:inline-flex">
                  sort: {sort === "q" ? "Q-Score" : sort === "odds" ? "kurs" : "data"}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((tip) => (
                  <TipCard
                    key={String(tip.event_id)}
                    tip={tip}
                    href={loggedIn ? `/mecz/${tip.event_id}` : undefined}
                    locked={!loggedIn}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
