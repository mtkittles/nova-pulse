"use client"

import { useEffect, useRef, useState } from "react"

// Licznik animowany od 0 do wartości. Startuje, gdy wejdzie w viewport.
// SSR i pierwszy render = 0 → brak rozjazdu hydratacji.
export function CountUp({
  to,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1100,
  className,
}: {
  to: number
  decimals?: number
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
}) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const run = () => {
      if (started.current) return
      started.current = true
      const start = performance.now()
      const ease = (p: number) => 1 - Math.pow(1 - p, 3)
      let raf = 0
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration)
        setVal(to * ease(p))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(raf)
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && run()),
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [to, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {val.toFixed(decimals)}
      {suffix}
    </span>
  )
}
