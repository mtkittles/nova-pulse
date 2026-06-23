"use client"

import { useEffect, useState } from "react"
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { StatsResponse } from "@/lib/stats-types"

const COLORS = {
  cyan: "#5eead4",
  violet: "#a78bfa",
  blue: "#60a5fa",
  emerald: "#34d399",
  amber: "#fbbf24",
  rose: "#fb7185",
  grid: "rgba(255,255,255,0.06)",
  axis: "rgba(248,250,252,0.52)",
}

const MARKET_COLOR: Record<string, string> = {
  BTTS: COLORS.cyan,
  "Team O1.5": COLORS.violet,
  Over: COLORS.amber,
  "1X2": COLORS.emerald,
  Handicap: COLORS.rose,
}

const tooltipStyle = {
  background: "var(--tooltip-bg)",
  border: "1px solid rgba(15,23,42,0.08)",
  borderRadius: "0.9rem",
  boxShadow: "0 24px 60px rgba(0,0,0,0.34)",
  color: "var(--tooltip-text)",
} as const

const tooltipLabelStyle = { color: "var(--tooltip-muted)", fontWeight: 700 } as const
const tooltipItemStyle = { color: "var(--tooltip-text)", fontWeight: 600 } as const

function pct(v: number, digits = 0): string {
  return `${(v * 100).toFixed(digits)}%`
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="signal-card rounded-[1.55rem] p-5 sm:p-6">
      <h3 className="text-lg font-semibold">{title}</h3>
      {subtitle && <p className="signal-muted mt-1 text-sm">{subtitle}</p>}
      <div className="mt-5 h-72 w-full">{children}</div>
    </div>
  )
}

function shortDate(d: string): string {
  const [, m, day] = d.split("-")
  return `${day}.${m}`
}

export default function StatsCharts({ data }: { data: StatsResponse }) {
  // Recharts (ResponsiveContainer) mierzy rozmiar dopiero w DOM — renderujemy
  // wykresy po zamontowaniu, żeby uniknąć ostrzeżeń SSR i rozjazdu hydratacji.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-[22rem] animate-pulse rounded-[1.8rem] border border-white/12 bg-white/[0.04] ${
              i === 0 ? "lg:col-span-2" : ""
            }`}
          />
        ))}
      </div>
    )
  }

  const timeline = data.timeline.map((p) => ({
    date: shortDate(p.date),
    wr: +(p.win_rate * 100).toFixed(1),
    roi: +(p.roi * 100).toFixed(1),
  }))

  const markets = data.by_market.map((m) => ({
    name: m.market,
    key: m.market,
    wr: +(m.win_rate * 100).toFixed(1),
    roi: m.roi != null ? +(m.roi * 100).toFixed(1) : null,
    tips: m.tips,
  }))

  const leagues = [...data.by_league]
    .sort((a, b) => b.win_rate - a.win_rate)
    .map((l) => ({ name: l.league, wr: +(l.win_rate * 100).toFixed(1), tips: l.tips }))

  const buckets = data.q_score_buckets.map((b) => ({
    name: b.bucket,
    wr: +(b.win_rate * 100).toFixed(1),
    tips: b.tips,
  }))

  const winLoss = [
    { name: "Trafione", value: data.summary.wins, color: COLORS.emerald },
    { name: "Pudła", value: data.summary.losses, color: COLORS.rose },
  ]

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <ChartCard
          title="Skuteczność i ROI w czasie"
          subtitle={`Skumulowane, ostatnie ${data.range_days} dni`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="roiFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.cyan} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={COLORS.cyan} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={COLORS.grid} vertical={false} />
              <XAxis dataKey="date" stroke={COLORS.axis} tick={{ fontSize: 12 }} minTickGap={24} />
              <YAxis
                yAxisId="left"
                stroke={COLORS.axis}
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `${v}%`}
                domain={[40, 80]}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke={COLORS.axis}
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
                formatter={(value: unknown, name: unknown) => [
                  `${value}%`,
                  name === "wr" ? "Trafialność" : "ROI",
                ]}
              />
              <Legend
                formatter={(value) => (value === "wr" ? "Trafialność" : "ROI")}
                wrapperStyle={{ fontSize: 13 }}
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="roi"
                stroke={COLORS.cyan}
                strokeWidth={2}
                fill="url(#roiFill)"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="wr"
                stroke={COLORS.violet}
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Trafialność per rynek" subtitle="BTTS · Over · Team O1.5 · 1X2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={markets} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid stroke={COLORS.grid} vertical={false} />
            <XAxis dataKey="name" stroke={COLORS.axis} tick={{ fontSize: 12 }} />
            <YAxis
              stroke={COLORS.axis}
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              contentStyle={tooltipStyle}
              labelStyle={tooltipLabelStyle}
              itemStyle={tooltipItemStyle}
              formatter={(value: unknown, _n: unknown, item: unknown) => {
                const p = (item as { payload?: { tips?: number; roi?: number | null } })?.payload
                const roiStr = p?.roi != null ? ` | ROI ${p.roi >= 0 ? "+" : ""}${p.roi}%` : " | ROI —"
                return [`${value}% (${p?.tips} typów${roiStr})`, "Trafialność"]
              }}
            />
            <Bar dataKey="wr" radius={[8, 8, 0, 0]}>
              {markets.map((m) => (
                <Cell key={m.key} fill={MARKET_COLOR[m.key] ?? COLORS.cyan} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Bilans typów" subtitle={`${data.summary.settled_tips} rozliczonych`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={winLoss}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={3}
              stroke="none"
            >
              {winLoss.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Trafialność per liga" subtitle="Posortowane malejąco">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={leagues}
            layout="vertical"
            margin={{ top: 0, right: 16, left: 10, bottom: 0 }}
          >
            <CartesianGrid stroke={COLORS.grid} horizontal={false} />
            <XAxis
              type="number"
              stroke={COLORS.axis}
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke={COLORS.axis}
              tick={{ fontSize: 12 }}
              width={96}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              contentStyle={tooltipStyle}
              labelStyle={tooltipLabelStyle}
              itemStyle={tooltipItemStyle}
              formatter={(value: unknown, _n: unknown, item: unknown) => [
                `${value}% (${(item as { payload?: { tips?: number } })?.payload?.tips} typów)`,
                "Trafialność",
              ]}
            />
            <Bar dataKey="wr" fill={COLORS.cyan} radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Kalibracja Q-Score"
        subtitle="Wyższy Q-Score → wyższa trafialność"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={buckets} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid stroke={COLORS.grid} vertical={false} />
            <XAxis dataKey="name" stroke={COLORS.axis} tick={{ fontSize: 12 }} />
            <YAxis
              stroke={COLORS.axis}
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              contentStyle={tooltipStyle}
              labelStyle={tooltipLabelStyle}
              itemStyle={tooltipItemStyle}
              formatter={(value: unknown, _n: unknown, item: unknown) => [
                `${value}% (${(item as { payload?: { tips?: number } })?.payload?.tips} typów)`,
                "Trafialność",
              ]}
            />
            <Bar dataKey="wr" radius={[8, 8, 0, 0]}>
              {buckets.map((b, i) => (
                <Cell
                  key={b.name}
                  fill={i >= 3 ? COLORS.emerald : i >= 1 ? COLORS.amber : COLORS.rose}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
