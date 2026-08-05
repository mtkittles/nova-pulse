"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Brand } from "../brand"
import { LogoutButton } from "../logout-button"

const NAV = [
  { label: "Dziś", href: "#dzis" },
  { label: "Forma", href: "#forma" },
  { label: "Typy", href: "/typy" },
  { label: "Live", href: "/live" },
  { label: "Statystyki", href: "/stats" },
]

/**
 * Kompaktowy sticky header. Tło przezroczyste na górze strony, po scrollu
 * dostaje blur + obramowanie — dzięki temu nie „pływa" nad treścią.
 *
 * Mobile: hamburger otwiera pełnoekranowy overlay z dużą typografią i
 * kaskadowym wjazdem pozycji (stagger 50ms, sterowane klasą `.menu-item`
 * z CSS — patrz globals.css).
 */
export function LandingHeader({ loggedIn }: { loggedIn: boolean }) {
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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 md:px-6">
          {/* ten sam lockup co w AppNav — poziomy PNG ma wypalone ciemne tło,
              które na --bg-0 czytało się jako prostokąt wokół logo */}
          <Brand />

          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="nav-underline text-[13px] font-medium uppercase tracking-[0.1em] text-[color:var(--text-secondary)] transition-colors duration-150 hover:text-[color:var(--text-primary)]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={loggedIn ? "/profil" : "/login"}
              className="tap hidden items-center rounded-full bg-[var(--cyan)] px-4 text-sm font-semibold text-[color:var(--on-accent)] transition-transform duration-150 hover:scale-[1.03] sm:inline-flex"
            >
              {loggedIn ? "Mój panel" : "Zaloguj"}
            </Link>
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
            {NAV.map((item, i) => (
              <a
                key={item.href}
                href={item.href}
                onClick={closeAnd()}
                className={`menu-item ${itemsVisible ? "is-visible" : ""} py-2 text-[2rem] font-semibold leading-tight tracking-tight text-[color:var(--text-primary)] transition-colors active:text-[color:var(--cyan)]`}
                style={{ "--i": i } as React.CSSProperties}
              >
                {item.label}
              </a>
            ))}
            <Link
              href={loggedIn ? "/profil" : "/login"}
              onClick={closeAnd()}
              className={`menu-item ${itemsVisible ? "is-visible" : ""} mt-4 inline-flex w-fit items-center rounded-full bg-[var(--cyan)] px-6 py-3 text-base font-semibold text-[color:var(--on-accent)]`}
              style={{ "--i": NAV.length } as React.CSSProperties}
            >
              {loggedIn ? "Mój panel" : "Zaloguj"}
            </Link>
            {loggedIn && (
              <div
                className={`menu-item ${itemsVisible ? "is-visible" : ""} mt-1`}
                style={{ "--i": NAV.length + 1 } as React.CSSProperties}
                onClick={closeAnd()}
              >
                <LogoutButton />
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
