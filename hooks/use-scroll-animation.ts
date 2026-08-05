"use client"

import { useCallback, useEffect, useRef, useState } from "react"

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

// Czy dany element wszedł (choć raz) w viewport — do jednorazowego "odpalenia"
// animacji przy scrollu (wykresy, macierz wyników). Ta sama konwencja
// obserwatora co ScrollReveal (threshold 0.1, rootMargin -40px od dołu),
// wydzielona tu, żeby nie duplikować boilerplate w każdym komponencie
// wykresu. Reduced-motion → od razu true (bez obserwatora).
//
// Callback ref, NIE useRef+useEffect — kilka konsumentów (wykresy) dołącza
// ref do elementu, który pojawia się w DOM dopiero PO osobnej bramce
// `mounted` (inny stan, inny efekt w komponencie nadrzędnym). Przy zwykłym
// useRef efekt tego hooka odpala się RAZ na mount, kiedy ref.current jest
// jeszcze null (element z refem jeszcze nie istnieje) — obserwator nigdy nie
// powstaje. Callback ref wywołuje się PRZY KAŻDYM podpięciu węzła, więc
// obserwator zawsze dostaje realny element, niezależnie od tego, kiedy się
// pojawi.
export function useInViewOnce<T extends Element>(): [(node: T | null) => void, boolean] {
  const [inView, setInView] = useState(false)
  const reduced = usePrefersReducedMotion()
  const observerRef = useRef<IntersectionObserver | null>(null)
  const inViewRef = useRef(inView)
  inViewRef.current = inView

  const setRef = useCallback(
    (node: T | null) => {
      observerRef.current?.disconnect()
      observerRef.current = null
      if (!node || reduced || inViewRef.current) {
        if (reduced) setInView(true)
        return
      }
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true)
            io.disconnect()
          }
        },
        { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
      )
      io.observe(node)
      observerRef.current = io
    },
    [reduced],
  )

  useEffect(() => () => observerRef.current?.disconnect(), [])

  return [setRef, inView]
}
