import type { LucideIcon } from "lucide-react"
import { Button } from "./button"

// EmptyState — ikona + tytuł + opis + opcjonalny CTA.
export function EmptyState({
  icon: Icon,
  title,
  description,
  cta,
  className = "",
}: {
  icon?: LucideIcon
  title: string
  description?: string
  cta?: { label: string; href?: string; onClick?: () => void }
  className?: string
}) {
  return (
    <div
      className={`grid place-items-center rounded-[var(--radius-card)] border border-[color:var(--border-soft)] bg-[var(--surface-1)] p-10 text-center ${className}`}
    >
      <div className="max-w-md">
        {Icon && (
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-2)] text-[color:var(--text-secondary)]">
            <Icon className="h-6 w-6" />
          </div>
        )}
        <h3 className="text-xl font-semibold text-[color:var(--text-primary)]">{title}</h3>
        {description && <p className="mt-2 text-[color:var(--text-secondary)]">{description}</p>}
        {cta && (
          <div className="mt-6">
            <Button href={cta.href} onClick={cta.onClick} size="md">
              {cta.label}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
