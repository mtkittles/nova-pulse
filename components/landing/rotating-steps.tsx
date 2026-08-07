"use client"

import { useEffect, useState } from "react"
import { HOW_IT_WORKS } from "@/lib/how-it-works"
import { usePrefersReducedMotion } from "@/hooks/use-scroll-animation"

const HOLD_MS = 3000
const FADE_MS = 400

/**
 * Rotujące zdania "Jak działa model" obok logo w hero (desktop) / pod nim
 * (mobile) — fade-out, zmiana treści, fade-in, pętla. Kontener ma stałą
 * min-wysokość zmierzoną pod najdłuższy krok, żeby zmiana nie przesuwała
 * layoutu. Pod prefers-reduced-motion rotacja jest wyłączona całkowicie
 * (zostaje pierwszy krok bez zmian) — auto-zmieniająca się treść to
 * dokładnie ten typ ruchu, którego ten tryb ma unikać.
 */
export function RotatingSteps() {
  const reduced = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (reduced) return
    const hold = setTimeout(() => setVisible(false), HOLD_MS)
    return () => clearTimeout(hold)
  }, [index, reduced])

  useEffect(() => {
    if (reduced || visible) return
    const advance = setTimeout(() => {
      setIndex((i) => (i + 1) % HOW_IT_WORKS.length)
      setVisible(true)
    }, FADE_MS)
    return () => clearTimeout(advance)
  }, [visible, reduced])

  const step = HOW_IT_WORKS[index]

  return (
    <div className="min-h-[108px] w-full md:min-h-[92px]">
      <div
        className={`transition-opacity duration-[400ms] ease-out ${
          reduced || visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="tnum text-xs font-semibold uppercase tracking-wider text-[color:var(--cyan)]">
          Krok {index + 1}/{HOW_IT_WORKS.length}
        </p>
        <h2 className="mt-1.5 text-base font-semibold leading-snug text-[color:var(--text-primary)] md:text-lg">
          {step.title}
        </h2>
        <p className="mt-1.5 text-sm leading-6 text-[color:var(--text-secondary)]">{step.text}</p>
      </div>
    </div>
  )
}
