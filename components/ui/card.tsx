import type { ReactNode } from "react"

// Card — powierzchnia szklana (glassmorphism: rgba niskiej alfy + backdrop-
// blur, żeby ambientowe tło przebijało), border-soft, radius z tokenu,
// subtelny hover. `active` (rekomendacja) → delikatny gradient cyan +
// mocniejsze obramowanie. `dense` (tabele/wykresy z liczbami) → mocniejsza,
// prawie kryjąca alfa i słabszy blur — czytelność danych ważniejsza niż
// efekt. Bez mocnych cieni (flat, premium).
export function Card({
  children,
  active = false,
  hover = true,
  dense = false,
  className = "",
}: {
  children: ReactNode
  active?: boolean
  hover?: boolean
  dense?: boolean
  className?: string
}) {
  const base = "relative rounded-[var(--radius-card)] border p-5 transition duration-300"
  const surface = dense
    ? "glass-solid border-[color:var(--border-subtle)]"
    : "border-[color:var(--border-soft)] bg-[rgba(12,19,27,0.6)] backdrop-blur-md backdrop-saturate-[1.2]"
  const tone = active ? "border-[color:var(--border-strong)] bg-[linear-gradient(160deg,var(--cyan-soft),transparent_60%)]" : ""
  const hov = hover ? "hover:-translate-y-0.5 hover:bg-[var(--surface-2)]" : ""
  return <div className={`${base} ${surface} ${tone} ${hov} ${className}`}>{children}</div>
}
