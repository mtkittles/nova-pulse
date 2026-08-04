"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Home, Radio, Target } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { mapLiveStatus, useLiveMatches } from "@/hooks/use-live-matches"

type Tab = { href: string; label: string; icon: LucideIcon }

const TABS: Tab[] = [
  { href: "/", label: "Start", icon: Home },
  { href: "/typy", label: "Typy", icon: Target },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/stats", label: "Stats", icon: BarChart3 },
]

/**
 * Dolna nawigacja mobilna (≤1024px) — wydzielona z AppNav, żeby landing
 * i pozostałe strony miały jeden pasek zamiast dwóch kopii.
 *
 * Blur tła + safe-area-inset (pasek gestów iOS), tap targety 44px.
 */
export function MobileTabBar() {
  const path = usePathname()
  const isActive = (href: string) =>
    href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`)

  const { liveMatches } = useLiveMatches()
  const liveCount = liveMatches.filter((m) => {
    const s = mapLiveStatus(m.status_short)
    return s === "live" || s === "halftime"
  }).length

  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--border-soft)] bg-[var(--bg-0)]/70 backdrop-blur-xl lg:hidden"
      aria-label="Nawigacja główna"
    >
      <div className="mx-auto grid max-w-md grid-cols-4">
        {TABS.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          const isLive = item.href === "/live"
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`tap flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors duration-150 ${
                active ? "text-[color:var(--cyan)]" : "text-[color:var(--text-secondary)]"
              }`}
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                {isLive && liveCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-[var(--danger)] px-1 text-[9px] font-bold leading-none text-white">
                    <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[var(--danger)] opacity-60" />
                    {liveCount}
                  </span>
                )}
              </span>
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
