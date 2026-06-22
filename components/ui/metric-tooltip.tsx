"use client"

import { useEffect, useRef, useState } from "react"
import { HelpCircle } from "lucide-react"

// Spójne opisy metryk (P1-08).
export const METRIC_HINTS = {
  q: "Jakość sygnału modelu (0-100). Wyższy = pewniejsza analiza.",
  edge: "Przewaga modelu nad kursem bukmachera. Dodatni = wartość.",
  model: "Prawdopodobieństwo wg modelu goli Poissona/Dixon-Coles z kalibracją.",
  odds: "Kurs bukmacherski (implikuje prawdopodobieństwo rynkowe).",
} as const

// Etykieta metryki z ikoną „?" i tooltipem.
// Desktop: hover. Mobile/dotyk: tap = toggle, tap poza = zamknij (S5-4).
// Pozycja pionowa dobierana tak, by nie wychodzić poza ekran (top vs bottom).
export function MetricLabel({
  label,
  hint,
  className = "",
}: {
  label: string
  hint: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)
  const [placeBelow, setPlaceBelow] = useState(false)

  // zamknij przy tapnięciu/kliknięciu poza komponentem
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("pointerdown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    // za mało miejsca u góry (blisko górnej krawędzi) → pokaż pod spodem
    const r = ref.current?.getBoundingClientRect()
    setPlaceBelow(r ? r.top < 120 : false)
    setOpen((v) => !v)
  }

  return (
    <span ref={ref} className={`group/tt relative inline-flex items-center justify-center gap-1 ${className}`}>
      {label}
      <button
        type="button"
        aria-label={`${label}: ${hint}`}
        aria-expanded={open}
        className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-white/40 transition hover:text-white/80 focus:text-white/80 focus:outline-none"
        onClick={toggle}
      >
        <HelpCircle className="h-3 w-3" />
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 z-30 w-[min(11rem,80vw)] -translate-x-1/2 rounded-xl border border-white/12 bg-[var(--bg-soft)] px-3 py-2 text-[11px] font-normal leading-snug text-white/85 shadow-xl transition group-hover/tt:opacity-100 ${
          placeBelow ? "top-[calc(100%+6px)]" : "bottom-[calc(100%+6px)]"
        } ${open ? "opacity-100" : "opacity-0"}`}
      >
        {hint}
      </span>
    </span>
  )
}
