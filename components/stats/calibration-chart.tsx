"use client"

import { useEffect, useState } from "react"
import { ComposedChart, Line, ReferenceLine, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from "recharts"
import type { CalibrationPoint } from "@/lib/demo-tips"
import { useInViewOnce } from "@/hooks/use-scroll-animation"

const DOMAIN: [number, number] = [28, 82]

// Promień kropki = wiarygodność koszyka (więcej typów → większa, bardziej
// pewna próbka). Skala pierwiastkowa, nie liniowa — różnica 20 vs 40 typów
// ma być widoczna, ale 20 vs 200 nie ma rozjechać layoutu.
function dotRadius(n: number, maxN: number): number {
  if (maxN <= 0) return 5
  return 5 + 11 * Math.sqrt(n / maxN)
}

function CalibrationDot(props: { cx?: number; cy?: number; payload?: CalibrationPoint; maxN: number }) {
  const { cx, cy, payload, maxN } = props
  if (cx == null || cy == null || !payload) return null
  return <circle cx={cx} cy={cy} r={dotRadius(payload.n, maxN)} fill="var(--cyan)" fillOpacity={0.85} stroke="var(--bg-1)" strokeWidth={2} />
}

function CalibrationTooltip({ active, payload }: { active?: boolean; payload?: { payload: CalibrationPoint }[] }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[var(--bg-1)] px-3 py-2 text-xs">
      <p className="font-medium text-[color:var(--text-primary)]">
        {Math.round(p.actualPct)}% trafień przy deklarowanym {Math.round(p.declaredPct)}%
      </p>
      <p className="mt-0.5 tnum text-[color:var(--text-muted)]">n={p.n}</p>
    </div>
  )
}

/**
 * Wykres kalibracji — koszyk deklarowanej pewności (X) vs realna trafialność
 * (Y). Przerywana przekątna = idealna kalibracja (punkt na niej = model mówi
 * prawdę). Rozmiar kropki = wielkość próby w koszyku.
 */
export function CalibrationChart({ points }: { points: CalibrationPoint[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const [inViewRef, inView] = useInViewOnce<HTMLDivElement>()

  const withData = points.filter((p) => p.n > 0)
  if (withData.length === 0) {
    return (
      <div className="grid h-72 place-items-center rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-1)] text-sm text-[color:var(--text-muted)]">
        Brak danych do kalibracji
      </div>
    )
  }

  if (!mounted) {
    return <div className="shimmer h-72 rounded-xl border border-[color:var(--border-subtle)]" />
  }
  // Czekamy na viewport, zanim w ogóle wyrenderujemy Line/Scatter — pierwszy
  // render ma być tą animacją (recharts nie "przerysowuje" po zmianie samej
  // flagi na już zamontowanym elemencie, dane się nie zmieniają).
  if (!inView) {
    return <div ref={inViewRef} className="h-72 rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-1)]" />
  }

  const maxN = Math.max(...points.map((p) => p.n))
  const data = points.map((p) => ({ ...p, x: p.declaredPct, y: p.actualPct }))

  return (
    <div className="glass-solid relative overflow-hidden rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-1)] p-4 md:p-5">
      <div className="chart-glow-blob left-1/4 top-1/4 h-40 w-2/3" />
      <div className="relative h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <XAxis
              type="number"
              dataKey="x"
              domain={DOMAIN}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              ticks={[30, 40, 50, 60, 70, 80]}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={DOMAIN}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={42}
              ticks={[30, 40, 50, 60, 70, 80]}
            />
            {/* idealna kalibracja: declared == actual */}
            <ReferenceLine
              segment={[
                { x: DOMAIN[0], y: DOMAIN[0] },
                { x: DOMAIN[1], y: DOMAIN[1] },
              ]}
              stroke="var(--border-subtle)"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              ifOverflow="extendDomain"
            />
            <Tooltip content={<CalibrationTooltip />} cursor={{ stroke: "var(--border-subtle)" }} />
            <Line type="monotone" dataKey="y" stroke="var(--cyan)" strokeWidth={2} dot={false} isAnimationActive animationDuration={900} animationEasing="ease-out" />
            <Scatter
              dataKey="y"
              shape={(p: { cx?: number; cy?: number; payload?: CalibrationPoint }) => <CalibrationDot {...p} maxN={maxN} />}
              isAnimationActive
              animationDuration={900}
              animationEasing="ease-out"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-[color:var(--text-muted)]">
        Model dobrze skalibrowany gdy punkty leżą blisko przerywanej linii.
      </p>
    </div>
  )
}
