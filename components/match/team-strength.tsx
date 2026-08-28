type FormResult = "W" | "D" | "L"

function pointsSum(form: FormResult[]): number {
  return form.reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0)
}

// Jedyny dopuszczalny wyjątek od mono-cyan (jak "Ostatnio rozliczone") —
// czytelność W/R/P w sparklinie ważniejsza niż spójność jednego akcentu.
const DOT_COLOR: Record<FormResult, string> = {
  W: "var(--success)",
  D: "var(--text-muted)",
  L: "var(--danger)",
}

function FormDots({ form }: { form: FormResult[] }) {
  // form[0] = najnowszy → odwracamy do chronologii (najstarszy z lewej, jak FormSparkline).
  const chrono = [...form].reverse()
  return (
    <div className="flex items-center gap-1" title={`Forma: ${chrono.join("")}`}>
      {chrono.map((r, i) => (
        <span key={i} className="h-2 w-2 rounded-full" style={{ backgroundColor: DOT_COLOR[r] }} />
      ))}
    </div>
  )
}

function ComparisonBar({
  label,
  homeVal,
  awayVal,
  format,
}: {
  label: string
  homeVal: number
  awayVal: number
  format: (v: number) => string
}) {
  const max = Math.max(homeVal, awayVal, 0.0001)
  const homeWidth = Math.max(2, (homeVal / max) * 100)
  const awayWidth = Math.max(2, (awayVal / max) * 100)
  const homeStronger = homeVal >= awayVal

  return (
    <div>
      <p className="mb-1.5 text-center text-[11px] uppercase tracking-wide text-[color:var(--text-muted)]">{label}</p>
      <div className="flex items-center gap-2.5">
        <span className="w-11 shrink-0 text-right text-sm font-semibold tnum">{format(homeVal)}</span>
        <div className="flex h-2 flex-1 items-center">
          <div className="flex h-full flex-1 justify-end overflow-hidden rounded-l-full bg-[var(--bg-0)]">
            <div
              className="h-full rounded-l-full"
              style={{ width: `${homeWidth}%`, backgroundColor: homeStronger ? "var(--cyan)" : "var(--border-subtle)" }}
            />
          </div>
          <div className="mx-[2px] h-3 w-px shrink-0 bg-[color:var(--border-subtle)]" />
          <div className="flex h-full flex-1 justify-start overflow-hidden rounded-r-full bg-[var(--bg-0)]">
            <div
              className="h-full rounded-r-full"
              style={{ width: `${awayWidth}%`, backgroundColor: !homeStronger ? "var(--cyan)" : "var(--border-subtle)" }}
            />
          </div>
        </div>
        <span className="w-11 shrink-0 text-sm font-semibold tnum">{format(awayVal)}</span>
      </div>
    </div>
  )
}

/**
 * Elo + forma — dwustronny pasek porównawczy (jak FotMob), środek = punkt
 * zero. Trzy metryki: Elo, suma punktów z ostatnich 5, średnia goli
 * strzelonych. Silniejsza strona w danej metryce = cyan, słabsza = neutralny
 * border-subtle. Pod nazwami drużyn — sparkline formy (5 kropek, jedyny
 * wyjątek od mono-cyan w tym module).
 */
export function TeamStrength({
  homeTeam,
  awayTeam,
  homeElo,
  awayElo,
  homeForm5,
  awayForm5,
  homeGfAvg,
  awayGfAvg,
}: {
  homeTeam: string
  awayTeam: string
  homeElo: number
  awayElo: number
  homeForm5: FormResult[]
  awayForm5: FormResult[]
  homeGfAvg: number
  awayGfAvg: number
}) {
  return (
    <div className="glass-solid rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-1)] p-4 md:p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
        Siła drużyn
      </h2>

      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[color:var(--text-primary)]">{homeTeam}</p>
          <div className="mt-1.5">
            <FormDots form={homeForm5} />
          </div>
        </div>
        <span className="shrink-0 text-xs text-[color:var(--text-muted)]">vs</span>
        <div className="min-w-0 text-right">
          <p className="truncate text-sm font-semibold text-[color:var(--text-primary)]">{awayTeam}</p>
          <div className="mt-1.5 flex justify-end">
            <FormDots form={awayForm5} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <ComparisonBar label="Elo" homeVal={homeElo} awayVal={awayElo} format={(v) => Math.round(v).toString()} />
        <ComparisonBar
          label="Forma (5 meczów)"
          homeVal={pointsSum(homeForm5)}
          awayVal={pointsSum(awayForm5)}
          format={(v) => `${v} pkt`}
        />
        <ComparisonBar
          label="Śr. goli strzelonych"
          homeVal={homeGfAvg}
          awayVal={awayGfAvg}
          format={(v) => v.toFixed(2)}
        />
      </div>
    </div>
  )
}
