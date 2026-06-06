"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

const BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "lupus_bet_bot"

type TelegramUser = Record<string, unknown> & { hash?: string }

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramUser) => void
  }
}

// Renderuje oficjalny Telegram Login Widget i przekazuje dane do /api/auth/telegram.
// Widget działa TYLKO na domenie ustawionej w BotFather (/setdomain).
export function TelegramLogin({ redirectTo = "/stats" }: { redirectTo?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.onTelegramAuth = async (user: TelegramUser) => {
      setStatus("loading")
      setError(null)
      try {
        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(user),
        })
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(body.error || "Logowanie nie powiodło się.")
        }
        router.push(redirectTo)
        router.refresh()
      } catch (e) {
        setStatus("error")
        setError(e instanceof Error ? e.message : "Logowanie nie powiodło się.")
      }
    }

    const container = ref.current
    const script = document.createElement("script")
    script.src = "https://telegram.org/js/telegram-widget.js?22"
    script.async = true
    script.setAttribute("data-telegram-login", BOT)
    script.setAttribute("data-size", "large")
    script.setAttribute("data-radius", "20")
    script.setAttribute("data-request-access", "write")
    script.setAttribute("data-onauth", "onTelegramAuth(user)")
    container?.appendChild(script)

    return () => {
      if (container) container.innerHTML = ""
      delete window.onTelegramAuth
    }
  }, [redirectTo, router])

  return (
    <div>
      <div ref={ref} className="flex min-h-[48px] justify-center" />
      {status === "loading" && (
        <p className="mt-2 text-center text-sm text-white/55">Logowanie…</p>
      )}
      {status === "error" && error && (
        <p className="mt-2 text-center text-sm text-rose-300">{error}</p>
      )}
    </div>
  )
}
