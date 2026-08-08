"use client"

import { useState } from "react"
import { useInViewOnce } from "@/hooks/use-scroll-animation"

const N = 6 // gole 0..5 na drużynę

// P(k; λ) — rozkład Poissona.
function poissonPmf(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0
  let fact = 1
  for (let i = 2; i <= k; i++) fact *= i
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / fact
}

interface Cell {
  h: number
  a: number
  pct: number // znormalizowane do sumy = 100% w obrębie siatki 6×6
}

function buildGrid(lambdaHome: number, lambdaAway: number): Cell[][] {
  const rawHome = Array.from({ length: N }, (_, h) => poissonPmf(h, lambdaHome))
  const rawAway = Array.from({ length: N }, (_, a) => poissonPmf(a, lambdaAway))
  const raw: number[][] = rawHome.map((ph) => rawAway.map((pa) => ph * pa))
  const sum = raw.reduce((s, row) => s + row.reduce((a, b) => a + b, 0), 0)
  return raw.map((row, h) => row.map((v, a) => ({ h, a, pct: sum > 0 ? (v / sum) * 100 : 0 })))
}

/**
 * Macierz wyników — siatka 6×6 (gole gospodarzy × gole gości), intensywność
 * koloru = prawdopodobieństwo z modelu Poissona (λ_home/λ_away). Domyślnie
 * czysty heatmap (tylko kolor); hover/tap na komórkę odsłania dokładny %
 * w linii nad siatką, w miejscu podpisu "najbardziej prawdopodobny".
 */
export function ScoreMatrix({ lambdaHome, lambdaAway }: { lambdaHome: number; lambdaAway: number }) {
  const [active, setActive] = useState<Cell | null>(null)
  const [gridRef, inView] = useInViewOnce<HTMLDivElement>()
  const grid = buildGrid(lambdaHome, lambdaAway)
  const flat = grid.flat()
  const maxPct = Math.max(...flat.map((c) => c.pct))
  const mostLikely = flat.reduce((best, c) => (c.pct > best.pct ? c : best), flat[0])

  const caption = active
    ? `${active.h}:${active.a} — ${active.pct.toFixed(1)}%`
    : `Najbardziej prawdopodobny: ${mostLikely.h}:${mostLikely.a} (${Math.round(mostLikely.pct)}%)`

  return (
    <div className="glass-solid rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-1)] p-4 md:p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
        Macierz wyników
      </h2>

      <div ref={gridRef} className="flex justify-center">
        <div>
          {/* etykieta osi X (gole gości) */}
          <div className="ml-7 flex">
            {Array.from({ length: N }, (_, a) => (
              <span key={a} className="w-9 shrink-0 text-center text-[10px] text-[color:var(--text-muted)] sm:w-11">
                {a}
              </span>
            ))}
          </div>
          {grid.map((row, h) => (
            <div key={h} className="flex items-center">
              <span className="w-7 shrink-0 text-right text-[10px] text-[color:var(--text-muted)]">{h}</span>
              {row.map((cell) => {
                const isActive = active?.h === cell.h && active?.a === cell.a
                const opacity = Math.max(0.06, cell.pct / maxPct)
                return (
                  <button
                    key={cell.a}
                    type="button"
                    className={`matrix-cell m-[1px] grid h-9 w-9 shrink-0 place-items-center rounded-[3px] text-[10px] font-medium tnum transition-[outline] duration-100 sm:h-11 sm:w-11 ${
                      isActive ? "outline outline-2 outline-[color:var(--cyan)]" : ""
                    } ${inView ? "is-visible" : ""}`}
                    style={{
                      backgroundColor: `color-mix(in srgb, var(--cyan) ${Math.round(opacity * 100)}%, transparent)`,
                      "--i": h * N + cell.a,
                    } as React.CSSProperties}
                    onMouseEnter={() => setActive(cell)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(cell)}
                    onBlur={() => setActive(null)}
                    onClick={() => setActive((a) => (a?.h === cell.h && a?.a === cell.a ? null : cell))}
                    aria-label={`${cell.h}:${cell.a} — ${cell.pct.toFixed(1)}%`}
                  >
                    {opacity > 0.35 ? <span className="text-[color:var(--bg-0)]">{Math.round(cell.pct)}</span> : null}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-[color:var(--text-secondary)] tnum">{caption}</p>
      <p className="mt-1 text-center text-[11px] text-[color:var(--text-muted)]">
        Gospodarze (wiersze) × Goście (kolumny) · model Poissona
      </p>
    </div>
  )
}
