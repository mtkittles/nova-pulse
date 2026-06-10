import Link from "next/link"
import type { WCMatch, WCStage } from "@/lib/extra-types"
import { flagForNation, scaleColor } from "@/lib/design"
import { MapPin } from "lucide-react"

export const STAGE_LABEL: Record<WCStage, string> = {
  group: "Faza grupowa",
  R32: "1/16 finału",
  R16: "1/8 finału",
  QF: "Ćwierćfinał",
  SF: "Półfinał",
  "3RD": "Mecz o 3. miejsce",
  FINAL: "Finał",
}

function fmt(iso: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
  }).format(d)
}

export function WCMatchCard({ m }: { m: WCMatch }) {
  const hasEvent = m.event_id !== "" && m.event_id != null
  const ph = m.prob_home ?? 0
  const pd = m.prob_draw ?? 0
  const pa = m.prob_away ?? 0
  const sum = ph + pd + pa || 1
  const finished = m.status === "finished" && m.home_score != null
  const pred =
    m.predicted_home != null && m.predicted_away != null ? `${m.predicted_home}–${m.predicted_away}` : null

  const inner = (
    <>
      <div className="flex items-center justify-between gap-2 text-xs text-white/60">
        <span className="rounded-full border border-white/12 bg-white/[0.05] px-2.5 py-0.5 font-medium">
          {m.group ? `Grupa ${m.group}` : STAGE_LABEL[m.stage]}
        </span>
        <span>{fmt(m.kickoff_utc)}</span>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex min-w-0 items-center justify-end gap-2 text-right">
          <span className="truncate font-semibold">{m.home}</span>
          <span className="text-xl leading-none">{flagForNation(m.home)}</span>
        </div>
        <div className="px-1 text-center">
          {finished ? (
            <span className="text-lg font-bold tabular-nums">
              {m.home_score}:{m.away_score}
            </span>
          ) : pred ? (
            <span className="rounded-lg bg-white/[0.06] px-2 py-1 text-sm font-semibold" title="Przewidywany wynik">
              {pred}
            </span>
          ) : (
            <span className="text-sm text-white/45">vs</span>
          )}
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-xl leading-none">{flagForNation(m.away)}</span>
          <span className="truncate font-semibold">{m.away}</span>
        </div>
      </div>

      {/* pasek 1X2 */}
      {(m.prob_home != null || m.prob_away != null) && (
        <div className="mt-3">
          <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
            <span style={{ width: `${(ph / sum) * 100}%`, background: scaleColor(ph) }} />
            <span style={{ width: `${(pd / sum) * 100}%`, background: "rgba(255,255,255,0.25)" }} />
            <span style={{ width: `${(pa / sum) * 100}%`, background: scaleColor(pa) }} />
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-white/55">
            <span>1 · {Math.round(ph * 100)}%</span>
            <span>X · {Math.round(pd * 100)}%</span>
            <span>2 · {Math.round(pa * 100)}%</span>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        {m.stadium && (
          <span className="inline-flex items-center gap-1 text-white/55">
            <MapPin className="h-3 w-3" /> {m.city ? `${m.city} · ` : ""}{m.stadium}
          </span>
        )}
        {m.btts_pct != null && (
          <span className="rounded-full border border-white/12 bg-white/[0.05] px-2 py-0.5 text-white/70">BTTS {m.btts_pct}%</span>
        )}
        {m.over25_pct != null && (
          <span className="rounded-full border border-white/12 bg-white/[0.05] px-2 py-0.5 text-white/70">O2.5 {m.over25_pct}%</span>
        )}
        {m.q_score != null && (
          <span className="rounded-full border border-[color:var(--accent)]/30 bg-[var(--accent)]/10 px-2 py-0.5 font-semibold text-[color:var(--accent)]">
            Q {m.q_score}
          </span>
        )}
      </div>
    </>
  )

  const cls =
    "block rounded-[1.6rem] border border-white/12 bg-white/[0.055] p-5 shadow-2xl shadow-black/20 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/[0.085]"
  return hasEvent ? (
    <Link href={`/mecz/${m.event_id}`} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  )
}
