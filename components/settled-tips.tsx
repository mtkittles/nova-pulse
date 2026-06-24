import type { Tip } from "@/lib/types"
import { statusInfo, BET_TYPE_SHORT } from "@/lib/labels"

function matchLine(t: Tip): string {
  const home = t.home?.trim() || "—"
  const away = t.away?.trim() || "—"
  return `${home} vs ${away}`
}

function settlementLabel(t: Tip): string {
  if (t.settlement_status && t.settlement_status !== "unknown") return t.settlement_status
  return t.actual_result === 1 ? "won" : t.actual_result === 0 ? "lost" : "unknown"
}

function shortDate(iso: string): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso.slice(0, 10)
  return d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", timeZone: "UTC" })
}

export function SettledTips({ tips }: { tips: Tip[] }) {
  if (tips.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-white/40">
        Brak rozliczonych typów do pokazania.
      </p>
    )
  }

  return (
    <div>
      <div className="grid gap-3 md:hidden">
        {tips.map((t, i) => {
          const si = statusInfo(t.actual_result)
          const settlement = settlementLabel(t)
          const score = t.match_score?.trim() || "—"
          return (
            <article key={`${t.event_id}-mobile-${i}`} className="signal-stat-tile rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-faint)]">
                    {shortDate(t.kickoff_utc)} · {BET_TYPE_SHORT[t.bet_type] ?? t.bet_type}
                  </p>
                  <h4 className="mt-1 truncate text-sm font-semibold text-[color:var(--text-primary)]">{matchLine(t)}</h4>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${si.classes}`}>
                  {si.label}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-xl bg-white/[0.035] p-2">
                  <p className="text-[color:var(--text-faint)]">Kurs</p>
                  <p className="mt-1 font-semibold tabular-nums text-[color:var(--text-secondary)]">{t.odds > 0 ? t.odds.toFixed(2) : "—"}</p>
                </div>
                <div className="rounded-xl bg-white/[0.035] p-2">
                  <p className="text-[color:var(--text-faint)]">Score</p>
                  <p className="mt-1 font-semibold text-[color:var(--text-secondary)]">{score}</p>
                </div>
                <div className="rounded-xl bg-white/[0.035] p-2">
                  <p className="text-[color:var(--text-faint)]">Status</p>
                  <p className="mt-1 font-semibold text-[color:var(--text-secondary)]">{settlement}</p>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/45">
            <th className="pb-3 pr-4">Data</th>
            <th className="pb-3 pr-4">Mecz</th>
            <th className="pb-3 pr-4">Rynek</th>
            <th className="pb-3 pr-4 text-right">Kurs</th>
            <th className="pb-3 text-right">Wynik</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">
          {tips.map((t, i) => {
            const si = statusInfo(t.actual_result)
            const settlement = settlementLabel(t)
            const score = t.match_score?.trim() || "—"
            return (
              <tr key={`${t.event_id}-${i}`} className="group">
                <td className="py-3 pr-4 text-white/50 tabular-nums">{shortDate(t.kickoff_utc)}</td>
                <td className="py-3 pr-4 font-medium">
                  <div>{matchLine(t)}</div>
                  <div className="mt-1 text-xs text-white/40">
                    wynik meczu: <span className="text-white/65">{score}</span>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-white/70">{BET_TYPE_SHORT[t.bet_type] ?? t.bet_type}</span>
                  {t.bet_side ? (
                    <span className="ml-1.5 text-white/40">{t.bet_side}</span>
                  ) : null}
                </td>
                <td className="py-3 pr-4 text-right tabular-nums text-white/60">
                  {t.odds > 0 ? t.odds.toFixed(2) : "—"}
                </td>
                <td className="py-3 text-right">
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${si.classes}`}>
                      {si.label}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.16em] text-white/35">{settlement}</span>
                  </div>
                </td>
              </tr>
            )
          })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
