"use client"

import { useEffect, useRef, useState } from "react"

// Kierunek scrolla — do wyboru animacji wjazdu (dół → fadeInUp, góra → fadeInDown).
// setState tylko przy ZMIANIE kierunku (brak storma re-renderów na każdy scroll).
export function useScrollDirection() {
  const [direction, setDirection] = useState<"down" | "up">("down")
  const lastY = useRef(0)
  useEffect(() => {
    lastY.current = window.scrollY
    const handler = () => {
      const y = window.scrollY
      const next = y > lastY.current ? "down" : "up"
      if (Math.abs(y - lastY.current) > 4) {
        setDirection((prev) => (prev === next ? prev : next))
        lastY.current = y
      }
    }
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])
  return direction
}

// Czy user woli ograniczone animacje (a11y / oszczędzanie baterii).
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(mq.matches)
    const on = () => setReduced(mq.matches)
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return reduced
}
