"use client"

import { useEffect, useMemo, useState } from "react"
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { TimelinePoint } from "@/lib/stats-types"
import { useInViewOnce } from "@/hooks/use-scroll-animation"
import { RangePills, type RangeOption } from "../ui/range-pills"

type Range = "7" | "30" | "90" | "all"

const RANGE_OPTIONS: readonly RangeOption<Range>[] = [
  { key: "7", label: "7D" },
  { key: "30", label: "30D" },
  { key: "90", label: "90D" },
  { key: "all", label: "Wszystko" },
]

const RANGE_DAYS: Record<Range, number | null> = { "7": 7, "30": 30, "90": 90, all: null }

function fmtDay(val: string): string {
  const d = new Date(val)
  return Number.isNaN(d.getTime()) ? val : d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" })
}

type Point = { date: string; wr: number; tips: number }

function EndDot(props: { cx?: number; cy?: number; index?: number; lastIndex: number }) {
  const { cx, cy, index, lastIndex } = props
  if (cx == null || cy == null || index !== lastIndex) return null
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill="var(--cyan)" className="chart-pulse-dot" />
      <circle cx={cx} cy={cy} r={3.5} fill="var(--cyan)" stroke="var(--bg-0)" strokeWidth={1.5} />
    </g>
  )
}

/**
 * „Forma modelu" — skuteczność w czasie, styl Robinhood: cienka linia bez
 * siatki/ramek osi, wartość + data nad wykresem (nie w dymku), crosshair na
 * hover, pulsująca kropka na ostatnim punkcie, rozmyta poświata w tle,
 * pills zakresu pod wykresem (7D/30D/90D/Wszystko — czysto klienckie
 * cięcie tej samej tablicy `timeline`, bez dodatkowego fetcha).
 */
export function ModelFormChart({ timeline }: { timeline: TimelinePoint[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const [inViewRef, inView] = useInViewOnce<HTMLDivElement>()
  const [range, setRange] = useState<Range>("30")
  const [hover, setHover] = useState<Point | null>(null)

  const full = useMemo<Point[]>(
    () =>
      timeline.map((p) => ({
        date: p.date,
        wr: p.win_rate <= 1 ? p.win_rate * 100 : p.win_rate,
        tips: p.tips,
      })),
    [timeline],
  )

  const data = useMemo(() => {
    const days = RANGE_DAYS[range]
    return days == null ? full : full.slice(-days)
  }, [full, range])

  if (full.length === 0) {
    return (
      <div className="grid h-64 place-items-center rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-1)] text-sm text-[color:var(--text-muted)]">
        Brak danych historycznych
      </div>
    )
  }

  if (!mounted) {
    return <div className="shimmer h-72 rounded-xl border border-[color:var(--border-subtle)]" />
  }
  if (!inView) {
    return <div ref={inViewRef} className="h-72 rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-1)]" />
  }

  const values = data.map((d) => d.wr)
  const lo = Math.max(0, Math.floor(Math.min(...values) / 10) * 10 - 5)
  const hi = Math.min(100, Math.ceil(Math.max(...values) / 10) * 10 + 5)
  const lastIndex = data.length - 1
  const display = hover ?? data[lastIndex]

  return (
    <div className="glass-solid relative overflow-hidden rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-1)] p-4 md:p-5">
      <div className="chart-glow-blob left-1/4 top-1/3 h-40 w-2/3" />

      {/* wartość + data nad wykresem, nie w dymku — aktualizowane na hover */}
      <div className="relative mb-1">
        <p className="text-2xl font-bold tabular-nums text-[color:var(--cyan)]">{display.wr.toFixed(1)}%</p>
        <p className="text-xs text-[color:var(--text-muted)]">{hover ? fmtDay(hover.date) : "dziś · skuteczność"}</p>
      </div>

      <div className="relative h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
            onMouseMove={(e) => {
              // activeTooltipIndex bywa stringiem ("4"), nie liczbą — Number()
              // zamiast typeof === "number", które zawsze zwracało false
              const idx = e?.activeTooltipIndex != null ? Number(e.activeTooltipIndex) : NaN
              if (!Number.isNaN(idx) && data[idx]) setHover(data[idx])
            }}
            onMouseLeave={() => setHover(null)}
          >
            <defs>
              {/* wypełnienie ledwo zauważalne (max 8%) — sama linia niesie czytelność */}
              <linearGradient id="lb-form-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--cyan)" stopOpacity={0.08} />
                <stop offset="100%" stopColor="var(--cyan)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickFormatter={fmtDay}
              tick={{ fill: "var(--text-muted)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              minTickGap={32}
            />
            <YAxis
              domain={[lo, hi]}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fill: "var(--text-muted)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={34}
              ticks={[lo, Math.round((lo + hi) / 2), hi]}
            />
            <ReferenceLine y={50} stroke="var(--text-muted)" strokeOpacity={0.4} strokeDasharray="3 3" />
            {/* content=null: bez dymka, ale cursor (crosshair) zostaje widoczny */}
            <Tooltip content={() => null} cursor={{ stroke: "var(--cyan)", strokeOpacity: 0.35, strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="wr"
              stroke="var(--cyan)"
              strokeWidth={1.75}
              fill="url(#lb-form-fill)"
              dot={(props: { cx?: number; cy?: number; index?: number }) => (
                <EndDot key={props.index} {...props} lastIndex={lastIndex} />
              )}
              activeDot={{ r: 3.5, fill: "var(--cyan)", stroke: "var(--bg-0)", strokeWidth: 1.5 }}
              isAnimationActive
              animationDuration={900}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <RangePills value={range} options={RANGE_OPTIONS} onChange={setRange} className="relative mt-3 justify-center" />
    </div>
  )
}
