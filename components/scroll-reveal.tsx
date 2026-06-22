"use client"

import { useEffect, useRef, useState } from "react"
import { usePrefersReducedMotion, useScrollDirection } from "@/hooks/use-scroll-animation"

interface Props {
  children: React.ReactNode
  delay?: number // ms
  className?: string
}

// Reveal kart/sekcji przy scrollu w obu kierunkach (IntersectionObserver + CSS).
// Graceful degradation: domyślnie WIDOCZNE (SSR/brak JS) — ukrywane dopiero
// po mount przez obserwator. Reduced-motion → zawsze widoczne, bez animacji.
export function ScrollReveal({ children, delay = 0, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const direction = useScrollDirection()
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (reduced) {
      setVisible(true)
      return
    }
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [reduced])

  if (reduced) {
    return <div className={className}>{children}</div>
  }

  const hidden = direction === "down" ? "opacity-0 translate-y-5" : "opacity-0 -translate-y-5"
  const shown = "opacity-100 translate-y-0"

  return (
    <div
      ref={ref}
      className={`transition-all duration-300 ease-out will-change-[transform,opacity] ${visible ? shown : hidden} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
