"use client"

import { useEffect, useRef, useState } from "react"

// Rozwijana sekcja z płynną animacją wysokości (0 ↔ scrollHeight) + opacity.
// Po otwarciu ustawia height:auto (responsywność), przy zamknięciu wraca do 0.
export function AnimatedCollapse({
  open,
  children,
  className = "",
}: {
  open: boolean
  children: React.ReactNode
  className?: string
}) {
  const inner = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<string>(open ? "auto" : "0px")

  useEffect(() => {
    const el = inner.current
    if (!el) return
    if (open) {
      setHeight(`${el.scrollHeight}px`)
      const t = window.setTimeout(() => setHeight("auto"), 320)
      return () => window.clearTimeout(t)
    }
    // auto → konkretna wartość → 0 (żeby transition zadziałał)
    setHeight(`${el.scrollHeight}px`)
    const r = window.requestAnimationFrame(() => setHeight("0px"))
    return () => window.cancelAnimationFrame(r)
  }, [open, children])

  return (
    <div
      style={{ height, overflow: "hidden", transition: "height 0.3s ease, opacity 0.3s ease", opacity: open ? 1 : 0 }}
      className={className}
      aria-hidden={!open}
    >
      <div ref={inner}>{children}</div>
    </div>
  )
}
