"use client"

import { useEffect, useMemo, useState } from "react"
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { Tip } from "@/lib/types"
import { useInViewOnce } from "@/hooks/use-scroll-animation"

const BIN = 5
const MIN = 50
const MAX = 100

function QTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: { label: string; count: number } }[]
}) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[var(--bg-1)] px-3 py-2 text-xs">
      <p className="font-medium text-[color:var(--text-primary)]">Q {p.label}</p>
      <p className="mt-1 tnum text-[color:var(--text-secondary)]">
        {p.count} {p.count === 1 ? "typ" : p.count < 5 ? "typy" : "typów"}
      </p>
    </div>
  )
}

/**
 * „Rozkład Q-Score" — histogram ocen dzisiejszych typów.
 *
 * Sens tej sekcji: pokazać, że model RÓŻNICUJE. Płaski rozkład w kilku koszykach
 * jest dowodem; jeden słupek oznaczałby sztywną wartość.
 * Kolor słupka skaluje się z jakością (ta sama skala co pierścienie Q na kartach).
 */
export function QDistribution({ tips }: { tips: Tip[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const [inViewRef, inView] = useInViewOnce<HTMLDivElement>()

  const { data, spread, maxCount } = useMemo(() => {
    const bins = new Map<number, number>()
    for (let b = MIN; b < MAX; b += BIN) bins.set(b, 0)

    let counted = 0
    for (const t of tips) {
      if (t.q_score == null) continue
      const clamped = Math.min(MAX - 1, Math.max(MIN, t.q_score))
      const b = Math.floor((clamped - MIN) / BIN) * BIN + MIN
      bins.set(b, (bins.get(b) ?? 0) + 1)
      counted++
    }

    const rows = [...bins.entries()].map(([b, count]) => ({
      label: `${b}–${b + BIN}`,
      mid: b + BIN / 2,
      count,
    }))
    // ile koszyków faktycznie ma zawartość — to jest „dowód różnicowania"
    const maxCount = Math.max(1, ...rows.map((r) => r.count))
    return { data: rows, spread: rows.filter((r) => r.count > 0).length, total: counted, maxCount }
  }, [tips])

  if (data.every((d) => d.count === 0)) {
    return (
      <div className="grid h-56 place-items-center rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-1)] text-sm text-[color:var(--text-muted)]">
        Brak ocen Q-Score
      </div>
    )
  }

  if (!mounted) {
    return <div className="shimmer h-56 rounded-xl border border-[color:var(--border-subtle)]" />
  }
  if (!inView) {
    return <div ref={inViewRef} className="h-56 rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-1)]" />
  }

  return (
    <div className="rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-1)] p-4 md:p-5">
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--text-muted)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval={0}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={34}
            />
            <Tooltip content={<QTooltip />} cursor={{ fill: "var(--cyan-soft)" }} />
            {/* jeden akcent (cyan) na wszystkich słupkach — gradacja przez opacity
                zależną od wysokości, nie przez zmianę barwy (żółty/zielony/czerwony) */}
            <Bar dataKey="count" radius={[3, 3, 0, 0]} isAnimationActive animationDuration={700} animationEasing="ease-out">
              {data.map((d) => (
                <Cell key={d.label} fill="var(--cyan)" fillOpacity={0.4 + 0.6 * (d.count / maxCount)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-[color:var(--text-muted)]">
        Oceny rozkładają się na <span className="tnum text-[color:var(--text-secondary)]">{spread}</span>{" "}
        przedziałach — model różnicuje typy, nie przypisuje stałej wartości.
      </p>
    </div>
  )
}
