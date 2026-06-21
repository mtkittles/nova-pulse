"use client"

import Link from "next/link"
import { useState } from "react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { BarChart3, Send, TrendingUp } from "lucide-react"
import type { StatsResponse } from "@/lib/stats-types"
import type { Tip } from "@/lib/types"
import { getMarketLabel } from "@/lib/market-label"
import { fmtOdds } from "@/lib/format"
import { settleTip } from "@/lib/tip-utils"
import { CountUp } from "./ui/count-up"
import { Card } from "./ui/card"
import { Skeleton } from "./ui/skeleton"
import { EmptyState } from "./ui/empty-state"
import { StatusPill, type PillStatus } from "./ui/status-pill"
import { TeamBadge } from "./team-badge"

type Period = "7" | "30" | "all"

// Data → "6 cze" (strefa urządzenia). Akceptuje "YYYY-MM-DD" lub pełne ISO.
function fmtDay(val: string): string {
  const d = new Date(val)
  return Number.isNaN(d.getTime())
    ? val
    : d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" })
}

// roi z Oracle to ułamek (0.4263 = 42.63%) — formatujemy ×100 ze znakiem.
function fmtRoi(v: number): string {
  return `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}%`
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: { date: string; roi: number } }[] }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-2)] px-3 py-2 text-xs">
      <p className="text-[color:var(--text-muted)]">{fmtDay(p.date)}</p>
      <p className="font-semibold text-[color:var(--cyan)] tnum">ROI {fmtRoi(p.roi)}</p>
    </div>
  )
}

