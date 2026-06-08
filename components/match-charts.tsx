"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
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
          <Radar name={home.name} dataKey="h" stroke={HOME} fill={HOME} fillOpacity={0.25} />
          <Radar name={away.name} dataKey="a" stroke={AWAY} fill={AWAY} fillOpacity={0.25} />
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
