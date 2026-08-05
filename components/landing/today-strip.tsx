"use client"

import type { Tip } from "@/lib/types"
import { CountUp } from "../ui/count-up"

// Średnia z pominięciem null — brak danych NIE liczy się jako 0.
function avg(values: (number | null | undefined)[]): number | null {
  const nums = values.filter((v): v is number => v != null && Number.isFinite(v))
  if (nums.length === 0) return null
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

/**
 * „Dziś w skrócie" — cztery liczby z count-upem przy wejściu w viewport.
 * Wszystko liczone z typów dnia, więc pasek zawsze zgadza się z kartami niżej.
 */
export function TodayStrip({ tips }: { tips: Tip[] }) {
  const avgQ = avg(tips.map((t) => t.q_score))
  const avgOdds = avg(tips.map((t) => t.odds))
  const leagues = new Set(tips.map((t) => t.leagueCode || t.league).filter(Boolean)).size

  const items: { label: string; node: React.ReactNode; accent?: boolean }[] = [
    { label: "Typów dziś", node: <CountUp to={tips.length} className="tnum" />, accent: true },
    {
      label: "Średni Q-Score",
      node: avgQ == null ? "—" : <CountUp to={avgQ} decimals={1} className="tnum" />,
    },
    {
      label: "Średni kurs",
      node: avgOdds == null ? "—" : <CountUp to={avgOdds} decimals={2} className="tnum" />,
    },
    { label: "Aktywnych lig", node: <CountUp to={leagues} className="tnum" /> },
  ]

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--border-subtle)] md:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="bg-[var(--bg-1)] px-4 py-4 md:px-5 md:py-5">
          <p
            className={`text-2xl font-semibold tracking-tight md:text-3xl ${
              it.accent ? "text-[color:var(--cyan)]" : "text-[color:var(--text-primary)]"
            }`}
          >
            {it.node}
          </p>
          <p className="mt-1 text-xs text-[color:var(--text-secondary)] md:text-sm">{it.label}</p>
        </div>
      ))}
    </div>
  )
}
