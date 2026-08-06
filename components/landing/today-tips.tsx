"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ArrowRight, CalendarOff } from "lucide-react"
import type { Tip } from "@/lib/types"
import { MARKET_FILTERS, marketGroupOf, type MarketCategory } from "@/lib/market-label"
import { sortKey } from "@/lib/format"
import MatchTipCard, { type MatchGroup } from "../match-tip-card"

// Karta: fade+lekki przesuw przy pojawieniu/zniknięciu po zmianie chipa
// filtra (AnimatePresence w rodzicu) — transform+opacity, 180ms.
function TipCardMotion({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      layout={!reduced}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: reduced ? 0.001 : 0.18, ease: "easeOut" }}
      className="h-full"
    >
      {children}
    </motion.div>
  )
}

// Grupowanie typów w mecze (po event_id; sieroty po home|away|kickoff).
// Ta sama zasada co na /typy — jedna karta = jeden mecz.
function groupByMatch(tips: Tip[]): MatchGroup[] {
  const order: string[] = []
  const map = new Map<string, MatchGroup>()
  for (const t of tips) {
    const key =
      t.event_id != null && t.event_id !== ""
        ? `id:${t.event_id}`
        : `m:${t.home}|${t.away}|${t.kickoff_utc ?? ""}`
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

function Chip({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  count?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`tap inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition-[color,background-color,border-color,box-shadow] duration-200 ${
        active
          ? "border-[color:var(--cyan)] bg-[var(--cyan-soft)] text-[color:var(--cyan)] shadow-[0_0_0_3px_var(--cyan-soft)]"
          : "border-[color:var(--border-subtle)] bg-[var(--bg-1)] text-[color:var(--text-secondary)]"
      }`}
    >
      {children}
      {count != null && (
        <span className="tnum text-xs text-[color:var(--text-muted)]">{count}</span>
      )}
    </button>
  )
}

const MAX_CARDS = 6

/**
 * „Typy dnia" — karty meczów z widocznymi, klikalnymi chipami filtrów
 * (liga + rynek). Filtrowanie jest czysto klientowe: dane dnia są już w propsie,
 * więc nie ma tu fetcha ani stanu ładowania.
 */
export function TodayTips({ tips, loggedIn }: { tips: Tip[]; loggedIn: boolean }) {
  const [league, setLeague] = useState<string>("ALL")
  const [market, setMarket] = useState<MarketCategory | "ALL">("ALL")

  // Ligi występujące dziś — chip pokazuje licznik, więc od razu widać wagę ligi.
  //
  // Etykietę bierzemy z `t.league` (rozwiniętą przez adapter po stronie serwera),
  // a NIE z getLeagueDisplayName(code) — słownik nazw jest zasilany server-side,
  // więc na kliencie kod spoza statycznej listy LEAGUES zostałby pokazany surowo
  // (np. „POL" zamiast „Ekstraklasa").
  const leagues = useMemo(() => {
    const counts = new Map<string, { label: string; n: number }>()
    for (const t of tips) {
      const code = t.leagueCode || t.league
      if (!code) continue
      const prev = counts.get(code)
      counts.set(code, { label: prev?.label || t.league || code, n: (prev?.n ?? 0) + 1 })
    }
    return [...counts.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 8)
  }, [tips])

  // Kategorie rynków — tylko te obecne dziś (pusty chip nic nie wnosi).
  const markets = useMemo(() => {
    const counts = new Map<MarketCategory, number>()
    for (const t of tips) {
      const g = marketGroupOf(t.bet_type_raw ?? t.bet_type, t.bet_side_raw ?? t.bet_side)
      counts.set(g, (counts.get(g) ?? 0) + 1)
    }
    return MARKET_FILTERS.filter((f) => f.key !== "ALL" && counts.has(f.key as MarketCategory)).map(
      (f) => ({ key: f.key as MarketCategory, label: f.label, count: counts.get(f.key as MarketCategory)! }),
    )
  }, [tips])

  const visible = useMemo(() => {
    const out = tips
      .filter((t) => (league === "ALL" ? true : (t.leagueCode || t.league) === league))
      .filter((t) =>
        market === "ALL"
          ? true
          : marketGroupOf(t.bet_type_raw ?? t.bet_type, t.bet_side_raw ?? t.bet_side) === market,
      )
    return [...out].sort((a, b) => sortKey(b.q_score) - sortKey(a.q_score))
  }, [tips, league, market])

  const groups = useMemo(() => groupByMatch(visible).slice(0, MAX_CARDS), [visible])

  return (
    <div>
      {/* chipy filtrów — poziomy scroll na mobile, bez ucinania */}
      <div className="-mx-4 mb-5 space-y-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
          <Chip active={league === "ALL"} onClick={() => setLeague("ALL")} count={tips.length}>
            Wszystkie ligi
          </Chip>
          {leagues.map(([code, { label, n }]) => (
            <Chip key={code} active={league === code} onClick={() => setLeague(code)} count={n}>
              {label}
            </Chip>
          ))}
        </div>
        {markets.length > 0 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
            <Chip active={market === "ALL"} onClick={() => setMarket("ALL")}>
              Każdy rynek
            </Chip>
            {markets.map((m) => (
              <Chip
                key={m.key}
                active={market === m.key}
                onClick={() => setMarket(m.key)}
                count={m.count}
              >
                {m.label}
              </Chip>
            ))}
          </div>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-1)] p-10 text-center">
          <CalendarOff className="mb-3 h-6 w-6 text-[color:var(--text-muted)]" />
          <p className="font-medium">Brak typów dla wybranych filtrów</p>
          <button
            type="button"
            onClick={() => {
              setLeague("ALL")
              setMarket("ALL")
            }}
            className="tap mt-3 inline-flex items-center rounded-full border border-[color:var(--border-subtle)] px-4 text-sm text-[color:var(--text-secondary)]"
          >
            Wyczyść filtry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {groups.map((g) => (
              <TipCardMotion key={g.key}>
                <MatchTipCard
                  group={g}
                  href={g.event_id && !g.tips.some((t) => t.isOrphan) ? `/mecz/${g.event_id}` : undefined}
                  loggedIn={loggedIn}
                />
              </TipCardMotion>
            ))}
          </AnimatePresence>
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <Link
          href="/typy"
          className="tap inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border-subtle)] bg-[var(--bg-1)] px-5 text-sm font-medium text-[color:var(--text-secondary)] transition-colors duration-150 hover:border-[color:var(--cyan)] hover:text-[color:var(--text-primary)]"
        >
          Wszystkie typy dnia <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
