"use client"

import { qScoreColor } from "@/lib/design"
import { useInViewOnce } from "@/hooks/use-scroll-animation"

// QScoreRing — pierścień Q-Score. Kolor wg progów:
// <50 szary · 50–70 żółty · 70–85 cyan · 85+ zielony.
//
// Dorysowuje się (stroke-dashoffset: pełny obwód → docelowy) przy wejściu
// w viewport — ta sama konwencja obserwatora co ScrollReveal (threshold
// 0.1, rootMargin -40px od dołu), tylko raz, bez JS-owego RAF (czysty
// CSS transition na zmianę atrybutu).
export function QScoreRing({
  value,
  size = 56,
  stroke = 5,
  label = "Q",
}: {
  value: number | null
  size?: number
  stroke?: number
  label?: string
}) {
  const v = Math.max(0, Math.min(100, value != null && Number.isFinite(value) ? value : 0))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const color = qScoreColor(v)
  const targetOffset = c - (v / 100) * c

  const [ref, drawn] = useInViewOnce<SVGCircleElement>()

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle
          ref={ref}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={drawn ? targetOffset : c}
          style={{ transition: "stroke-dashoffset 500ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center leading-none">
          <div className="font-bold tnum" style={{ fontSize: size * 0.3, color }}>
            {value != null ? Math.round(v) : "—"}
          </div>
          <div className="mt-0.5 uppercase tracking-wider text-[color:var(--text-muted)]" style={{ fontSize: size * 0.14 }}>
            {label}
          </div>
        </div>
      </div>
    </div>
  )
}
