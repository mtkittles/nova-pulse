"use client"

import { useEffect, useState } from "react"
import {
  Brush,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { TimelinePoint } from "@/lib/stats-types"

const tooltipStyle = {
  background: "#10111d",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "0.75rem",
  color: "#fff",
} as const

function shortDate(d: string): string {
  const [, m, day] = d.split("-")
  return `${day}.${m}`
}

// Wykres skuteczności w czasie — touch-friendly (tooltip na dotyk, Brush do przesuwania).
export function PerfChart({ data }: { data: TimelinePoint[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const points = data.map((p) => ({ date: shortDate(p.date), wr: +(p.win_rate * 100).toFixed(1) }))

  return (
    <div className="rounded-[1.8rem] border border-white/12 bg-white/[0.055] p-6 shadow-2xl shadow-black/20 backdrop-blur">
      <h2 className="text-lg font-semibold">Skuteczność modelu w czasie</h2>
      <p className="mt-1 text-sm text-white/60">
        {points.length > 3 ? "Przeciągnij dolny pasek, aby przesuwać oś czasu" : "Skumulowana trafialność"}
      </p>
      <div className="mt-5 h-72 w-full">
        {points.length === 0 ? (
          <div className="grid h-full place-items-center text-sm text-white/55">
            Wykres pojawi się po pierwszych rozliczonych meczach.
          </div>
        ) : mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.45)" tick={{ fontSize: 12 }} minTickGap={24} />
              <YAxis
                stroke="rgba(255,255,255,0.45)"
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 100]}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`${v}%`, "Trafialność"]} />
              <Line
                type="monotone"
                dataKey="wr"
                stroke="#67e8f9"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 7 }}
                isAnimationActive
                animationDuration={900}
              />
              {points.length > 3 && (
                <Brush
                  dataKey="date"
                  height={26}
                  travellerWidth={14}
                  stroke="#67e8f9"
                  fill="rgba(255,255,255,0.04)"
                  tickFormatter={() => ""}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full animate-pulse rounded-2xl bg-white/[0.04]" />
        )}
      </div>
    </div>
  )
}
