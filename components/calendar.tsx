"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { CalendarDay } from "@/lib/extra-types"

const MONTHS = [
  "styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec",
  "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień",
]
const DOW = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"]

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

function todayWarsaw(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

// skala intensywności heatmapy wg liczby typów
function bucketClass(tips: number): string {
  if (tips < 0) return "bg-[var(--accent)]/25 text-white" // są typy, liczba nieznana
  if (tips === 0) return "text-white/25 line-through" // brak typów
  if (tips <= 5) return "bg-[var(--accent)]/15 text-white"
  if (tips <= 15) return "bg-[var(--accent)]/35 text-white"
  return "bg-[var(--accent)]/70 font-semibold text-[color:var(--on-accent)]" // 16+
}

export function Calendar({
  value,
  days,
  onSelect,
}: {
  value: string
  days: CalendarDay[]
  onSelect: (date: string) => void
}) {
  const init = value ? new Date(`${value}T12:00:00Z`) : new Date()
  const [view, setView] = useState({ y: init.getUTCFullYear(), m: init.getUTCMonth() })

  const map = new Map(days.map((d) => [d.date, d]))
  const today = todayWarsaw()

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
          className="grid h-9 w-9 place-items-center rounded-xl border border-white/12 bg-white/[0.05] transition hover:bg-white/10"
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
          className="grid h-9 w-9 place-items-center rounded-xl border border-white/12 bg-white/[0.05] transition hover:bg-white/10"
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
          const info = map.get(key)
          const tips = info ? info.tips : 0
          const selected = key === value
          const isToday = key === today
          const hasTips = tips !== 0
          const tooltip =
            tips < 0
              ? "typy dostępne"
              : tips > 0
                ? `${tips} typów · ${info?.matches ?? 0} meczów · ${info?.leagues ?? 0} lig`
                : "brak typów"

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={`group relative grid aspect-square place-items-center rounded-xl text-sm transition hover:brightness-125 ${
                selected ? "ring-2 ring-[var(--accent)]" : isToday ? "ring-1 ring-white/50" : ""
              } ${bucketClass(tips)}`}
            >
              {d}

              {tips > 0 && (
                <span className="absolute right-1 top-0.5 text-[9px] font-semibold leading-none text-white/70">
                  {tips}
                </span>
              )}

              {/* tooltip (hover, desktop) */}
              <span className="pointer-events-none absolute bottom-[calc(100%+4px)] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/12 bg-[var(--bg-soft)] px-2.5 py-1.5 text-[11px] text-white/85 opacity-0 shadow-xl transition group-hover:opacity-100">
                {tooltip}
              </span>
            </button>
          )
        })}
      </div>

      {/* legenda skali */}
      <div className="mt-4 flex items-center gap-2 text-[11px] text-white/45">
        <span>mniej</span>
        <span className="h-3 w-3 rounded bg-[var(--accent)]/15" />
        <span className="h-3 w-3 rounded bg-[var(--accent)]/35" />
        <span className="h-3 w-3 rounded bg-[var(--accent)]/70" />
        <span>więcej typów</span>
      </div>
    </div>
  )
}
