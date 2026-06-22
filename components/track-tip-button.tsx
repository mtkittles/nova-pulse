"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, Loader2, Plus, X } from "lucide-react"

export interface TrackTipData {
  event_id: string | number
  bet_type: string
  bet_side: string
  odds: number | null
  home_team: string
  away_team: string
  match_date: string | null
  league_code: string
}

type Status = "idle" | "loading" | "tracked" | "error"

// Przycisk "Śledź typ" — zapis przez /api/track-tip (sesja + klucz po stronie serwera).
// variant "full" = przycisk z tekstem (/mecz); "icon" = kompaktowa ikonka (/typy).
export function TrackTipButton({
  data,
  loggedIn,
  tracked = false,
  variant = "full",
}: {
  data: TrackTipData
  loggedIn: boolean
  tracked?: boolean
  variant?: "full" | "icon"
}) {
  const [status, setStatus] = useState<Status>(tracked ? "tracked" : "idle")
  const [needLogin, setNeedLogin] = useState(false)

  async function onTrack(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (status === "loading" || status === "tracked") return
    if (!loggedIn) {
      setNeedLogin(true)
      window.setTimeout(() => setNeedLogin(false), 4000)
      return
    }
    setStatus("loading")
    try {
      const res = await fetch("/api/track-tip", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          event_id: data.event_id,
          bet_type: data.bet_type,
          bet_side: data.bet_side,
          odds: data.odds,
          home_team: data.home_team,
          away_team: data.away_team,
          match_date: data.match_date,
          league_code: data.league_code,
        }),
      })
      if (!res.ok) throw new Error(`track ${res.status}`)
      setStatus("tracked")
    } catch {
      setStatus("error")
    }
  }

  // ── wariant ikonki (kompaktowy, /typy) ───────────────────────────────
  if (variant === "icon") {
    const cls =
      status === "tracked"
        ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
        : status === "error"
          ? "border-rose-400/40 bg-rose-400/10 text-rose-300"
          : "border-white/15 bg-white/[0.04] text-white/60 hover:bg-white/10 hover:text-white"
    return (
      <span className="relative">
        <button
          type="button"
          onClick={onTrack}
          disabled={status === "loading"}
          aria-label={status === "tracked" ? "Typ śledzony" : "Śledź typ"}
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border transition ${cls}`}
        >
          {status === "loading" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : status === "tracked" ? (
            <Check className="h-3.5 w-3.5" />
          ) : status === "error" ? (
            <X className="h-3.5 w-3.5" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
        </button>
        {needLogin && <LoginHint />}
      </span>
    )
  }

  // ── wariant pełny (z tekstem, /mecz) ─────────────────────────────────
  const label =
    status === "tracked" ? "Śledzony" : status === "loading" ? "Zapisywanie…" : status === "error" ? "Błąd — spróbuj ponownie" : "Śledź typ"
  const cls =
    status === "tracked"
      ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
      : status === "error"
        ? "border-rose-400/40 bg-rose-400/10 text-rose-300 hover:bg-rose-400/15"
        : "border-[color:var(--border-soft)] bg-[var(--surface-2)] text-[color:var(--text-secondary)] hover:bg-[var(--surface-3)] hover:text-[color:var(--text-primary)]"
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={onTrack}
        disabled={status === "loading" || status === "tracked"}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${cls}`}
      >
        {status === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : status === "tracked" ? (
          <Check className="h-4 w-4" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        {label}
      </button>
      {needLogin && <LoginHint />}
    </span>
  )
}

function LoginHint() {
  return (
    <span className="absolute left-1/2 top-[calc(100%+8px)] z-40 w-56 -translate-x-1/2 rounded-xl border border-[color:var(--border-soft)] bg-[var(--bg-soft)] px-3 py-2 text-center text-xs text-[color:var(--text-secondary)] shadow-xl">
      Zaloguj przez Telegram, żeby śledzić typy.{" "}
      <Link href="/login" className="font-semibold text-[color:var(--cyan)] hover:underline">
        Zaloguj się
      </Link>
    </span>
  )
}
