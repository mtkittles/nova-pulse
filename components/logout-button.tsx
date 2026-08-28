"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

export function LogoutButton({ variant = "solid" }: { variant?: "solid" | "flat" | "flat-lg" }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function logout() {
    setLoading(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  // header desktop: link tekstowy w tym samym stylu co reszta nav (uppercase, tracking)
  if (variant === "flat") {
    return (
      <button
        type="button"
        onClick={logout}
        disabled={loading}
        aria-label="Wyloguj"
        className="nav-underline text-[13px] font-medium uppercase tracking-[0.1em] text-[color:var(--text-secondary)] transition-colors duration-150 hover:text-[color:var(--text-primary)] disabled:opacity-60"
      >
        Wyloguj
      </button>
    )
  }

  // header mobile: pozycja w pełnoekranowym menu, ta sama typografia co linki nav (duży tekst)
  if (variant === "flat-lg") {
    return (
      <button
        type="button"
        onClick={logout}
        disabled={loading}
        aria-label="Wyloguj"
        className="py-2 text-[2rem] font-semibold leading-tight tracking-tight text-[color:var(--text-primary)] transition-colors active:text-[color:var(--cyan)] disabled:opacity-60"
      >
        Wyloguj
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      aria-label="Wyloguj"
      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white/80 backdrop-blur transition hover:bg-white/15 disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">Wyloguj</span>
    </button>
  )
}
