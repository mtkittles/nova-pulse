"use client"

import { useInViewOnce } from "@/hooks/use-scroll-animation"

// Brak metryki "średnia bukmacherska" w danych demo — jawnie oznaczona jako
// szacunkowa referencja branżowa, nie realny pomiar.
const BOOKMAKER_AVG_PCT = 52.5

/**
 * "Model vs punkt odniesienia" — trzy poziome słupki: rzut monetą (50%,
 * neutralny punkt odniesienia), średnia bukmacherska (szacunek branżowy) i
 * realna skuteczność modelu z danych demo. Słupki rysują się od zera przy
 * wejściu w viewport — ta sama konwencja co pozostałe wykresy landingu.
 */
export function BaselineComparison({ winRate }: { winRate: number }) {
  const [ref, inView] = useInViewOnce<HTMLDivElement>()
  const modelPct = Math.max(0, Math.min(100, winRate * 100))

  const rows: { label: string; value: number; note: string; barCls: string; valueCls: string }[] = [
    { label: "Rzut monetą", value: 50, note: "punkt odniesienia", barCls: "bg-[color:var(--border-subtle)]", valueCls: "text-[color:var(--text-secondary)]" },
    {
      label: "Średnia bukmacherska",
      value: BOOKMAKER_AVG_PCT,
      note: "szacunkowa referencja branżowa",
      barCls: "bg-white/[0.16]",
      valueCls: "text-[color:var(--text-secondary)]",
    },
    {
      label: "Model Lupus Pred",
      value: modelPct,
      note: "realna skuteczność, dane demo",
      barCls: "bg-[var(--cyan)]",
      valueCls: "text-[color:var(--cyan)]",
    },
  ]

  return (
    <div ref={ref} className="glass-solid rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-1)] p-5">
      <p className="mb-4 text-sm font-semibold text-[color:var(--text-primary)]">Model vs punkt odniesienia</p>
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-[color:var(--text-primary)]">{row.label}</span>
              <span className={`tnum text-sm font-semibold ${row.valueCls}`}>{row.value.toFixed(1)}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className={`baseline-bar h-full rounded-full ${row.barCls}`}
                style={{ width: inView ? `${row.value}%` : "0%" }}
              />
            </div>
            <p className="mt-1 text-[11px] text-[color:var(--text-muted)]">{row.note}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 border-t border-[color:var(--border-subtle)] pt-3 text-xs leading-5 text-[color:var(--text-muted)]">
        Metodologia: skuteczność = odsetek rozliczonych typów trafionych. „Rzut monetą" to matematyczny punkt
        odniesienia (50%), „średnia bukmacherska" to szacunkowa referencja branżowa (nie pomiar z danych demo) —
        wartość modelu pochodzi z realnych, rozliczonych typów w trybie demonstracyjnym.
      </p>
    </div>
  )
}
