import { qScoreColor } from "@/lib/design"

// QScoreRing — pierścień Q-Score. Kolor wg progów:
// <50 szary · 50–70 żółty · 70–85 cyan · 85+ zielony.
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
  const offset = c - (v / 100) * c

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.9s ease" }}
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
