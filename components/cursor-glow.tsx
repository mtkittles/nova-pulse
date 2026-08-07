"use client"

import { useEffect, useRef } from "react"
import { usePrefersReducedMotion } from "@/hooks/use-scroll-animation"

const SIZE = 260 // px (zakres 200-300)
const LERP = 0.1 // płynne "gonienie" kursora zamiast sztywnego przyklejenia

/**
 * Poświata podążająca za kursorem/palcem — position:fixed, pointer-events:
 * none, RAF + transform: translate3d (GPU, jedna warstwa kompozytowana,
 * żadnego layout/repaint na klatkę). Pointer Events ujednolicają mysz i
 * dotyk: pointermove/pointerdown pokazują poświatę i aktualizują cel,
 * pointerup/pointercancel/pointerleave ukrywają (fade 600ms przez CSS
 * transition, nie JS). Całkowicie wyłączona pod prefers-reduced-motion —
 * ciągły ruch elementu śledzącego kursor jest dokładnie tym, czego ten
 * tryb ma unikać.
 */
export function CursorGlow() {
  const reduced = usePrefersReducedMotion()
  const elRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reduced) return
    const el = elRef.current
    if (!el) return

    const target = { x: -9999, y: -9999 }
    const current = { x: -9999, y: -9999 }
    let raf = 0
    let visible = false

    function loop() {
      current.x += (target.x - current.x) * LERP
      current.y += (target.y - current.y) * LERP
      el!.style.transform = `translate3d(${current.x - SIZE / 2}px, ${current.y - SIZE / 2}px, 0)`
      raf = requestAnimationFrame(loop)
    }

    function show(e: PointerEvent) {
      target.x = e.clientX
      target.y = e.clientY
      if (!visible) {
        visible = true
        current.x = e.clientX
        current.y = e.clientY
        el!.style.opacity = "1"
      }
    }
    function hide() {
      visible = false
      el!.style.opacity = "0"
    }

    window.addEventListener("pointermove", show, { passive: true })
    window.addEventListener("pointerdown", show, { passive: true })
    window.addEventListener("pointerup", hide, { passive: true })
    window.addEventListener("pointercancel", hide, { passive: true })
    window.addEventListener("pointerleave", hide, { passive: true })
    raf = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener("pointermove", show)
      window.removeEventListener("pointerdown", show)
      window.removeEventListener("pointerup", hide)
      window.removeEventListener("pointercancel", hide)
      window.removeEventListener("pointerleave", hide)
      cancelAnimationFrame(raf)
    }
  }, [reduced])

  if (reduced) return null

  return <div ref={elRef} aria-hidden className="cursor-glow" />
}
