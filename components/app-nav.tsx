"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { BarChart3, Crown, Home, Medal, Menu, Newspaper, Radio, Shield, Target, Ticket, Trophy, User, X } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Brand } from "./brand"
import { LogoutButton } from "./logout-button"
import { mapLiveStatus, useLiveMatches } from "@/hooks/use-live-matches"

type NavItem = { href: string; label: string; icon: LucideIcon; highlight?: boolean }

// Feature flagi (P0-4): Newsy/Kupony ukryte w nawigacji, dopóki nie włączone.
// Domyślnie false → linki schowane (strony nadal dostępne bezpośrednio).
const SHOW_NEWS = process.env.NEXT_PUBLIC_FEATURE_NEWS === "true"
const SHOW_COUPONS = process.env.NEXT_PUBLIC_FEATURE_COUPONS === "true"

const NAV: NavItem[] = [
  { href: "/mundial", label: "Mundial", icon: Trophy, highlight: true },
  { href: "/typy", label: "Typy", icon: Target },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/stats", label: "Statystyki", icon: BarChart3 },
  { href: "/ligi", label: "Ligi", icon: Medal },
  { href: "/ranking", label: "Ranking", icon: Crown },
  ...(SHOW_NEWS ? [{ href: "/newsy", label: "Newsy", icon: Newspaper }] : []),
  ...(SHOW_COUPONS ? [{ href: "/kupony", label: "Kupony", icon: Ticket }] : []),
]

// Dolna nawigacja mobilna — 4 zakładki (≤768px).
const MOBILE_TABS: NavItem[] = [
  { href: "/", label: "Start", icon: Home },
  { href: "/typy", label: "Typy", icon: Target },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/stats", label: "Stats", icon: BarChart3 },
]

export function AppNav({ loggedIn, isAdmin = false }: { loggedIn: boolean; isAdmin?: boolean }) {
  const path = usePathname()
  const isActive = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`))
  const items: NavItem[] = isAdmin ? [...NAV, { href: "/admin", label: "Admin", icon: Shield }] : NAV

  // mobilne menu — toggle ☰/✕ (zamknij na Esc / klik tła / klik linku)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false)
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [menuOpen])

  // licznik meczów na żywo → kropka/badge przy zakładce Live
  const { liveMatches } = useLiveMatches()
  const liveCount = liveMatches.filter((m) => {
    const s = mapLiveStatus(m.status_short)
    return s === "live" || s === "halftime"
  }).length

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[color:var(--border-soft)] bg-[var(--bg-0)]/80 backdrop-blur-xl">
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
                    active
                      ? "bg-[var(--cyan-soft)] text-[color:var(--text-primary)]"
                      : item.highlight
                        ? "text-[color:var(--cyan)] hover:bg-[var(--cyan-soft)]"
                        : "text-[color:var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[color:var(--text-primary)]"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active || item.highlight ? "text-[color:var(--accent)]" : ""}`} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* desktop: profil / wyloguj lub zaloguj (mobilnie zastąpione togglem) */}
          <div className="hidden items-center gap-2 lg:flex">
            {loggedIn ? (
              <>
                <Link
                  href="/profil"
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-1)] px-4 py-2 text-sm font-medium text-[color:var(--text-secondary)] transition hover:bg-[var(--surface-2)] hover:text-[color:var(--text-primary)]"
                >
                  <User className="h-4 w-4" /> Profil
                </Link>
                <LogoutButton />
              </>
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

      {/* mobilny toggle menu — ZAWSZE toggle (☰/✕), fixed nad overlayem; nigdy nie ikona wylogowania */}
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="fixed right-5 top-3.5 z-[70] grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-1)]/90 backdrop-blur lg:hidden"
        aria-label={menuOpen ? "Zamknij menu" : "Otwórz menu"}
        aria-expanded={menuOpen}
      >
        {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* mobilne menu: backdrop (klik = zamknij) + panel; wylogowanie WEWNĄTRZ panelu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button type="button" aria-label="Zamknij menu" onClick={() => setMenuOpen(false)} className="absolute inset-0 bg-[var(--bg-0)]/70 backdrop-blur-sm" />
          <nav className="absolute left-4 right-4 top-16 grid max-h-[80vh] gap-1 overflow-y-auto rounded-[var(--radius-card)] border border-[color:var(--border-soft)] bg-[var(--surface-1)] p-3 shadow-2xl shadow-black/40">
            {items.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active ? "bg-[var(--cyan-soft)] text-[color:var(--cyan)]" : "text-[color:var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[color:var(--text-primary)]"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {item.label}
                </Link>
              )
            })}
            <div className="mt-1 border-t border-[color:var(--border-soft)] pt-2">
              {loggedIn ? (
                <div className="grid gap-1">
                  <Link
                    href="/profil"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium text-[color:var(--text-secondary)] transition hover:bg-[var(--surface-2)] hover:text-[color:var(--text-primary)]"
                  >
                    <User className="h-4 w-4" /> Profil
                  </Link>
                  <div onClick={() => setMenuOpen(false)}>
                    <LogoutButton />
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-2xl bg-[var(--accent)] px-4 py-3 text-center text-sm font-semibold text-[color:var(--on-accent)]"
                >
                  Zaloguj
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* dolna nawigacja mobilna — 4 zakładki, sticky bottom + safe-area */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--border-soft)] bg-[var(--surface-1)]/95 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Nawigacja"
      >
        <div className="mx-auto grid max-w-md grid-cols-4">
          {MOBILE_TABS.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            const isLive = item.href === "/live"
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  active ? "text-[color:var(--cyan)]" : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
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
    </>
  )
}
