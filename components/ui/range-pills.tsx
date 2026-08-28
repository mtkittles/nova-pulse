"use client"

// Przełącznik zakresu w stylu Robinhood (LIVE/1D/1W/1M): aktywny = subtelne
// wypełnienie, reszta to sam tekst — nie osobne obramowane przyciski.
export interface RangeOption<T extends string> {
  key: T
  label: string
}

export function RangePills<T extends string>({
  value,
  options,
  onChange,
  className = "",
}: {
  value: T
  options: readonly RangeOption<T>[]
  onChange: (key: T) => void
  className?: string
}) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          aria-pressed={value === opt.key}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-150 ${
            value === opt.key
              ? "bg-[var(--cyan-soft)] text-[color:var(--cyan)]"
              : "text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
