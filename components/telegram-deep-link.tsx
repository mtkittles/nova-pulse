"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Send } from "lucide-react"

export function TelegramDeepLinkLogin({ redirectTo = "/stats" }: { redirectTo?: string }) {
  const router = useRouter()
  const pollRef = useRef<number | null>(null)
  const tokenRef = useRef<string | null>(null)
  const [phase, setPhase] = useState<"idle" | "waiting">("idle")
  const [error, setError] = useState<string | null>(null)

  function stop() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  useEffect(() => () => stop(), [])

  async function start() {
    setError(null)
    try {
      const res = await fetch("/api/auth/start")
      const j = await res.json()
      if (!res.ok || !j?.url || !j?.token) {
        throw new Error(j?.error || "Nie udało się utworzyć linku logowania.")
      }
      tokenRef.current = j.token
      setPhase("waiting")
      // Otwórz Telegrama — na iOS/Android otworzy aplikację.
      window.open(j.url, "_blank")

      // Polling co 2s, max 5 minut.
      const started = Date.now()
      pollRef.current = window.setInterval(async () => {
        if (Date.now() - started > 5 * 60 * 1000) {
          stop()
          setPhase("idle")
          setError("Sesja logowania wygasła. Spróbuj ponownie.")
          return
        }
        try {
          const r = await fetch(`/api/auth/poll?token=${tokenRef.current}`)
          const d = await r.json()
          if (d?.status === "done") {
            stop()
            router.push(redirectTo)
            router.refresh()
          }
        } catch {
          /* ignoruj — kolejna próba */
        }
      }, 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Logowanie nie powiodło się.")
      setPhase("idle")
    }
  }

  return (
    <div>
      {phase === "idle" ? (
        <button
          type="button"
          onClick={start}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#229ED9] px-6 py-3 font-semibold text-white transition hover:scale-[1.02]"
        >
          <Send className="h-4 w-4" />
          Otwórz w aplikacji Telegram
        </button>
      ) : (
        <div className="rounded-2xl border border-[color:var(--accent)]/25 bg-[var(--accent)]/10 p-4 text-center">
          <p className="text-sm text-white/80">
            Otwórz Telegram i naciśnij <strong>START</strong> w bocie. Wracamy tu automatycznie…
          </p>
          <p className="mt-2 text-xs text-white/45">Czekamy na potwierdzenie (do 5 min).</p>
          <button
            type="button"
            onClick={() => {
              stop()
              setPhase("idle")
            }}
            className="mt-3 text-xs text-white/55 underline hover:text-white"
          >
            Anuluj
          </button>
        </div>
      )}
      {error && <p className="mt-3 text-center text-sm text-rose-300">{error}</p>}
    </div>
  )
}
