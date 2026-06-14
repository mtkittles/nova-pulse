import type { ReactNode } from "react"

// Badge — kolory wg zasad Graphite Night: zielony=trafiony/pozytyw,
// czerwony=błąd/nietrafiony, żółty=ostrzeżenie, cyan=marka/info, szary=neutral.
export type BadgeTone = "neutral" | "cyan" | "success" | "warning" | "danger" | "info"

const TONES: Record<BadgeTone, string> = {
  neutral: "border-[color:var(--border-soft)] bg-[var(--surface-2)] text-[color:var(--text-secondary)]",
  cyan: "border-[color:var(--border-strong)] bg-[var(--cyan-soft)] text-[color:var(--cyan)]",
  success: "border-[color:var(--success)]/35 bg-[color:var(--success)]/12 text-[color:var(--success)]",
  warning: "border-[color:var(--warning)]/35 bg-[color:var(--warning)]/12 text-[color:var(--warning)]",
  danger: "border-[color:var(--danger)]/35 bg-[color:var(--danger)]/12 text-[color:var(--danger)]",
  info: "border-[color:var(--info)]/35 bg-[color:var(--info)]/12 text-[color:var(--info)]",
}

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
