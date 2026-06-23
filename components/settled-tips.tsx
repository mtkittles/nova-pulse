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
        <p className="text-center text-sm text-white/40 py-8">
          Brak rozliczonych typów do pokazania.
        </p>
      )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-white/45 text-xs uppercase tracking-wider">
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
  )
}
