"use client"

import { useRef } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

// Pozioma karuzela: scroll-snap (swipe na mobile, scroll na desktop), ukryty pasek,
// strzałki na desktopie, wejście kart ze staggerem + subtelny scale na hover.
export function HorizontalCarousel<T>({
  items,
  renderItem,
  getKey,
  ariaLabel = "Karuzela",
}: {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  getKey: (item: T, index: number) => string
  ariaLabel?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const scrollBy = (dir: number) => {
    const el = ref.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" })
  }

  if (items.length === 0) return null

  return (
    <div className="group relative">
      <div
        ref={ref}
        role="list"
        aria-label={ariaLabel}
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3"
      >
        {items.map((item, i) => (
          <motion.div
            role="listitem"
            key={getKey(item, i)}
            className="w-[280px] shrink-0 snap-start sm:w-[320px]"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: Math.min(i, 6) * 0.05 }}
            whileHover={{ scale: 1.015 }}
          >
            {renderItem(item, i)}
          </motion.div>
        ))}
      </div>

      {/* strzałki — tylko desktop (hover); na mobile swipe */}
      <button
        type="button"
        aria-label="Przewiń w lewo"
        onClick={() => scrollBy(-1)}
        className="absolute left-[-16px] top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-[color:var(--border)] bg-[var(--bg-soft)]/90 text-[color:var(--text)] opacity-0 shadow-xl backdrop-blur transition group-hover:opacity-100 hover:bg-[var(--bg-soft)] lg:grid"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Przewiń w prawo"
        onClick={() => scrollBy(1)}
        className="absolute right-[-16px] top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-[color:var(--border)] bg-[var(--bg-soft)]/90 text-[color:var(--text)] opacity-0 shadow-xl backdrop-blur transition group-hover:opacity-100 hover:bg-[var(--bg-soft)] lg:grid"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}
