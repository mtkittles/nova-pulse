"use client"

import { useEffect, useRef } from "react"

export type MeczTab = "prognoza" | "analiza" | "liga" | "h2h"

const TABS: { key: MeczTab; emoji: string; label: string }[] = [
  { key: "prognoza", emoji: "📊", label: "Prognoza" },
  { key: "analiza", emoji: "📈", label: "Analiza" },
  { key: "liga", emoji: "🏆", label: "Liga" },
  { key: "h2h", emoji: "⚔️", label: "H2H" },
]

// Pasek zakładek /mecz — sticky pod headerem, poziomy scroll na mobile.
// Aktywna: cyan tekst + cyan underline; aktywna zakładka wjeżdża na środek.
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
  useEffect(() => {
    refs.current[active]?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" })
  }, [active])

  return (
    <div className="sticky top-16 z-20 -mx-4 mb-5 border-b border-[color:var(--border-soft)] bg-[var(--bg-0)]/90 px-4 backdrop-blur">
      <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Sekcje meczu">
        {TABS.map((t) => {
          const on = active === t.key
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
              className={`flex min-w-[72px] shrink-0 items-center justify-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition ${
                on
                  ? "border-[color:var(--cyan)] text-[color:var(--cyan)]"
                  : "border-transparent text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
              }`}
            >
              <span aria-hidden>{t.emoji}</span>
              <span className="hidden min-[380px]:inline">{t.label}</span>
              {t.key === "h2h" && h2hCount > 0 && (
                <span className="rounded-full bg-[var(--surface-2)] px-1.5 text-[11px] font-semibold tnum text-[color:var(--text-secondary)]">
                  {h2hCount}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
