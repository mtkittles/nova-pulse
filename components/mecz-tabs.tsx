"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { BarChart3, LineChart, Swords, Trophy } from "lucide-react"

export type MeczTab = "prognoza" | "analiza" | "liga" | "h2h"

const TABS: { key: MeczTab; icon: typeof BarChart3; label: string }[] = [
  { key: "prognoza", icon: BarChart3, label: "Prognoza" },
  { key: "analiza", icon: LineChart, label: "Analiza" },
  { key: "liga", icon: Trophy, label: "Liga" },
  { key: "h2h", icon: Swords, label: "H2H" },
]

// SSR-safe layout effect (bez ostrzeżeń przy renderze serwerowym).
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

// Pasek zakładek /mecz — sticky pod headerem, poziomy scroll na mobile.
// Aktywna: cyan tekst + przesuwany (sliding) underline animowany left/width.
export function MeczTabs({
  active,
  onChange,
  h2hCount = 0,
}: {
  active: MeczTab
  onChange: (t: MeczTab) => void
  h2hCount?: number
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [ind, setInd] = useState<{ left: number; width: number }>({ left: 0, width: 0 })

  useIsoLayoutEffect(() => {
    const el = refs.current[active]
    if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth })
  }, [active])

  useEffect(() => {
    // Wycentrowanie aktywnej zakładki w poziomo-scrollowalnym pasku —
    // WYŁĄCZNIE scrollLeft tego konkretnego kontenera (rodzica przycisku),
    // nigdy scrollIntoView(). scrollIntoView potrafi po drodze przesunąć
    // też scroll CAŁEJ strony (przegląda wszystkich scrollowalnych
    // przodków aż do document, nie tylko najbliższego) — to była realna
    // przyczyna "skoku" scrolla strony przy każdej zmianie zakładki.
    const el = refs.current[active]
    const container = el?.parentElement
    if (el && container) {
      const target = el.offsetLeft - container.clientWidth / 2 + el.offsetWidth / 2
      container.scrollTo({ left: Math.max(0, target), behavior: "smooth" })
    }
    const onResize = () => {
      const a = refs.current[active]
      if (a) setInd({ left: a.offsetLeft, width: a.offsetWidth })
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [active])

  return (
    <div className="sticky top-16 z-20 -mx-4 mb-5 border-b border-[color:var(--border-soft)] bg-[var(--bg-0)]/90 px-4 backdrop-blur">
      <div className="relative flex gap-1 overflow-x-auto" role="tablist" aria-label="Sekcje meczu">
        {TABS.map((t) => {
          const on = active === t.key
          const Icon = t.icon
          return (
            <button
              key={t.key}
              ref={(el) => {
                refs.current[t.key] = el
              }}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onChange(t.key)}
              className={`flex min-w-[72px] shrink-0 items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors ${
                on ? "text-[color:var(--cyan)]" : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
              }`}
            >
              <Icon aria-hidden className="h-4 w-4" />
              <span className="hidden min-[380px]:inline">{t.label}</span>
              {t.key === "h2h" && h2hCount > 0 && (
                <span className="rounded-full bg-[var(--surface-2)] px-1.5 text-[11px] font-semibold tnum text-[color:var(--text-secondary)]">
                  {h2hCount}
                </span>
              )}
            </button>
          )
        })}
        {/* przesuwany underline */}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-[color:var(--cyan)] transition-[left,width] duration-[250ms] ease-out"
          style={{ left: ind.left, width: ind.width }}
        />
      </div>
    </div>
  )
}
