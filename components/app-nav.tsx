"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Newspaper, Shield, Target, Ticket, Trophy } from "lucide-react"
import { Brand } from "./brand"
import { ThemeToggle } from "./theme-toggle"
import { LogoutButton } from "./logout-button"

const NAV = [
  { href: "/typy", label: "Typy", icon: Target },
  { href: "/stats", label: "Statystyki", icon: BarChart3 },
  { href: "/ligi", label: "Ligi", icon: Trophy },
  { href: "/newsy", label: "Newsy", icon: Newspaper },
  { href: "/kupony", label: "Kupony", icon: Ticket },
]

export function AppNav({ loggedIn, isAdmin = false }: { loggedIn: boolean; isAdmin?: boolean }) {
  const path = usePathname()
  const isActive = (href: string) => path === href || path.startsWith(`${href}/`)
  const items = isAdmin ? [...NAV, { href: "/admin", label: "Admin", icon: Shield }] : NAV

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[var(--bg)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Brand />

          <nav className="hidden items-center gap-1 lg:flex">
            {items.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                    active ? "bg-[var(--accent)]/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-[color:var(--accent)]" : ""}`} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            {loggedIn ? (
              <LogoutButton />
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[color:var(--on-accent)] transition hover:scale-105"
              >
                Zaloguj
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* dolny tab-bar (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[var(--bg-soft)]/95 backdrop-blur-xl lg:hidden">
        <div
          className="mx-auto grid max-w-md"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        >
          {items.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] transition ${
                  active ? "text-[color:var(--accent)]" : "text-white/55"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
