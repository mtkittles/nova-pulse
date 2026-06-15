"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

// Pozioma karuzela kart — czysty CSS scroll-snap + touch (bez bibliotek).
// Dots (IntersectionObserver), opcjonalny auto-play (≤5 kart, pauza po interakcji),
// karty poza widokiem przygaszone (opacity/scale). Mobile: 1 karta, sm: 2, lg: 3.
export function CardsCarousel({
  children,
  autoPlay = true,
  ariaLabel = "Karuzela kart",
}: {
  children: ReactNode
  autoPlay?: boolean
  ariaLabel?: string
}) {
  const items = (Array.isArray(children) ? children : [children]).filter(Boolean) as ReactNode[]
  const trackRef = useRef<HTMLDivElement>(null)
  const lastInteract = useRef(0)
  const [active, setActive] = useState(0)

  // aktywny indeks + przygaszenie kart poza widokiem
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const cards = Array.from(track.querySelectorAll<HTMLElement>("[data-card]"))
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement
          const visible = e.isIntersecting && e.intersectionRatio >= 0.5
          el.style.opacity = visible ? "1" : "0.6"
          el.style.transform = visible ? "scale(1)" : "scale(0.97)"
          if (visible) setActive(Number(el.dataset.idx))
        }
      },
      { root: track, threshold: [0, 0.5, 1] },
    )
    cards.forEach((c) => io.observe(c))
    return () => io.disconnect()
  }, [items.length])

  function goTo(i: number) {
    const track = trackRef.current
    if (!track) return
    const card = track.querySelector<HTMLElement>(`[data-idx="${i}"]`)
    if (!card) return
    const delta = card.getBoundingClientRect().left - track.getBoundingClientRect().left
    track.scrollBy({ left: delta, behavior: "smooth" })
  }

  const markInteract = () => {
    lastInteract.current = Date.now()
  }

  // auto-play tylko dla ≤5 kart; pauza 8s po interakcji
  useEffect(() => {
    if (!autoPlay || items.length < 2 || items.length > 5) return
    const id = setInterval(() => {
      if (Date.now() - lastInteract.current < 8000) return
      goTo((active + 1) % items.length)
    }, 4000)
    return () => clearInterval(id)
  }, [active, items.length, autoPlay])

  if (items.length === 0) return null

  return (
    <div>
      <div
        ref={trackRef}
        role="group"
        aria-label={ariaLabel}
        onPointerDown={markInteract}
        onScroll={markInteract}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-4 sm:px-0"
      >
        {items.map((child, i) => (
          <div
            key={i}
            data-card
            data-idx={i}
            style={{ transition: "opacity 0.3s ease, transform 0.3s ease" }}
            className="min-w-0 shrink-0 snap-start basis-[calc(100%-2rem)] sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(33.333%-0.5rem)]"
          >
            {child}
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Przejdź do karty ${i + 1}`}
              aria-current={i === active}
              onClick={() => {
                markInteract()
                goTo(i)
              }}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-5 bg-[var(--cyan)]" : "w-1.5 bg-[color:var(--text-muted)]/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
