"use client"

import { useEffect, useMemo, useState } from "react"
import type { Tip } from "@/lib/types"
import type { CalendarDay } from "@/lib/extra-types"
import { getMarketLabel, MARKET_FILTERS, marketGroupOf, type MarketCategory } from "@/lib/market-label"
import { mapMatchStatus, statusFromKickoff } from "@/lib/tip-utils"
import { sortKey } from "@/lib/format"
import { AlertTriangle, CalendarOff, CalendarDays, LayoutGrid, Table2 } from "lucide-react"
import MatchTipCard, { type MatchGroup } from "./match-tip-card"
import { DateStrip } from "./date-strip"
import { CalendarModal } from "./calendar-modal"
import { TypyTable } from "./typy-table"
import { AnimatedTabs } from "./ui/tabs"
import { CardsCarousel } from "./cards-carousel"
import { TipGridSkeleton } from "./ui/skeletons"
import { EmptyState } from "./ui/empty-state"
import { plMatches } from "@/lib/i18n"

type Sort = "q" | "date" | "odds" | "edge"
type Mode = MarketCategory | "ALL"
type StatusFilter = "ALL" | "upcoming" | "live" | "finished"
type View = "cards" | "table"

// Grupuje typy w mecze (po event_id; sieroty po home|away|kickoff). Zachowuje kolejność.
function groupByMatch(tips: Tip[]): MatchGroup[] {
  const order: string[] = []
  const map = new Map<string, MatchGroup>()
  for (const t of tips) {
    const key =
      t.event_id != null && t.event_id !== "" ? `id:${t.event_id}` : `m:${t.home}|${t.away}|${t.kickoff_utc ?? ""}`
    let g = map.get(key)
    if (!g) {
      g = {
        key,
        event_id: t.event_id,
        home: t.home,
        away: t.away,
        homeLogo: t.homeLogo,
        awayLogo: t.awayLogo,
        league: t.league,
        leagueCode: t.leagueCode,
        kickoff_utc: t.kickoff_utc,
        match_status: t.match_status,
        home_score: t.home_score,
        away_score: t.away_score,
        tips: [],
      }
      map.set(key, g)
      order.push(key)
    }
    g.tips.push(t)
  }
  return order.map((k) => map.get(k)!)
}

// status typu do filtra (bez danych live — przybliżenie z match_status + kickoff).
function statusOf(tip: Tip, now: number): "upcoming" | "live" | "finished" {
  const oracle = mapMatchStatus(tip.match_status)
  if (oracle) return oracle
  const k = statusFromKickoff(tip.kickoff_utc, now)
  return k === "finished" ? "finished" : k === "live" ? "live" : "upcoming"
}

