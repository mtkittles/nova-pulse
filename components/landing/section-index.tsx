"use client"

import { useEffect, useRef, useState } from "react"

const SECTIONS: { id: string; label: string }[] = [
  { id: "hero", label: "Start" },
  { id: "dzis", label: "Dziś" },
  { id: "typy-dnia", label: "Typy" },
  { id: "forma", label: "Forma" },
  { id: "rozliczone", label: "Rozliczone" },
  { id: "how", label: "Model" },
  { id: "plany", label: "Plany" },
]

/**
 * Numerowany indeks sekcji, fixed po prawej (desktop ≥1024px — ukryty niżej,
 * bo nie ma miejsca obok treści bez nachodzenia na nią).
 *
 * Numeracja jest ciągła (01..0N) po pominięciu sekcji nieobecnych w DOM
 * (np. „Rozliczone" znika, gdy brak jeszcze rozliczonych typów) — stąd
 * lista renderowanych pozycji ustalana w efekcie, nie na sztywno z SECTIONS.
 */
export function SectionIndex() {
  const [present, setPresent] = useState<{ id: string; label: string }[]>([])
  const [active, setActive] = useState<string | null>(null)
  const ratios = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    const found = SECTIONS.filter((s) => document.getElementById(s.id))
    setPresent(found)
    if (found.length === 0) return

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.current.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0)
        }
        let bestId: string | null = null
        let bestRatio = 0
        for (const s of found) {
          const r = ratios.current.get(s.id) ?? 0
          if (r > bestRatio) {
            bestRatio = r
            bestId = s.id
          }
        }
        if (bestId) setActive(bestId)
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    )
    for (const s of found) {
      const el = document.getElementById(s.id)
      if (el) io.observe(el)
    }
    return () => io.disconnect()
  }, [])

  if (present.length === 0) return null

  return (
    <nav
      aria-label="Nawigacja po sekcjach"
      className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-3 md:flex"
    >
      {present.map((s, i) => {
        const isActive = active === s.id
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`flex items-center gap-2.5 transition-all duration-200 ${
              isActive ? "text-[color:var(--cyan)]" : "text-[color:var(--text-muted)]"
            }`}
          >
            <span className={`text-xs font-medium tnum transition-all duration-200 ${isActive ? "text-sm" : ""}`}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              className={`h-px shrink-0 bg-current transition-all duration-200 ${
                isActive ? "w-6" : "w-3 opacity-50"
              }`}
            />
          </a>
        )
      })}
    </nav>
  )
}
