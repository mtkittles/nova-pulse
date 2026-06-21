"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { motion } from "framer-motion"
import {
  Bar,
  BarChart,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { ScoreDist, TeamMetrics } from "@/lib/extra-types"

const HOME = "#67e8f9" // cyan
const AWAY = "#c4b5fd" // violet
const GRID = "rgba(255,255,255,0.12)"
const AXIS = "rgba(255,255,255,0.55)"
const tooltipStyle = {
  background: "#10111d",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "0.75rem",
  color: "#fff",
} as const

const clamp = (n: number) => Math.max(0, Math.min(100, n))

// Renderuje dzieci dopiero, gdy sekcja wejdzie w widok (lazy wykresy).
export function LazyMount({ children, height = 320 }: { children: ReactNode; height?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShow(true)
          io.disconnect()
        }
      },
      { rootMargin: "120px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref}>
      {show ? children : <div className="animate-pulse rounded-2xl bg-white/[0.05]" style={{ height }} />}
    </div>
  )
}

export function RadarCompare({ home, away }: { home: TeamMetrics; away: TeamMetrics }) {
  const data = [
    { k: "Atak", h: clamp((home.gf_avg / 3) * 100), a: clamp((away.gf_avg / 3) * 100) },
    { k: "Obrona", h: clamp(100 - (home.ga_avg / 3) * 100), a: clamp(100 - (away.ga_avg / 3) * 100) },
    { k: "BTTS", h: clamp(home.btts_pct), a: clamp(away.btts_pct) },
    { k: "O1.5", h: clamp(home.over15_pct), a: clamp(away.over15_pct) },
    { k: "Czyste konta", h: clamp(home.clean_sheets_pct), a: clamp(away.clean_sheets_pct) },
    { k: "Forma", h: clamp(home.form_points), a: clamp(away.form_points) },
  ]
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke={GRID} />
          <PolarAngleAxis dataKey="k" tick={{ fontSize: 12, fill: AXIS }} />
          <Radar name={home.name} dataKey="h" stroke={HOME} fill={HOME} fillOpacity={0.25} isAnimationActive animationDuration={800} />
          <Radar name={away.name} dataKey="a" stroke={AWAY} fill={AWAY} fillOpacity={0.25} isAnimationActive animationDuration={800} />
          <Tooltip contentStyle={tooltipStyle} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function H2HBars({ home, away }: { home: TeamMetrics; away: TeamMetrics }) {
  const data = [
    { cat: "Śr. gole zdob.", home: home.gf_avg, away: away.gf_avg },
    { cat: "Śr. gole strac.", home: home.ga_avg, away: away.ga_avg },
    { cat: "% BTTS", home: home.btts_pct, away: away.btts_pct },
    { cat: "% O1.5", home: home.over15_pct, away: away.over15_pct },
  ]
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 24, right: 16, top: 8, bottom: 8 }}>
          <XAxis type="number" stroke={AXIS} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="cat" stroke={AXIS} tick={{ fontSize: 12 }} width={110} />
          <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={tooltipStyle} />
          <Bar dataKey="home" name={home.name} fill={HOME} radius={[0, 6, 6, 0]} />
          <Bar dataKey="away" name={away.name} fill={AWAY} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Heatmapa wyników (Dixon-Coles) — siatka home×away, intensywność = P(i:j).
