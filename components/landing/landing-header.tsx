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
 */
export function LandingHeader({ loggedIn }: { loggedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <>
      <header
        className={`safe-top sticky top-0 z-50 transition-all duration-200 ${
          scrolled
            ? "border-b border-[color:var(--border-soft)] bg-[var(--bg-0)]/72 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 md:px-6">
          {/* ten sam lockup co w AppNav — poziomy PNG ma wypalone ciemne tło,
              które na --bg-0 czytało się jako prostokąt wokół logo */}
          <Brand />


          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-1.5 text-sm text-[color:var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--surface-2)] hover:text-[color:var(--text-primary)]"
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
              className="tap grid place-items-center rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-1)]/80 backdrop-blur md:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            aria-label="Zamknij menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-[var(--bg-0)]/70 backdrop-blur-sm"
          />
          <nav className="absolute inset-x-4 top-16 grid gap-1 rounded-[var(--radius-card)] border border-[color:var(--border-soft)] bg-[var(--surface-1)] p-3">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="tap flex items-center rounded-xl px-4 text-sm font-medium text-[color:var(--text-secondary)] transition-colors duration-150 active:bg-[var(--surface-2)]"
              >
                {item.label}
              </a>
            ))}
            <Link
              href={loggedIn ? "/profil" : "/login"}
              onClick={() => setOpen(false)}
              className="tap mt-1 flex items-center justify-center rounded-xl bg-[var(--cyan)] text-sm font-semibold text-[color:var(--on-accent)]"
            >
              {loggedIn ? "Mój panel" : "Zaloguj"}
            </Link>
            {loggedIn && (
              <div className="mt-1" onClick={() => setOpen(false)}>
                <LogoutButton />
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
