"use client"

import { HelpCircle } from "lucide-react"

// Spójne opisy metryk (P1-08).
export const METRIC_HINTS = {
  q: "Jakość sygnału modelu (0-100). Wyższy = pewniejsza analiza.",
  edge: "Przewaga modelu nad kursem bukmachera. Dodatni = wartość.",
  model: "Prawdopodobieństwo wg modelu Dixon-Coles + kalibracja.",
  odds: "Kurs bukmacherski (implikuje prawdopodobieństwo rynkowe).",
} as const

// Etykieta metryki z ikoną „?" i tooltipem (hover + focus, dostępne klawiaturą/dotykiem).
export function MetricLabel({
  label,
  hint,
  className = "",
}: {
  label: string
  hint: string
  className?: string
}) {
  return (
    <span className={`group/tt relative inline-flex items-center justify-center gap-1 ${className}`}>
      {label}
      <button
        type="button"
        aria-label={`${label}: ${hint}`}
        className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-white/40 transition hover:text-white/80 focus:text-white/80 focus:outline-none"
        onClick={(e) => e.preventDefault()}
      >
        <HelpCircle className="h-3 w-3" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-30 w-44 -translate-x-1/2 rounded-xl border border-white/12 bg-[var(--bg-soft)] px-3 py-2 text-[11px] font-normal leading-snug text-white/85 opacity-0 shadow-xl transition group-hover/tt:opacity-100 group-focus-within/tt:opacity-100"
      >
        {hint}
      </span>
    </span>
  )
}
