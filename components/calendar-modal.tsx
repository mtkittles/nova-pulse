"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import type { CalendarDay } from "@/lib/extra-types"
import { Calendar } from "./calendar"

// Pełny kalendarz miesięczny w modalu (nie na stałe na ekranie). Esc / klik tła / X zamyka.
export function CalendarModal({
  open,
  value,
  days,
  onSelect,
  onClose,
}: {
  open: boolean
  value: string
  days: CalendarDay[]
  onSelect: (date: string) => void
  onClose: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Kalendarz typów"
      className="fixed inset-0 z-50 grid place-items-center p-4"
    >
      <div className="absolute inset-0 bg-[var(--bg-0)]/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Wybierz dzień</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij kalendarz"
            className="grid h-9 w-9 place-items-center rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-1)] text-[color:var(--text-secondary)] transition hover:bg-[var(--surface-2)] hover:text-[color:var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <Calendar
          value={value}
          days={days}
          onSelect={(d) => {
            onSelect(d)
            onClose()
          }}
        />
      </div>
    </div>
  )
}