export function ScoreHeatmap({
  matrix,
  home,
  away,
  highlightThriller = false,
}: {
  matrix: number[][]
  home: string
  away: string
  highlightThriller?: boolean
}) {
  const size = matrix.length
  let max = 0
  let argI = 0
  let argJ = 0
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      if (matrix[i][j] > max) {
        max = matrix[i][j]
        argI = i
        argJ = j
      }
    }
  }
  const isThr = (i: number, j: number) => (i === 3 && j === 2) || (i === 2 && j === 3)

  return (
    <div className="w-full overflow-x-auto">
      <div className="mx-auto min-w-[20rem] max-w-md">
        {/* etykieta away u góry */}
        <p className="mb-1 text-center text-[11px] uppercase tracking-wider text-white/55">
          {away} — gole →
        </p>
        <div className="flex gap-2">
          {/* etykieta home z boku */}
          <div className="flex w-4 items-center justify-center">
            <span className="rotate-180 text-[11px] uppercase tracking-wider text-white/55 [writing-mode:vertical-rl]">
              {home} — gole →
            </span>
          </div>
          <div className="flex-1">
            {/* nagłówek kolumn 0..size-1 */}
            <div className="mb-1 grid" style={{ gridTemplateColumns: `1.4rem repeat(${size}, 1fr)` }}>
              <span />
              {Array.from({ length: size }).map((_, j) => (
                <span key={j} className="text-center text-[11px] font-medium text-white/55">
                  {j}
                </span>
              ))}
            </div>
            {matrix.map((row, i) => (
              <div
                key={i}
                className="mb-1 grid items-center gap-1"
                style={{ gridTemplateColumns: `1.4rem repeat(${size}, 1fr)` }}
              >
                <span className="text-center text-[11px] font-medium text-white/55">{i}</span>
                {row.map((v, j) => {
                  const a = max > 0 ? v / max : 0
                  const top = i === argI && j === argJ
                  const thr = highlightThriller && isThr(i, j)
                  const pctTxt = v * 100
                  return (
                    <motion.div
                      key={j}
                      initial={{ opacity: 0, scale: 0.85 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.25, delay: (i * size + j) * 0.012 }}
                      title={`${home} ${i}:${j} ${away} — ${pctTxt.toFixed(1)}%`}
                      className={`relative grid aspect-square place-items-center rounded-md text-[11px] font-semibold ${
                        top
                          ? "ring-2 ring-[color:var(--accent)]"
                          : thr
                            ? "ring-2 ring-amber-300"
                            : ""
                      }`}
                      style={{
                        background: `rgba(103, 232, 249, ${(0.06 + a * 0.9).toFixed(3)})`,
                        color: a > 0.5 ? "#06121a" : "rgba(255,255,255,0.85)",
                      }}
                    >
                      {pctTxt >= 0.5 ? Math.round(pctTxt) : "·"}
                    </motion.div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-[11px] text-white/60">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded ring-2 ring-[color:var(--accent)]" /> najbardziej prawdopodobny
          </span>
          {highlightThriller && (
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded ring-2 ring-amber-300" /> Thriller 3:2 / 2:3
            </span>
          )}
        </div>

        {/* legenda intensywności + opis */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] text-white/55">
            <span>niskie</span>
            <span
              className="h-2 flex-1 rounded-full"
              style={{ background: "linear-gradient(90deg, rgba(103,232,249,0.06), rgba(103,232,249,0.96))" }}
            />
            <span>wysokie</span>
          </div>
          <p className="text-center text-[11px] text-white/55">Im jaśniejsze pole, tym większe prawdopodobieństwo wyniku.</p>
          <p className="text-center text-[11px] text-white/55">Obramowanie = wynik powiązany z wybranym rynkiem.</p>
        </div>
      </div>
    </div>
  )
}

// Pasek wyników H2H: zwycięstwa gospodarza / remisy / zwycięstwa gościa.
export function H2HOutcomeBar({
  homeWins,
  draws,
  awayWins,
  home,
  away,
}: {
  homeWins: number
  draws: number
  awayWins: number
  home: string
  away: string
}) {
  const total = Math.max(1, homeWins + draws + awayWins)
  const seg = [
    { v: homeWins, color: HOME, label: `${home}: ${homeWins}` },
    { v: draws, color: "rgba(255,255,255,0.25)", label: `Remisy: ${draws}` },
    { v: awayWins, color: AWAY, label: `${away}: ${awayWins}` },
  ]
  return (
    <div>
      <div className="flex h-4 overflow-hidden rounded-full bg-white/5">
        {seg.map((s, i) => (
          <motion.div
            key={i}
            initial={{ width: 0 }}
            whileInView={{ width: `${(s.v / total) * 100}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            style={{ background: s.color }}
            title={s.label}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-white/65">
        {seg.map((s, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function ScoreDistribution({
  data,
  highlightThriller,
}: {
  data: ScoreDist[]
  highlightThriller: boolean
}) {
  const isThr = (s: string) => s === "3:2" || s === "2:3"
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <XAxis dataKey="score" stroke={AXIS} tick={{ fontSize: 11 }} interval={0} />
          <YAxis stroke={AXIS} tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={tooltipStyle} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.score} fill={highlightThriller && isThr(d.score) ? "#fbbf24" : HOME} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
