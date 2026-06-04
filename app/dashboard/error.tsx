"use client"

import Link from "next/link"
import { AlertTriangle, RotateCw } from "lucide-react"

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--bg)] px-6 text-white">
      <div className="w-full max-w-md rounded-[2rem] border border-white/12 bg-white/[0.05] p-8 text-center backdrop-blur">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-amber-300/30 bg-amber-300/10 text-amber-300">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold">Nie udało się pobrać typów</h1>
        <p className="mt-3 leading-7 text-white/60">
          API bota jest chwilowo niedostępne. Spróbuj ponownie za moment.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-[color:var(--on-accent)] transition hover:scale-105"
          >
            <RotateCw className="h-4 w-4" />
            Spróbuj ponownie
          </button>
          <Link
            href="/"
            className="rounded-full border border-white/15 bg-white/10 px-6 py-3 font-semibold backdrop-blur transition hover:bg-white/15"
          >
            Strona główna
          </Link>
        </div>
      </div>
    </main>
  )
}