export function StatsScreen({
  initial,
  recentTips,
}: {
  initial: StatsResponse
  recentTips: Tip[]
}) {
  const [period, setPeriod] = useState<Period>("30")
  const [data, setData] = useState<StatsResponse>(initial)
  const [loading, setLoading] = useState(false)

  async function selectPeriod(p: Period) {
    if (p === period) return
    setPeriod(p)
    setLoading(true)
    try {
      const res = await fetch(`/api/stats?period=${p}`)
      const d = await res.json()
      if (d && d.summary) setData(d)
    } catch {
      /* zostaw poprzednie dane */
    } finally {
      setLoading(false)
    }
  }

  const s = data.summary
  const roiPositive = s.roi >= 0
  // roi to ułamek (0.4263) — surowy; formatowanie ×100 w osi/tooltipie. Sortuj po dacie.
  const chart = [...data.timeline]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => ({ date: t.date, roi: t.roi }))
  const hasData = s.total_tips > 0

  const periodBtn = (p: Period) =>
    `rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
      period === p ? "bg-[var(--cyan-soft)] text-[color:var(--cyan)]" : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
    }`

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* [A] NAGŁÓWEK */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Statystyki modelu</h1>
        <div className="inline-flex rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-1)] p-0.5">
          <button type="button" onClick={() => selectPeriod("7")} className={periodBtn("7")}>7 dni</button>
          <button type="button" onClick={() => selectPeriod("30")} className={periodBtn("30")}>30 dni</button>
          <button type="button" onClick={() => selectPeriod("all")} className={periodBtn("all")}>Wszystkie</button>
        </div>
      </header>

      {!hasData ? (
        <EmptyState icon={BarChart3} title="Brak danych statystycznych" description="Model dopiero zbiera próbę — wróć po kilku rozliczonych typach." />
      ) : (
        <>
          {/* [B] KARTY PODSUMOWANIA */}
          <section className="grid grid-cols-2 gap-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
            ) : (
              <>
                <SummaryCard label="Skuteczność" value={<CountUp to={s.win_rate * 100} decimals={1} suffix="%" />} sub={`${s.wins}/${s.settled_tips}`} />
                <SummaryCard
                  label="ROI"
                  value={
                    <span className={roiPositive ? "text-[color:var(--success)]" : "text-[color:var(--danger)]"}>
                      <CountUp to={s.roi * 100} decimals={1} prefix={roiPositive ? "+" : ""} suffix="%" />
                    </span>
                  }
                  sub="płaska stawka 1u"
                />
                <SummaryCard label="Łączne typy" value={<CountUp to={s.total_tips} />} sub={`${s.settled_tips} rozliczonych`} />
                <SummaryCard label="Średni Q-Score" value={<CountUp to={s.avg_q_score} />} sub="jakość sygnału" />
              </>
            )}
          </section>

          {/* [C] WYKRES ROI W CZASIE */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
              <TrendingUp className="h-4 w-4 text-[color:var(--cyan)]" /> Skumulowany ROI
            </h2>
            <Card hover={false}>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : chart.length === 0 ? (
                <p className="py-12 text-center text-sm text-[color:var(--text-muted)]">Brak punktów w tym zakresie.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chart} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border-soft)" vertical={false} />
                    <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 12 }} minTickGap={24} tickFormatter={fmtDay} />
                    <YAxis
                      stroke="var(--text-muted)"
                      tick={{ fontSize: 12 }}
                      width={48}
                      domain={["dataMin", "dataMax"]}
                      tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="roi" stroke="var(--cyan)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
          </section>

          {/* [D] PODZIAŁ PO RYNKACH */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">Podział po rynkach</h2>
            <Card hover={false}>
              {data.by_market.length === 0 ? (
                <p className="py-6 text-center text-sm text-[color:var(--text-muted)]">Brak danych.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-[color:var(--border-soft)] text-xs uppercase tracking-wide text-[color:var(--text-muted)]">
                    <tr>
                      <th className="px-2 py-2 text-left">Rynek</th>
                      <th className="px-2 py-2 text-center">Typy</th>
                      <th className="px-2 py-2 text-center">Traf.</th>
                      <th className="px-2 py-2 text-center">%</th>
                      <th className="px-2 py-2 text-right">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.by_market.map((m) => {
                      const wins = Math.round(m.win_rate * m.tips)
                      return (
                        <tr key={m.label} className="border-b border-[color:var(--border-soft)] last:border-0">
                          <td className="px-2 py-2 font-medium">{m.label}</td>
                          <td className="px-2 py-2 text-center tnum text-[color:var(--text-secondary)]">{m.tips}</td>
                          <td className="px-2 py-2 text-center tnum text-[color:var(--text-secondary)]">{wins}</td>
                          <td className="px-2 py-2 text-center font-semibold tnum">{Math.round(m.win_rate * 100)}%</td>
                          <td className={`px-2 py-2 text-right font-semibold tnum ${m.roi >= 0 ? "text-[color:var(--success)]" : "text-[color:var(--danger)]"}`}>
                            {m.roi >= 0 ? "+" : ""}{(m.roi * 100).toFixed(1)}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </Card>
          </section>

          {/* [E] OSTATNIE TYPY */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">Ostatnie rozliczone typy</h2>
            {recentTips.length === 0 ? (
              <EmptyState icon={BarChart3} title="Brak rozliczonych typów" description="Pojawią się tu po zakończeniu meczów." />
            ) : (
              <div className="space-y-2">
                {recentTips.slice(0, 15).map((t, i) => {
                  const settled = settleTip(t, t.home_score ?? null, t.away_score ?? null)
                  const pill: PillStatus = settled === "won" ? "WON" : settled === "lost" ? "LOST" : settled === "void" ? "VOID" : "PENDING"
                  const market = getMarketLabel(t.bet_type_raw ?? t.bet_type, t.bet_side_raw ?? t.bet_side, t.home, t.away)
                  const href = t.event_id != null && t.event_id !== "" ? `/mecz/${t.event_id}` : null
                  const cls = `flex items-center gap-3 rounded-[var(--radius-card)] border border-[color:var(--border-soft)] bg-[var(--surface-1)] p-3 ${href ? "cursor-pointer transition hover:bg-[var(--surface-2)]" : "cursor-default"}`
                  const inner = (
                    <>
                      <div className="flex shrink-0 items-center gap-1">
                        <TeamBadge teamName={t.home} logoUrl={t.homeLogo} size="sm" />
                        <TeamBadge teamName={t.away} logoUrl={t.awayLogo} size="sm" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.home} – {t.away}</p>
                        <p className="mt-0.5"><span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold ${market.badge}`}>{market.short}</span></p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-[color:var(--cyan)] tnum">{fmtOdds(t.odds)}</span>
                      <StatusPill status={pill} />
                    </>
                  )
                  return href ? (
                    <Link key={`${String(t.event_id)}-${i}`} href={href} className={cls}>{inner}</Link>
                  ) : (
                    <div key={`${String(t.event_id)}-${i}`} className={cls}>{inner}</div>
                  )
                })}
              </div>
            )}
          </section>

          {/* TELEGRAM — panel użytkownika */}
          <section>
            <Card hover={false} className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <Send className="h-5 w-5 text-[color:var(--cyan)]" /> Lupus Bot na Telegramie
                </h3>
                <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Otrzymuj typy jako pierwszy — prosto na czacie.</p>
              </div>
              <Link
                href="https://t.me/lupus_bet_bot"
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--cyan)] px-5 py-2.5 text-sm font-semibold text-[color:var(--bg-0)] transition hover:bg-[var(--cyan-strong)]"
              >
                <Send className="h-4 w-4" /> Otwórz bota
              </Link>
            </Card>
          </section>
        </>
      )}
    </div>
  )
}

function SummaryCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <Card hover={false} className="text-center">
      <p className="text-xs uppercase tracking-wide text-[color:var(--text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold tnum">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-[color:var(--text-muted)]">{sub}</p>}
    </Card>
  )
}
