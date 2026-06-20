import type { SideStats } from "@/lib/extra-types"
import { TeamBadge } from "./team-badge"

const pctTxt = (v: number | null | undefined) => (v != null ? `${Math.round(v)}%` : "—")
const numTxt = (v: number | null | undefined) => (v != null ? v.toFixed(1) : "—")

function StatGrid({ s }: { s: SideStats }) {
  const cells: { label: string; value: string }[] = [
    { label: "Śr. strzelonych", value: numTxt(s.gf_avg) },
    { label: "Śr. straconych", value: numTxt(s.ga_avg) },
    { label: "BTTS", value: pctTxt(s.btts_pct) },
    { label: "Over 1.5", value: pctTxt(s.over15_pct) },
    { label: "Over 2.5", value: pctTxt(s.over25_pct) },
    { label: "Czyste konto", value: pctTxt(s.clean_sheets_pct) },
  ]
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {cells.map((c) => (
        <div key={c.label} className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-2)] p-2.5 text-center">
          <p className="text-[11px] text-[color:var(--text-muted)]">{c.label}</p>
          <p className="mt-0.5 font-semibold tnum">{c.value}</p>
        </div>
      ))}
    </div>
  )
}

function Column({
  name,
  logo,
  side,
  stats,
}: {
  name: string
  logo?: string | null
  side: "u siebie" | "na wyjeździe"
  stats: SideStats
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[color:var(--border-soft)] bg-[var(--surface-1)] p-4">
      <div className="flex min-w-0 items-center gap-2">
        <TeamBadge teamName={name} logoUrl={logo} size="sm" />
        <span className="min-w-0 truncate font-semibold">{name}</span>
        <span className="shrink-0 text-xs text-[color:var(--text-muted)]">({side})</span>
      </div>
      <p className="mt-1 text-xs text-[color:var(--text-secondary)] tnum">
        {numTxt(stats.gf_avg)} str / {numTxt(stats.ga_avg)} trc
      </p>
      <StatGrid s={stats} />
    </div>
  )
}

// Sekcja [J] — statystyki: gospodarz „u siebie" + gość „na wyjeździe".
export function HomeAwayStats({
  homeName,
  homeLogo,
  homeStats,
  awayName,
  awayLogo,
  awayStats,
}: {
  homeName: string
  homeLogo?: string | null
  homeStats?: SideStats | null
  awayName: string
  awayLogo?: string | null
  awayStats?: SideStats | null
}) {
  if (!homeStats && !awayStats) return null
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {homeStats ? (
        <Column name={homeName} logo={homeLogo} side="u siebie" stats={homeStats} />
      ) : (
        <div className="rounded-[var(--radius-card)] border border-[color:var(--border-soft)] bg-[var(--surface-1)] p-4 text-sm text-[color:var(--text-muted)]">
          Brak statystyk „u siebie" dla {homeName}.
        </div>
      )}
      {awayStats ? (
        <Column name={awayName} logo={awayLogo} side="na wyjeździe" stats={awayStats} />
      ) : (
        <div className="rounded-[var(--radius-card)] border border-[color:var(--border-soft)] bg-[var(--surface-1)] p-4 text-sm text-[color:var(--text-muted)]">
          Brak statystyk „na wyjeździe" dla {awayName}.
        </div>
      )}
    </div>
  )
}
