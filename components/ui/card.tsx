import type { ReactNode } from "react"

// Card — powierzchnia surface-1, border-soft, radius z tokenu, subtelny hover.
// `active` (rekomendacja) → delikatny gradient cyan + mocniejsze obramowanie.
// Bez mocnych cieni (flat, premium).
export function Card({
  children,
  active = false,
  hover = true,
  className = "",
}: {
  children: ReactNode
  active?: boolean
  hover?: boolean
  className?: string
}) {
  const base =
    "relative rounded-[var(--radius-card)] border bg-[var(--surface-1)] p-5 transition duration-300"
  const tone = active
    ? "border-[color:var(--border-strong)] bg-[linear-gradient(160deg,var(--cyan-soft),transparent_60%)]"
    : "border-[color:var(--border-soft)]"
  const hov = hover ? "hover:-translate-y-0.5 hover:bg-[var(--surface-2)]" : ""
  return <div className={`${base} ${tone} ${hov} ${className}`}>{children}</div>
}
