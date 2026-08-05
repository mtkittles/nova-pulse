"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Brand } from "./brand"
import { LogoutButton } from "./logout-button"

type NavItem = { label: string; href: string }

// Feature flagi (P0-4): Newsy/Kupony ukryte w nawigacji, dopóki nie włączone.
const SHOW_NEWS = process.env.NEXT_PUBLIC_FEATURE_NEWS === "true"
const SHOW_COUPONS = process.env.NEXT_PUBLIC_FEATURE_COUPONS === "true"

// Landing: kotwice do sekcji własnej strony + skróty do najważniejszych podstron.
const LANDING_NAV: NavItem[] = [
  { label: "Dziś", href: "#dzis" },
  { label: "Forma", href: "#forma" },
  { label: "Typy", href: "/typy" },
  { label: "Live", href: "/live" },
  { label: "Statystyki", href: "/stats" },
]

// Pozostałe strony: pełna nawigacja aplikacji (bez kotwic, które istnieją tylko na landingu).
const APP_NAV: NavItem[] = [
  { label: "Typy", href: "/typy" },
  { label: "Live", href: "/live" },
  { label: "Statystyki", href: "/stats" },
  { label: "Ligi", href: "/ligi" },
  { label: "Ranking", href: "/ranking" },
  ...(SHOW_NEWS ? [{ label: "Newsy", href: "/newsy" }] : []),
  ...(SHOW_COUPONS ? [{ label: "Kupony", href: "/kupony" }] : []),
]

/**
 * Jeden wspólny header dla całej strony (landing + wnętrze aplikacji) — flat,
 * tekstowy nav (uppercase, tracking, podkreślenie na hover), zero wypełnionych
 * piguł z tłem. Na landingu dokłada kotwice do sekcji własnej strony; poza
 * landingiem pokazuje pełną nawigację aplikacji + Admin dla adminów.
 *
 * Stan zalogowania: "Profil"/"Wyloguj" jako zwykłe linki tekstowe (nie osobne
 * kolorowe przyciski) — jedyny wypełniony akcent to CTA "Zaloguj"/"Mój panel"
 * dla gościa, spójnie z dotychczasowym landingiem.
 */
export function SiteHeader({ loggedIn, isAdmin = false }: { loggedIn: boolean; isAdmin?: boolean }) {
  const pathname = usePathname()
  const isLanding = pathname === "/"
  const items: NavItem[] = isLanding ? LANDING_NAV : isAdmin ? [...APP_NAV, { label: "Admin", href: "/admin" }] : APP_NAV
  const isActive = (href: string) => (href.startsWith("#") ? false : href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`))

  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  // osobny stan „zamontowane" żeby stagger wjazdu odpalał się PO otwarciu
  // (klasa is-visible dodana w kolejnym ticku, inaczej przeglądarka złączy
  // start+end stanu w jedną klatkę i przejście CSS się nie odtworzy)
  const [itemsVisible, setItemsVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (!open) {
      setItemsVisible(false)
      return
    }
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setItemsVisible(true)))
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("keydown", onKey)
    return () => {
      cancelAnimationFrame(id)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const closeAnd = (fn?: () => void) => () => {
    setOpen(false)
    fn?.()
  }

  return (
    <>
      <header
        className={`safe-top sticky top-0 z-50 transition-all duration-200 ${
          scrolled
            ? "border-b border-[color:var(--border-subtle)] bg-[var(--bg-0)]/72 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-[clamp(1.5rem,5vw,5rem)] py-2.5">
          <Brand />

          <nav className="hidden items-center gap-7 md:flex">
            {items.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-underline text-[13px] font-medium uppercase tracking-[0.1em] transition-colors duration-150 ${
                    active ? "is-active text-[color:var(--cyan)]" : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            {loggedIn ? (
              <div className="hidden items-center gap-5 sm:flex">
                <Link
                  href="/profil"
                  className="nav-underline text-[13px] font-medium uppercase tracking-[0.1em] text-[color:var(--text-secondary)] transition-colors duration-150 hover:text-[color:var(--text-primary)]"
                >
                  Profil
                </Link>
                <LogoutButton variant="flat" />
              </div>
            ) : (
              <Link
                href="/login"
                className="tap hidden items-center rounded-full bg-[var(--cyan)] px-4 text-sm font-semibold text-[color:var(--on-accent)] transition-transform duration-150 hover:scale-[1.03] sm:inline-flex"
              >
                Zaloguj
              </Link>
            )}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Zamknij menu" : "Otwórz menu"}
              aria-expanded={open}
              className="tap grid place-items-center rounded-lg border border-[color:var(--border-subtle)] bg-[var(--bg-1)]/80 backdrop-blur md:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="safe-top fixed inset-0 z-[60] flex flex-col bg-[var(--bg-0)]/97 backdrop-blur-2xl md:hidden">
          <div className="flex items-center justify-between px-4 py-2.5">
            <Brand href="/" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Zamknij menu"
              className="tap grid place-items-center rounded-lg border border-[color:var(--border-subtle)] bg-[var(--bg-1)]/80"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col justify-center gap-1 px-6">
            {items.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeAnd()}
                className={`menu-item ${itemsVisible ? "is-visible" : ""} py-2 text-[2rem] font-semibold leading-tight tracking-tight transition-colors active:text-[color:var(--cyan)] ${
                  isActive(item.href) ? "text-[color:var(--cyan)]" : "text-[color:var(--text-primary)]"
                }`}
                style={{ "--i": i } as React.CSSProperties}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={loggedIn ? "/profil" : "/login"}
              onClick={closeAnd()}
              className={`menu-item ${itemsVisible ? "is-visible" : ""} mt-4 inline-flex w-fit items-center rounded-full bg-[var(--cyan)] px-6 py-3 text-base font-semibold text-[color:var(--on-accent)]`}
              style={{ "--i": items.length } as React.CSSProperties}
            >
              {loggedIn ? "Mój panel" : "Zaloguj"}
            </Link>
            {loggedIn && (
              <div
                className={`menu-item ${itemsVisible ? "is-visible" : ""} mt-1`}
                style={{ "--i": items.length + 1 } as React.CSSProperties}
                onClick={closeAnd()}
              >
                <LogoutButton variant="flat-lg" />
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
