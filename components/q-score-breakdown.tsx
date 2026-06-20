import { Check, X } from "lucide-react"
import type { QScoreBreakdown } from "@/lib/extra-types"
import { qScoreColor } from "@/lib/design"
import { QScoreRing } from "./ui/q-score-ring"
import { Card } from "./ui/card"

// Sekcja [H] — rozbicie Q-Score na czynniki dodatnie/ujemne.
export function QScoreBreakdownCard({ breakdown }: { breakdown: QScoreBreakdown }) {
  const positives = breakdown.factors.filter((f) => f.delta > 0).sort((a, b) => b.delta - a.delta)
  const negatives = breakdown.factors.filter((f) => f.delta < 0).sort((a, b) => a.delta - b.delta)
  const total = Math.max(0, Math.min(100, breakdown.total))
  const color = qScoreColor(total)
  const posSum = positives.reduce((a, f) => a + f.delta, 0)
  const negSum = negatives.reduce((a, f) => a + Math.abs(f.delta), 0)

  return (
    <Card hover={false}>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">Analiza Q-Score</h2>

      <div className="flex items-center gap-4">
        <QScoreRing value={total} size={88} stroke={6} />
        <div>
          <p className="text-2xl font-bold tnum" style={{ color }}>
            {Math.round(total)} <span className="text-base font-medium text-[color:var(--text-muted)]">/ 100</span>
          </p>
          <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">jakość sygnału modelu</p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {positives.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--success)]">
              <Check className="h-3.5 w-3.5" /> Na plus
            </p>
            <ul className="space-y-1.5">
              {positives.map((f, i) => (
                <li key={i} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate text-[color:var(--text-secondary)]">{f.label}</span>
                  <span className="shrink-0 font-semibold tnum text-[color:var(--success)]">+{f.delta}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {negatives.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--danger)]">
              <X className="h-3.5 w-3.5" /> Na minus
            </p>
            <ul className="space-y-1.5">
              {negatives.map((f, i) => (
                <li key={i} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate text-[color:var(--text-secondary)]">{f.label}</span>
                  <span className="shrink-0 font-semibold tnum text-[color:var(--danger)]">{f.delta}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* pasek postępu */}
      <div className="mt-5">
        <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-3)]">
          <div className="h-full rounded-full transition-all" style={{ width: `${total}%`, background: color }} />
        </div>
        <p className="mt-2 text-center text-xs text-[color:var(--text-muted)]">
          Baza {breakdown.base} + {posSum} − {negSum} ={" "}
          <span className="font-semibold" style={{ color }}>{Math.round(breakdown.total)}</span>
        </p>
      </div>
    </Card>
  )
}
