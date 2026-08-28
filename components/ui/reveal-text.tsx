"use client"

import { useEffect, useRef, useState } from "react"
import { usePrefersReducedMotion } from "@/hooks/use-scroll-animation"

/**
 * Nagłówek łamany słowo-na-słowo, każde wjeżdża osobno (translate-y + opacity,
 * stagger 60ms) gdy sekcja wejdzie w 20% widoczności.
 *
 * Tekst realnego h2 jest zawsze w DOM (nic nie jest server-side ukryte) —
 * animacja to `opacity`/`translateY` sterowane klasą `.reveal-word` w CSS,
 * przełączaną po zamontowaniu przez IntersectionObserver.
 */
export function RevealText({
  text,
  className = "",
}: {
  text: string
  className?: string
}) {
  const ref = useRef<HTMLHeadingElement>(null)
  const [visible, setVisible] = useState(false)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (reduced) {
      setVisible(true)
      return
    }
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

  const words = text.split(" ")

  return (
    <h2 ref={ref} className={className}>
      {words.map((w, i) => (
        <span
          key={i}
          className={`reveal-word ${visible ? "is-visible" : ""}`}
          style={{ "--i": i } as React.CSSProperties}
        >
          {w}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </h2>
  )
}
