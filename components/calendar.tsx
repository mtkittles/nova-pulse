"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const MONTHS = [
  "styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec",
  "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień",
]
const DOW = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"]

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

export function Calendar({
  value,
  available,
  onSelect,
}: {
  value: string
  available: string[]
  onSelect: (date: string) => void
}) {
  const init = value ? new Date(`${value}T12:00:00`) : new Date()
  const [view, setView] = useState({ y: init.getFullYear(), m: init.getMonth() })
  const availSet = new Set(available)

  const startDow = (new Date(view.y, view.m, 1).getDay() + 6) % 7 // poniedziałek = 0
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="rounded-[1.6rem] border border-white/12 bg-white/[0.05] p-5 backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          aria-label="Poprzedni miesiąc"
          onClick={() => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }))}
          className="grid h-9 w-9 place-items-center rounded-xl border border-white/12 bg-white/[0.05] hover:bg-white/10"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-semibold capitalize">
          {MONTHS[view.m]} {view.y}
        </span>
        <button
          type="button"
          aria-label="Następny miesiąc"
          onClick={() => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }))}
          className="grid h-9 w-9 place-items-center rounded-xl border border-white/12 bg-white/[0.05] hover:bg-white/10"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs text-white/40">
        {DOW.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} />
          const key = ymd(view.y, view.m, d)
          const has = availSet.has(key)
          const selected = key === value
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={`relative grid aspect-square place-items-center rounded-xl text-sm transition ${
                selected
                  ? "bg-[var(--accent)] font-semibold text-[color:var(--on-accent)]"
                  : has
                    ? "bg-white/10 text-white hover:bg-white/15"
                    : "text-white/45 hover:bg-white/5"
              }`}
            >
              {d}
              {has && !selected && (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--accent)]" />
              )}
            </button>
          )
        })}
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-white/45">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
        dni z typami
      </p>
    </div>
  )
}
