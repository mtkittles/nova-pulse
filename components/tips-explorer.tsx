"use client"

import { useMemo, useState } from "react"
import type { BetType, Tip, TipsResponse } from "@/lib/types"
import TipCard from "./tip-card"
import { Calculator, Trash2, X } from "lucide-react"

const MARKET_LABEL: Record<BetType, string> = {
  BTTS: "BTTS",
  OVER_1_5: "Over 1.5",
  MIX: "Mix",
  THRILLER: "Thriller",
}

const WARSAW = "Europe/Warsaw"

function dayKey(iso: string): string {
  // YYYY-MM-DD w strefie Warszawy (en-CA daje ten format)
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: WARSAW,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso))
}

function dayLabel(iso: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    timeZone: WARSAW,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso))
}

function eid(t: Tip): string {
  return String(t.event_id)
}

export default function TipsExplorer({ data }: { data: TipsResponse }) {
  const [date, setDate] = useState<string>("ALL")
  const [market, setMarket] = useState<"ALL" | BetType>("ALL")
  const [league, setLeague] = useState<string>("ALL")
  const [minQ, setMinQ] = useState<number>(0)
  const [coupon, setCoupon] = useState<Tip[]>([])
  const [stake, setStake] = useState<number>(10)
  const [open, setOpen] = useState<boolean>(false)

  // dostępne daty (posortowane) z licznikami
  const dates = useMemo(() => {
    const map = new Map<string, { iso: string; count: number }>()
    for (const t of data.tips) {
      const k = dayKey(t.kickoff_utc)
      const cur = map.get(k)
      if (cur) cur.count++
      else map.set(k, { iso: t.kickoff_utc, count: 1 })
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [data.tips])

  const markets = useMemo(() => {
    const set = new Set<BetType>()
    data.tips.forEach((t) => set.add(t.bet_type))
    return (["BTTS", "OVER_1_5", "MIX", "THRILLER"] as BetType[]).filter((m) => set.has(m))
  }, [data.tips])

  const leagues = useMemo(() => {
    return [...new Set(data.tips.map((t) => t.league))].sort()
  }, [data.tips])

  const visible = useMemo(() => {
    return data.tips
      .filter((t) => (date === "ALL" ? true : dayKey(t.kickoff_utc) === date))
      .filter((t) => (market === "ALL" ? true : t.bet_type === market))
      .filter((t) => (league === "ALL" ? true : t.league === league))
      .filter((t) => t.q_score >= minQ)
      .sort((a, b) => new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime() || b.q_score - a.q_score)
  }, [data.tips, date, market, league, minQ])

  const couponIds = useMemo(() => new Set(coupon.map(eid)), [coupon])

  function toggleCoupon(t: Tip) {
    setCoupon((prev) => (prev.some((x) => eid(x) === eid(t)) ? prev.filter((x) => eid(x) !== eid(t)) : [...prev, t]))
  }

  const combinedOdds = coupon.reduce((acc, t) => acc * (t.odds || 1), 1)
  const combinedProb = coupon.reduce((acc, t) => acc * (t.model_prob || 0), 1)
  const potentialReturn = stake * combinedOdds

  const selectClass =
    "rounded-full border border-white/12 bg-[var(--bg-soft)] px-4 py-2 text-sm text-white/80 outline-none focus:border-[color:var(--accent)]/40"

  return (
    <div className={coupon.length > 0 ? "pb-40" : ""}>
      {/* zakładki dat */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setDate("ALL")}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
            date === "ALL"
              ? "border-[color:var(--accent)]/40 bg-[var(--accent)]/15 text-white"
              : "border-white/12 bg-white/[0.05] text-white/60 hover:bg-white/10"
          }`}
        >
          Wszystkie dni ({data.tips.length})
        </button>
        {dates.map(([key, info]) => (
          <button
            key={key}
            type="button"
            onClick={() => setDate(key)}
            className={`rounded-full border px-4 py-2 text-sm font-medium capitalize transition ${
              date === key
                ? "border-[color:var(--accent)]/40 bg-[var(--accent)]/15 text-white"
                : "border-white/12 bg-white/[0.05] text-white/60 hover:bg-white/10"
            }`}
          >
            {dayLabel(info.iso)} ({info.count})
          </button>
        ))}
      </div>

      {/* filtry */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setMarket("ALL")}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
            market === "ALL"
              ? "border-[color:var(--accent)]/40 bg-[var(--accent)]/15 text-white"
              : "border-white/12 bg-white/[0.05] text-white/60 hover:bg-white/10"
          }`}
        >
          Wszystkie rynki
        </button>
        {markets.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMarket(m)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              market === m
                ? "border-[color:var(--accent)]/40 bg-[var(--accent)]/15 text-white"
                : "border-white/12 bg-white/[0.05] text-white/60 hover:bg-white/10"
            }`}
          >
            {MARKET_LABEL[m]}
          </button>
        ))}

        <select value={league} onChange={(e) => setLeague(e.target.value)} className={selectClass}>
          <option value="ALL">Wszystkie ligi</option>
          {leagues.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
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

      <p className="mb-5 text-sm text-white/45">
        Pokazano <span className="font-semibold text-white/80">{visible.length}</span> typów.
      </p>

      {visible.length === 0 ? (
        <div className="rounded-[1.8rem] border border-white/12 bg-white/[0.04] p-10 text-center text-white/55">
          Brak typów dla wybranych filtrów.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((tip) => (
            <TipCard
              key={eid(tip)}
              tip={tip}
              selectable
              selected={couponIds.has(eid(tip))}
              onToggle={() => toggleCoupon(tip)}
            />
          ))}
        </div>
      )}

      {/* pasek kuponu */}
      {coupon.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/12 bg-[var(--bg-soft)]/95 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-6 py-4">
            {open && (
              <div className="mb-4 max-h-52 space-y-2 overflow-auto">
                {coupon.map((t) => (
                  <div
                    key={eid(t)}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm"
                  >
                    <span className="truncate text-white/80">
                      {t.home} – {t.away}{" "}
                      <span className="text-white/40">· {MARKET_LABEL[t.bet_type]} {t.bet_side}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="font-semibold">{t.odds.toFixed(2)}</span>
                      <button type="button" onClick={() => toggleCoupon(t)} aria-label="Usuń">
                        <X className="h-4 w-4 text-white/45 hover:text-white" />
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-white"
              >
                <Calculator className="h-5 w-5 text-[color:var(--accent)]" />
                Kupon: {coupon.length} {coupon.length === 1 ? "typ" : "typy"}
                <span className="text-white/40">({open ? "zwiń" : "rozwiń"})</span>
              </button>

              <div className="flex flex-wrap items-center gap-5 text-sm">
                <div>
                  <span className="text-white/45">Kurs łączny: </span>
                  <span className="font-semibold text-[color:var(--accent)]">{combinedOdds.toFixed(2)}</span>
                </div>
                <div className="hidden sm:block">
                  <span className="text-white/45">Prawd.: </span>
                  <span className="font-semibold">{(combinedProb * 100).toFixed(combinedProb < 0.01 ? 2 : 1)}%</span>
                </div>
                <label className="flex items-center gap-2">
                  <span className="text-white/45">Stawka</span>
                  <input
                    type="number"
                    min={1}
                    value={stake}
                    onChange={(e) => setStake(Math.max(0, Number(e.target.value)))}
                    className="w-20 rounded-full border border-white/12 bg-[var(--bg)] px-3 py-1.5 text-right outline-none focus:border-[color:var(--accent)]/40"
                  />
                  <span className="text-white/45">zł</span>
                </label>
                <div>
                  <span className="text-white/45">Zwrot: </span>
                  <span className="font-semibold text-emerald-300">{potentialReturn.toFixed(2)} zł</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCoupon([])}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-4 py-2 font-medium text-white/80 transition hover:bg-white/15"
                >
                  <Trash2 className="h-4 w-4" />
                  Wyczyść
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
