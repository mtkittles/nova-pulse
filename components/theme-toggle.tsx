"use client"

import { useEffect, useState } from "react"
import { Palette } from "lucide-react"

type Theme = "nova" | "lupus"

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("nova")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const current = (document.documentElement.dataset.theme as Theme) || "nova"
    setTheme(current)
  }, [])

  function toggle() {
    const next: Theme = theme === "nova" ? "lupus" : "nova"
    setTheme(next)
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem("lupus-theme", next)
    } catch {
      /* brak localStorage — trudno */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Zmień motyw kolorystyczny"
      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur transition hover:bg-white/15"
    >
      <Palette className="h-4 w-4 text-[color:var(--accent)]" />
      <span className="hidden sm:inline">
        {mounted ? (theme === "nova" ? "Motyw: Nova" : "Motyw: Lupus") : "Motyw"}
      </span>
    </button>
  )
}
