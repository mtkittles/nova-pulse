"use client"

import { useState } from "react"
import { RefreshCw, ShieldCheck } from "lucide-react"

export function AdminPanel({ name }: { name: string }) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)

  async function refresh() {
    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch("/api/admin/refresh", { method: "POST" })
      const j = await res.json().catch(() => ({}))
      if (res.ok) {
        setStatus({ ok: true, text: "Odświeżanie uruchomione na Oracle." })
      } else {
        setStatus({ ok: false, text: j?.error || `Błąd (${res.status}).` })
      }
    } catch (e) {
      setStatus({ ok: false, text: e instanceof Error ? e.message : "Błąd połączenia." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--accent)]/30 bg-[var(--accent)]/10 text-[color:var(--accent)]">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Panel admina</h1>
          <p className="text-sm text-white/50">Zalogowany jako {name}</p>
        </div>
      </div>

      <div className="max-w-xl rounded-[2rem] border border-white/12 bg-white/[0.05] p-7 backdrop-blur">
        <h2 className="text-xl font-semibold">Dane Oracle</h2>
        <p className="mt-2 text-white/55">
          Ręcznie wymuś ponowne przeliczenie i import danych po stronie bota.
        </p>

        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-[color:var(--on-accent)] transition hover:scale-105 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Odświeżanie…" : "Odśwież dane teraz"}
        </button>

        {status && (
          <p
            className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
              status.ok
                ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200"
                : "border-rose-300/30 bg-rose-300/10 text-rose-200"
            }`}
          >
            {status.ok ? "✅ " : "❌ "}
            {status.text}
          </p>
        )}
      </div>
    </div>
  )
}
