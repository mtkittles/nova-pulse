"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

export function LogoutButton() {
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

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white/80 backdrop-blur transition hover:bg-white/15 disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">Wyloguj</span>
    </button>
  )
}
