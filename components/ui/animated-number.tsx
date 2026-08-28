"use client"

import { useEffect, useRef, useState } from "react"
import { usePrefersReducedMotion } from "@/hooks/use-scroll-animation"

// Licznik, który płynnie doganiania nową wartość przy KAŻDEJ zmianie (nie
// tylko raz przy wejściu w viewport jak ui/count-up.tsx) — do liczników
// aktualizowanych przez filtry/interakcje usera (np. "Pokazano X z Y typów").
export function AnimatedNumber({ value, duration = 300, className }: { value: number; duration?: number; className?: string }) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (reduced) {
      setDisplay(value)
      fromRef.current = value
      return
    }
    const from = fromRef.current
    if (from === value) return
    const start = performance.now()
    const ease = (p: number) => 1 - Math.pow(1 - p, 3)
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      setDisplay(Math.round(from + (value - from) * ease(p)))
      if (p < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        fromRef.current = value
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration, reduced])

  return <span className={className}>{display}</span>
}
