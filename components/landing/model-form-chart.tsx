"use client"

import { useEffect, useMemo, useState } from "react"
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { TimelinePoint } from "@/lib/stats-types"

function fmtDay(val: string): string {
  const d = new Date(val)
  return Number.isNaN(d.getTime())
    ? val
    : d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" })
}

function FormTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: { date: string; wr: number; tips: number } }[]
}) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-2)] px-3 py-2 text-xs">
      <p className="font-medium text-[color:var(--text-primary)]">{fmtDay(p.date)}</p>
      <p className="mt-1 tnum text-[color:var(--cyan)]">Skuteczność {p.wr.toFixed(1)}%</p>
      <p className="tnum text-[color:var(--text-secondary)]">{p.tips} typów</p>
    </div>
  )
}

/**
 * „Forma modelu" — skuteczność ostatnich 30 dni.
 * Gradient pod linią to jedyne miejsce, gdzie gradient dokłada czytelności:
 * oddziela obszar nad/pod linią progową 50%.
 */
export function ModelFormChart({ timeline }: { timeline: TimelinePoint[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const data = useMemo(
    () =>
      timeline.slice(-30).map((p) => ({
        date: p.date,
        wr: p.win_rate <= 1 ? p.win_rate * 100 : p.win_rate,
        tips: p.tips,
      })),
    [timeline],
  )

  if (data.length === 0) {
    return (
      <div className="grid h-64 place-items-center rounded-[var(--radius-card)] border border-[color:var(--border-soft)] bg-[var(--surface-1)] text-sm text-[color:var(--text-muted)]">
        Brak danych historycznych
      </div>
    )
  }

  // Recharts potrzebuje szerokości kontenera — do momentu montażu pokazujemy
  // shimmer o docelowej wysokości, żeby układ nie skakał.
  if (!mounted) {
    return <div className="shimmer h-64 rounded-[var(--radius-card)] border border-[color:var(--border-soft)]" />
  }

  const values = data.map((d) => d.wr)
  const lo = Math.max(0, Math.floor(Math.min(...values) / 10) * 10 - 5)
  const hi = Math.min(100, Math.ceil(Math.max(...values) / 10) * 10 + 5)

  return (
    <div className="rounded-[var(--radius-card)] border border-[color:var(--border-soft)] bg-[var(--surface-1)] p-4 md:p-5">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {/* left: 0 — ujemny margines przycinał pierwszą cyfrę etykiet osi Y */}
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="lb-form-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--cyan)" stopOpacity={0.32} />
                <stop offset="100%" stopColor="var(--cyan)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border-soft)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={fmtDay}
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />
            <YAxis
              domain={[lo, hi]}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={42}
            />
            <ReferenceLine y={50} stroke="var(--text-muted)" strokeDasharray="3 3" />
            <Tooltip content={<FormTooltip />} cursor={{ stroke: "var(--border-strong)" }} />
            <Area
              type="monotone"
              dataKey="wr"
              stroke="var(--cyan)"
              strokeWidth={2}
              fill="url(#lb-form-fill)"
              dot={false}
              activeDot={{ r: 4, fill: "var(--cyan)", stroke: "var(--bg-0)", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-[color:var(--text-muted)]">
        Linia przerywana = próg 50%. Powyżej niej model bije rzut monetą.
      </p>
    </div>
  )
}
