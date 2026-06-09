"use client"

import { useMemo, useState } from "react"
import type { BetType } from "@/lib/types"
import type { StatsResponse } from "@/lib/stats-types"
import { BET_TYPE_SHORT } from "@/lib/labels"
import { CheckCircle2, Hourglass, Percent, Target, TrendingUp } from "lucide-react"
import StatsCharts from "./stats-charts"
import { AnimatedTabs } from "./ui/tabs"
import { CountUp } from "./ui/count-up"

const PERIODS = [
  { k: "7", l: "7 dni" },
  { k: "30", l: "30 dni" },
  { k: "all", l: "Całość" },
]

const MODES: ("ALL" | BetType)[] = ["ALL", "BTTS", "OVER_1_5", "MIX", "THRILLER"]

function bucketLower(label: string): number {
  const m = label.match(/\d+/)
  return m ? Number(m[0]) : 0
}

export function StatsView({ initial, initialPeriod }: { initial: StatsResponse; initialPeriod: string }) {
  const [period, setPeriod] = useState(initialPeriod)
  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"ALL" | BetType>("ALL")
  const [minQ, setMinQ] = useState(0)
  const [leagues, setLeagues] = useState<Set<string>>(new Set())

  async function pick(p: string) {
    if (p === period) return
    setPeriod(p)
    setLoading(true)
    try {
      const res = await fetch(`/api/stats?period=${p}`)
      const j = await res.json()
      if (j && j.summary) {
        setData(j)
        setLeagues(new Set())
      }
    } catch {
      /* zostaw poprzednie */
    } finally {
      setLoading(false)
    }
  }

  const allLeagues = useMemo(() => data.by_league.map((l) => l.league), [data])

  function toggleLeague(l: string) {
    setLeagues((prev) => {
      const n = new Set(prev)
      if (n.has(l)) n.delete(l)
      else n.add(l)
      return n
    })
  }

  // filtry przeliczają wykresy (by_market wg trybu, by_league wg wyboru, q-score wg progu)
  const filtered = useMemo<StatsResponse>(
    () => ({
      ...data,
      by_market: mode === "ALL" ? data.by_market : data.by_market.filter((m) => m.bet_type === mode),
      by_league:
        leagues.size === 0 ? data.by_league : data.by_league.filter((l) => leagues.has(l.league)),
      q_score_buckets: data.q_score_buckets.filter((b) => bucketLower(b.bucket) >= minQ),
    }),
    [data, mode, leagues, minQ],
  )

  const s = data.summary
  const empty = s.total_tips === 0

  const kpis = [
    { icon: Target, label: "Typy", to: s.total_tips, dec: 0, prefix: "", suffix: "", tone: "text-[color:var(--accent)]" },
    { icon: CheckCircle2, label: "Trafione", to: s.wins, dec: 0, prefix: "", suffix: "", tone: "text-emerald-300" },
    { icon: Percent, label: "Skuteczność", to: s.win_rate * 100, dec: 1, prefix: "", suffix: "%", tone: "text-violet-300" },
    {
      icon: TrendingUp,
      label: "ROI",
      to: s.roi * 100,
      dec: 1,
      prefix: s.roi >= 0 ? "+" : "",
      suffix: "%",
      tone: s.roi >= 0 ? "text-emerald-300" : "text-rose-300",
    },
  ]

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm font-medium transition ${
      active
        ? "border-[color:var(--accent)]/40 bg-[var(--accent)]/15 text-white"
        : "border-white/12 bg-white/[0.05] text-white/55 hover:bg-white/10"
    }`

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <AnimatedTabs
          groupId="stats-period"
          size="sm"
          value={period}
          onChange={pick}
          items={PERIODS.map((p) => ({ key: p.k, label: p.l }))}
        />
      </div>

      <div className={`mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4 ${loading ? "opacity-50" : ""}`}>
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="rounded-[1.6rem] border border-white/12 bg-white/[0.055] p-5 shadow-2xl shadow-black/20 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/[0.08]">
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-white/70">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-sm text-white/60">{kpi.label}</p>
              <CountUp
                to={kpi.to}
                decimals={kpi.dec}
                prefix={kpi.prefix}
                suffix={kpi.suffix}
                className={`mt-1 block text-3xl font-semibold ${kpi.tone}`}
              />
            </div>
          )
        })}
      </div>

      {empty ? (
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
      ) : (
        <>
          {/* filtry */}
          <div className="mb-6 space-y-3 rounded-[1.4rem] border border-white/12 bg-white/[0.04] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm text-white/60">Tryb:</span>
              <AnimatedTabs
                groupId="stats-mode"
                size="sm"
                value={mode}
                onChange={(k) => setMode(k as "ALL" | BetType)}
                items={MODES.map((m) => ({ key: m, label: m === "ALL" ? "Wszystkie" : BET_TYPE_SHORT[m] }))}
              />
              <label className="ml-auto flex items-center gap-2 text-sm text-white/60">
                Min. Q-Score: <span className="font-semibold text-[color:var(--accent)]">{minQ}</span>
                <input type="range" min={0} max={100} step={10} value={minQ} onChange={(e) => setMinQ(Number(e.target.value))} className="accent-[var(--accent)]" />
              </label>
            </div>
            {allLeagues.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-sm text-white/60">Ligi:</span>
                {allLeagues.map((l) => (
                  <button key={l} type="button" onClick={() => toggleLeague(l)} className={chip(leagues.has(l))}>
                    {l}
                  </button>
                ))}
                {leagues.size > 0 && (
                  <button type="button" onClick={() => setLeagues(new Set())} className="text-xs text-white/60 underline hover:text-white">
                    wyczyść
                  </button>
                )}
              </div>
            )}
          </div>

          <div className={loading ? "opacity-50 transition" : "transition"}>
            <StatsCharts data={filtered} />
          </div>
        </>
      )}
    </div>
  )
}