function emptyDayMessage(day?: CalendarDay): { title: string; desc: string } {
  if (!day || (day.matches === 0 && day.analyzed == null && day.tips === 0))
    return { title: "Brak typów na ten dzień", desc: "Wybierz inny dzień z paska lub kalendarza." }
  if (!day.matches || day.matches === 0)
    return { title: "Brak meczów tego dnia", desc: "Tego dnia nie zaplanowano żadnych spotkań." }
  if (day.analyzed == null || day.analyzed === 0)
    return {
      title: "Analiza jeszcze nie wykonana",
      desc: `Zaplanowano ${day.matches} ${plMatches(day.matches)} — analiza jeszcze nie wykonana.`,
    }
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
  const availableDates = useMemo(() => calendar.filter((d) => d.tips !== 0).map((d) => d.date), [calendar])
  const [date, setDate] = useState(initialDate)
  const [tips, setTips] = useState<Tip[]>(initialTips)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<Mode>("ALL")
  const [league, setLeague] = useState("ALL")
  const [minQ, setMinQ] = useState(0)
  const [minEdge, setMinEdge] = useState(0)
  const [statusF, setStatusF] = useState<StatusFilter>("ALL")
  const [sort, setSort] = useState<Sort>("q")
  const [view, setView] = useState<View>("cards")
  const [calOpen, setCalOpen] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(id)
  }, [])

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
      .filter((t) => (mode === "ALL" ? true : marketGroupOf(t.bet_type_raw ?? t.bet_type, t.bet_side_raw ?? t.bet_side) === mode))
      .filter((t) => (league === "ALL" ? true : t.league === league))
      // null = nieznana metryka: widoczna przy progu 0, ukrywana dopiero gdy próg podniesiony
      .filter((t) => (t.q_score == null ? minQ <= 0 : t.q_score >= minQ))
      .filter((t) => (t.edge == null ? minEdge <= 0 : t.edge * 100 >= minEdge))
      .filter((t) => (statusF === "ALL" ? true : statusOf(t, now) === statusF))
    out.sort((a, b) => {
      if (sort === "q") return sortKey(b.q_score) - sortKey(a.q_score)
      if (sort === "odds") return sortKey(b.odds) - sortKey(a.odds)
      if (sort === "edge") return sortKey(b.edge) - sortKey(a.edge)
      const ta = a.kickoff_utc ? new Date(a.kickoff_utc).getTime() : Infinity
      const tb = b.kickoff_utc ? new Date(b.kickoff_utc).getTime() : Infinity
      return ta - tb
    })
    return out
  }, [tips, mode, league, minQ, minEdge, statusF, sort, now])

  const groups = useMemo(() => groupByMatch(visible), [visible])

  const hasThriller = useMemo(
    () => visible.some((t) => getMarketLabel(t.bet_type_raw ?? t.bet_type, t.bet_side_raw ?? t.bet_side).short === "Thriller"),
    [visible],
  )

  const suggestion = useMemo(() => {
    if (tips.length > 0) return null
    const n = nearest(date, availableDates)
    return n && n !== date ? n : null
  }, [tips.length, date, availableDates])

  const selectClass =
    "rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-1)] px-4 py-2 text-sm text-[color:var(--text-secondary)] outline-none focus-visible:border-[color:var(--cyan)]"

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Typy meczowe</h1>
        <p className="mt-2 text-lg capitalize text-[color:var(--text-secondary)]">{dateLabel(date)}</p>
      </header>

      {/* pasek dat + kalendarz */}
      <div className="mb-5 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <DateStrip value={date} calendar={calendar} onSelect={selectDate} />
        </div>
        <button
          type="button"
          onClick={() => setCalOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-card)] border border-[color:var(--border-soft)] bg-[var(--surface-1)] px-4 py-2.5 text-sm font-medium text-[color:var(--text-secondary)] transition hover:bg-[var(--surface-2)] hover:text-[color:var(--text-primary)]"
        >
          <CalendarDays className="h-4 w-4" /> <span className="hidden sm:inline">Kalendarz</span>
        </button>
      </div>

      <CalendarModal open={calOpen} value={date} days={calendar} onSelect={selectDate} onClose={() => setCalOpen(false)} />

      {/* filtry rynków */}
      <AnimatedTabs
        groupId="typy-modes"
        className="mb-4"
        value={mode}
        onChange={(k) => setMode(k as Mode)}
        items={MARKET_FILTERS.map((f) => ({
          key: f.key,
          label: f.label,
          count:
            f.key === "ALL"
              ? tips.length
              : tips.filter((t) => marketGroupOf(t.bet_type_raw ?? t.bet_type, t.bet_side_raw ?? t.bet_side) === f.key).length,
        }))}
      />

      {/* filtry szczegółowe + widok */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <select value={league} onChange={(e) => setLeague(e.target.value)} className={selectClass} aria-label="Filtruj po lidze">
          <option value="ALL">Wszystkie ligi</option>
          {leagues.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>

        <select value={statusF} onChange={(e) => setStatusF(e.target.value as StatusFilter)} className={selectClass} aria-label="Status">
          <option value="ALL">Każdy status</option>
          <option value="upcoming">Nadchodzące</option>
          <option value="live">Na żywo</option>
          <option value="finished">Zakończone</option>
        </select>

        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={selectClass} aria-label="Sortowanie typów">
          <option value="q">Sortuj: Q-Score</option>
          <option value="edge">Sortuj: edge</option>
          <option value="odds">Sortuj: kurs</option>
          <option value="date">Sortuj: data</option>
        </select>

        <label className="flex items-center gap-2 rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-1)] px-4 py-2 text-sm text-[color:var(--text-secondary)]">
          Min. Q: <span className="font-semibold text-[color:var(--cyan)] tnum">{minQ}</span>
          <input type="range" min={0} max={100} step={5} value={minQ} onChange={(e) => setMinQ(Number(e.target.value))} className="accent-[var(--cyan)]" />
        </label>

        <label className="flex items-center gap-2 rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-1)] px-4 py-2 text-sm text-[color:var(--text-secondary)]">
          Min. edge: <span className="font-semibold text-[color:var(--cyan)] tnum">{minEdge}%</span>
          <input type="range" min={0} max={15} step={1} value={minEdge} onChange={(e) => setMinEdge(Number(e.target.value))} className="accent-[var(--cyan)]" />
        </label>

        {/* przełącznik widoku */}
        <div className="ml-auto inline-flex rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-1)] p-0.5">
          {([["cards", "Karty", LayoutGrid], ["table", "Tabela", Table2]] as const).map(([k, label, Icon]) => (
            <button
              key={k}
              type="button"
              onClick={() => setView(k)}
              aria-pressed={view === k}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                view === k ? "bg-[var(--cyan-soft)] text-[color:var(--cyan)]" : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
              }`}
            >
              <Icon className="h-4 w-4" /> <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="-mt-2 mb-5 text-xs text-[color:var(--text-muted)]">🕐 Godziny w czasie lokalnym Twojego urządzenia</p>

      {hasThriller && (
        <div className="mb-5 flex items-start gap-3 rounded-[var(--radius-card)] border border-[color:var(--warning)]/30 bg-[color:var(--warning)]/[0.08] p-4 text-sm text-[color:var(--text-secondary)]">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--warning)]" />
          <p>
            <strong className="font-semibold text-[color:var(--text-primary)]">Tryb wysokiego ryzyka.</strong> Dokładny wynik 3:2/2:3
            to loteria — prawdziwe prawdopodobieństwo jest niskie. Kursy wysokie, trafialność mała. Graj świadomie.
          </p>
        </div>
      )}

      {loading ? (
        <TipGridSkeleton />
      ) : tips.length === 0 ? (
        <EmptyState
          icon={CalendarOff}
          title={emptyDayMessage(selectedDay).title}
          description={emptyDayMessage(selectedDay).desc}
          cta={suggestion ? { label: `Najbliższe typy: ${dateLabel(suggestion)}`, onClick: () => selectDate(suggestion) } : undefined}
        />
      ) : visible.length === 0 ? (
        <EmptyState icon={CalendarOff} title="Brak typów dla wybranych filtrów" description="Poluzuj filtry rynku, ligi, Q-Score lub edge." />
      ) : (
        <>
          <p className="mb-5 text-sm text-[color:var(--text-secondary)]">
            Pokazano <span className="font-semibold text-[color:var(--text-primary)] tnum">{visible.length}</span> z {tips.length} typów
            {view === "cards" && (
              <>
                {" "}w <span className="font-semibold text-[color:var(--text-primary)] tnum">{groups.length}</span> {plMatches(groups.length)}
              </>
            )}
            .
          </p>

          {view === "cards" ? (
            <CardsCarousel key={`${date}-${mode}-${league}-${sort}`} autoPlay={false} ariaLabel="Typy meczowe">
              {groups.map((g) => (
                <MatchTipCard key={g.key} group={g} href={loggedIn && g.event_id ? `/mecz/${g.event_id}` : undefined} locked={!loggedIn} />
              ))}
            </CardsCarousel>
          ) : (
            <TypyTable tips={visible} loggedIn={loggedIn} />
          )}
        </>
      )}
    </div>
  )
}
