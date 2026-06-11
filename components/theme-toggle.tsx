"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

type Theme = "dark" | "light"

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const current = (document.documentElement.dataset.theme as Theme) || "dark"
    setTheme(current)
  }, [])

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark"
    setTheme(next)
    document.documentElement.dataset.theme = next
    // zapis w cookie (SSR-friendly, bez localStorage)
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Przełącz na motyw jasny" : "Przełącz na motyw ciemny"}
      className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white/10 px-4 py-2.5 text-sm font-medium text-[color:var(--text)] backdrop-blur transition hover:bg-white/15"
    >
      {mounted && theme === "dark" ? (
        <Sun className="h-4 w-4 text-[color:var(--accent)]" />
      ) : (
        <Moon className="h-4 w-4 text-[color:var(--accent)]" />
      )}
      <span className="hidden sm:inline">
        {mounted ? (theme === "dark" ? "Jasny" : "Ciemny") : "Motyw"}
      </span>
    </button>
  )
}
