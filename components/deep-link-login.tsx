"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Send } from "lucide-react"

const BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "lupus_bet_bot"

type Phase = "idle" | "waiting" | "expired"

export function DeepLinkLogin({ token, redirectTo = "/stats" }: { token: string; redirectTo?: string }) {
  const [phase, setPhase] = useState<Phase>("idle")
  const router = useRouter()
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  useEffect(() => () => stopPolling(), [])

  const openTelegram = () =>
    window.open(`https://t.me/${BOT}?start=lb_${token}`, "_blank", "noopener")

  const startLogin = () => {
    setPhase("waiting")
    openTelegram()

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/check?token=${token}`)
        const data = (await res.json()) as { ok: boolean; redirect?: string; expired?: boolean }

        if (data.ok && data.redirect) {
          stopPolling()
          router.push(data.redirect)
          router.refresh()
          return
        }
        if (data.expired) {
          stopPolling()
          setPhase("expired")
        }
      } catch {
        // brak sieci — czekamy
      }
    }, 2000)
  }

  if (phase === "waiting") {
    return (
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-2 py-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#229ED9] [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#229ED9] [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#229ED9] [animation-delay:300ms]" />
        </div>
        <p className="text-sm text-white/55">Czekamy na potwierdzenie w Telegramie…</p>
        <button
          onClick={openTelegram}
          className="text-xs text-white/60 underline underline-offset-2 hover:text-white/70"
        >
          Otwórz Telegram ponownie
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {phase === "expired" && (
        <p className="text-center text-sm text-amber-300">
          Link wygasł. Odśwież stronę i spróbuj ponownie.
        </p>
      )}
      <button
        onClick={startLogin}
        className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#229ED9] px-6 py-3.5 font-semibold text-white transition hover:brightness-110 active:scale-95"
      >
        <Send className="h-5 w-5" />
        Zaloguj przez Telegram
      </button>
    </div>
  )
}
