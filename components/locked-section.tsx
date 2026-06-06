import Link from "next/link"
import { Lock } from "lucide-react"

// Zasłona dla treści dostępnej po zalogowaniu (gating free).
export function LockedSection({
  title = "Pełne statystyki po zalogowaniu",
  desc = "Zaloguj się przez Telegram (za darmo), aby odblokować wykresy, historię i filtry.",
}: {
  title?: string
  desc?: string
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.8rem] border border-white/12 bg-white/[0.04] p-10">
      {/* rozmyte "atrapy" wykresów w tle */}
      <div className="pointer-events-none absolute inset-0 grid grid-cols-2 gap-5 p-6 opacity-30 blur-md">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 rounded-2xl border border-white/10 bg-white/[0.06]" />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-md text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-[color:var(--accent)]/30 bg-[var(--accent)]/10 text-[color:var(--accent)]">
          <Lock className="h-6 w-6" />
        </div>
        <h3 className="text-2xl font-semibold">{title}</h3>
        <p className="mt-3 leading-7 text-white/60">{desc}</p>
        <Link
          href="/login"
          className="mt-7 inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-[color:var(--on-accent)] transition hover:scale-105"
        >
          Zaloguj przez Telegram
        </Link>
      </div>
    </div>
  )
}
