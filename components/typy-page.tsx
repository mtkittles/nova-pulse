"use client"

import { useMemo, useState } from "react"
import type { BetType, Tip } from "@/lib/types"
import type { CalendarDay } from "@/lib/extra-types"
import { BET_TYPE_SHORT } from "@/lib/labels"
import { AlertTriangle, CalendarOff } from "lucide-react"
import TipCard from "./tip-card"
import { Calendar } from "./calendar"
import { AnimatedTabs } from "./ui/tabs"
import { StaggerGrid, StaggerItem } from "./ui/stagger"
import { TipGridSkeleton } from "./ui/skeletons"
import { plMatches, plTips } from "@/lib/i18n"

type Sort = "q" | "date" | "odds"

const MODE_KEYS: ("ALL" | BetType)[] = ["ALL", "BTTS", "OVER_1_5", "MIX", "THRILLER"]
const modeLabel = (k: "ALL" | BetType) => (k === "ALL" ? "Wszystkie" : BET_TYPE_SHORT[k])

// 3 stany pustego dnia: brak meczów / analiza niewykonana / przeanalizowane bez typów.
function emptyDayMessage(day?: CalendarDay): { title: string; desc: string } {
  if (!day || (day.matches === 0 && day.analyzed == null && day.tips === 0))
    return { title: "Brak typów na ten dzień", desc: "Wybierz inny dzień z kalendarza." }
  // A
  if (!day.matches || day.matches === 0)
    return { title: "Brak meczów tego dnia", desc: "Tego dnia nie zaplanowano żadnych spotkań." }
  // B
  if (day.analyzed == null || day.analyzed === 0)
    return {
      title: "Analiza jeszcze nie wykonana",
      desc: `Zaplanowano ${day.matches} ${plMatches(day.matches)} — analiza jeszcze nie wykonana.`,
    }
  // C
  return {
    title: "Brak typów powyżej progu jakości",
    desc: `Przeanalizowano ${day.analyzed} ${plMatches(day.analyzed)} — żaden nie przekroczył progu jakości (Q ≥ 50).`,
  }
}

function dateLabel(d: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
  calendar,
  loggedIn = false,
}: {
  initialDate: string
  initialTips: Tip[]
  calendar: CalendarDay[]
  loggedIn?: boolean
}) {
  const availableDates = useMemo(
    () => calendar.filter((d) => d.tips !== 0).map((d) => d.date),
    [calendar],
  )
  const [date, setDate] = useState(initialDate)
  const [tips, setTips] = useState<Tip[]>(initialTips)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"ALL" | BetType>("ALL")
  const [league, setLeague] = useState("ALL")
  const [minQ, setMinQ] = useState(0)
  const [sort, setSort] = useState<Sort>("q")

  const selectedDay = useMemo(() => calendar.find((d) => d.date === date), [calendar, date])

  async function selectDate(d: string) {
    if (d === date) return
    setDate(d)
    setLeague("ALL")
    setLoading(true)
    try {
      const res = await fetch(`/api/tips?date=${d}`)
      const data = await res.json()
      setTips(Array.isArray(data?.tips) ? data.tips : [])
    } catch {
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

  const selectClass =
    "rounded-full border border-white/12 bg-[var(--bg-soft)] px-4 py-2 text-sm text-white/80 outline-none focus:border-[color:var(--accent)]/40"

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Typy meczowe</h1>
        <p className="mt-3 text-lg capitalize text-white/55">{dateLabel(date)}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Calendar value={date} days={calendar} onSelect={selectDate} />
          {selectedDay && (selectedDay.tips > 0 || selectedDay.matches > 0) && (
            <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-center text-sm text-white/70">
              <span className="font-semibold text-[color:var(--accent)]">{Math.max(selectedDay.tips, 0)}</span>{" "}
              {plTips(Math.max(selectedDay.tips, 0))} · {selectedDay.matches} {plMatches(selectedDay.matches)} ·{" "}
              {selectedDay.leagues} lig
            </p>
          )}
        </aside>

        <div>
          <h2 className="sr-only">Typy na wybrany dzień</h2>
          {/* tryby */}
          <AnimatedTabs
            groupId="typy-modes"
            className="mb-4"
            value={mode}
            onChange={(k) => setMode(k as "ALL" | BetType)}
            items={MODE_KEYS.map((k) => ({
              key: k,
              label: modeLabel(k),
              count: k === "ALL" ? tips.length : tips.filter((t) => t.bet_type === k).length,
            }))}
          />

          {/* filtry + sort */}
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <select value={league} onChange={(e) => setLeague(e.target.value)} className={selectClass} aria-label="Filtruj po lidze">
              <option value="ALL">Wszystkie ligi</option>
              {leagues.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>

            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={selectClass} aria-label="Sortowanie typów">
              <option value="q">Sortuj: Q-Score</option>
              <option value="date">Sortuj: data</option>
              <option value="odds">Sortuj: kurs</option>
            </select>

            <label className="flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm text-white/70">
              Min. Q-Score: <span className="font-semibold text-[color:var(--accent)]">{minQ}</span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={minQ}
                onChange={(e) => setMinQ(Number(e.target.value))}
                className="accent-[var(--accent)]"
              />
            </label>
          </div>

          {mode === "THRILLER" && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-300/25 bg-amber-300/[0.08] p-4 text-sm text-amber-100/85">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              <p>
                <strong className="font-semibold">Tryb wysokiego ryzyka.</strong> Dokładny wynik 3:2/2:3
                to loteria — prawdziwe prawdopodobieństwo jest niskie (zwykle kilka procent). Kursy są
                wysokie, ale trafialność mała. Gra tylko świadoma, za środki które możesz stracić.
              </p>
            </div>
          )}

          {loading ? (
            <TipGridSkeleton />
          ) : tips.length === 0 ? (
            <div className="rounded-[1.8rem] border border-white/12 bg-white/[0.04] p-12 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-white/12 bg-white/[0.05] text-white/60">
                <CalendarOff className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">{emptyDayMessage(selectedDay).title}</h3>
              <p className="mt-2 text-white/55">{emptyDayMessage(selectedDay).desc}</p>
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
            <div className="rounded-[1.8rem] border border-white/12 bg-white/[0.04] p-10 text-center text-white/55">
              Brak typów dla wybranych filtrów.
            </div>
          ) : (
            <>
              <p className="mb-5 text-sm text-white/60">
                Pokazano <span className="font-semibold text-white/80">{visible.length}</span> z {tips.length}{" "}
                typów.
              </p>
              <StaggerGrid key={`${date}-${mode}-${league}-${sort}`} className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((tip) => (
                  <StaggerItem key={String(tip.event_id)}>
                    <TipCard
                      tip={tip}
                      href={loggedIn && tip.event_id ? `/mecz/${tip.event_id}` : undefined}
                      locked={!loggedIn}
                    />
                  </StaggerItem>
                ))}
              </StaggerGrid>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
