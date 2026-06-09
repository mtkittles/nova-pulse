"use client"

import { AnimatePresence, motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { spring } from "@/lib/design"

export interface TabItem {
  key: string
  label: string
  icon?: LucideIcon
  count?: number
}

// Taby z animowanym wskaźnikiem (sliding pill przez layoutId) + ikony + licznik.
export function AnimatedTabs({
  items,
  value,
  onChange,
  groupId,
  size = "md",
  className = "",
}: {
  items: TabItem[]
  value: string
  onChange: (key: string) => void
  groupId: string
  size?: "sm" | "md"
  className?: string
}) {
  const pad = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm"
  return (
    <div role="tablist" className={`flex flex-wrap gap-1.5 ${className}`}>
      {items.map((it) => {
        const active = value === it.key
        const Icon = it.icon
        return (
          <button
            key={it.key}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(it.key)}
            className={`relative inline-flex items-center gap-2 rounded-full border font-medium transition-colors ${pad} ${
              active
                ? "border-[color:var(--accent)]/40 text-white"
                : "border-white/12 bg-white/[0.05] text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            {active && (
              <motion.span
                layoutId={`${groupId}-indicator`}
                transition={spring}
                className="absolute inset-0 -z-10 rounded-full bg-[var(--accent)]/15"
              />
            )}
            {Icon && (
              <Icon
                className={`h-4 w-4 ${active ? "text-[color:var(--accent)]" : ""}`}
                aria-hidden
              />
            )}
            {it.label}
            {typeof it.count === "number" && (
              <span className={active ? "text-[color:var(--accent)]" : "text-white/55"}>
                {it.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// Panel zawartości taba: płynne fade/slide między zakładkami.
// swipeable: na mobile można przewijać palcem (drag X) między tabami.
export function TabPanel({
  tabKey,
  direction = 1,
  swipeable = false,
  onSwipe,
  children,
}: {
  tabKey: string
  direction?: number
  swipeable?: boolean
  onSwipe?: (dir: 1 | -1) => void
  children: React.ReactNode
}) {
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={tabKey}
        custom={direction}
        initial={{ opacity: 0, x: direction * 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: direction * -24 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        drag={swipeable ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        onDragEnd={
          swipeable && onSwipe
            ? (_e, info) => {
                if (info.offset.x < -70) onSwipe(1)
                else if (info.offset.x > 70) onSwipe(-1)
              }
            : undefined
        }
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
