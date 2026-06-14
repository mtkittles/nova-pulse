"use client"

import { useMemo } from "react"
import type { CalendarDay } from "@/lib/extra-types"

// Buduje datę YYYY-MM-DD w strefie urządzenia, przesuniętą o `offset` dni od dziś.
function localYmd(offset: number): string {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)
}

function weekdayShort(ymd: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "short",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
    .format(new Date(`${ymd}T12:00:00Z`))
    .replace(".", "")
}

function dayNum(ymd: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(new Date(`${ymd}T12:00:00Z`))
}

// Pasek 7 dni od dziś: "Dziś", "Jutro", potem dzień tygodnia + numer.
export function DateStrip({
  value,
  calendar,
  onSelect,
}: {
  value: string
  calendar: CalendarDay[]
  onSelect: (date: string) => void
}) {
  const calMap = useMemo(() => new Map(calendar.map((d) => [d.date, d])), [calendar])

  const items = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = localYmd(i)
      const label = i === 0 ? "Dziś" : i === 1 ? "Jutro" : weekdayShort(date)
      return { date, label, sub: i < 2 ? dayNum(date) : null, num: dayNum(date) }
    })
  }, [])

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {items.map((it) => {
        const selected = it.date === value
        const day = calMap.get(it.date)
        const count = day ? day.tips : 0
        return (
          <button
            key={it.date}
            type="button"
            onClick={() => onSelect(it.date)}
            aria-pressed={selected}
            className={`relative flex min-w-[68px] shrink-0 flex-col items-center gap-0.5 rounded-[var(--radius-card)] border px-3 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cyan)] ${
              selected
                ? "border-[color:var(--cyan)] bg-[var(--cyan-soft)] text-[color:var(--text-primary)]"
                : "border-[color:var(--border-soft)] bg-[var(--surface-1)] text-[color:var(--text-secondary)] hover:border-[color:var(--border-strong)] hover:text-[color:var(--text-primary)]"
            }`}
          >
            <span className={`text-xs font-semibold capitalize ${selected ? "text-[color:var(--cyan)]" : ""}`}>
              {it.label}
            </span>
            <span className="text-base font-bold leading-none tnum">{it.num}</span>
            {count > 0 ? (
              <span
                className={`mt-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none ${
                  selected
                    ? "bg-[var(--cyan)] text-[color:var(--bg-0)]"
                    : "bg-[var(--surface-3)] text-[color:var(--text-secondary)]"
                }`}
              >
                {count}
              </span>
            ) : (
              <span className="mt-0.5 h-4" aria-hidden />
            )}
          </button>
        )
      })}
    </div>
  )
}
