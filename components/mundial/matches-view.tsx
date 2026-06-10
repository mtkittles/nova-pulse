"use client"

import { useMemo, useState } from "react"
import type { WCMatch, WCStage } from "@/lib/extra-types"
import { WCMatchCard, STAGE_LABEL } from "./wc-match-card"
import { StaggerGrid, StaggerItem } from "@/components/ui/stagger"

const STAGES: WCStage[] = ["group", "R32", "R16", "QF", "SF", "3RD", "FINAL"]

function dayKey(iso: string): string {
  return (iso || "").slice(0, 10)
}
function dayLabel(d: string): string {
  if (!d) return "—"
  const dt = new Date(`${d}T12:00:00Z`)
  if (Number.isNaN(dt.getTime())) return d
  return new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", timeZone: "Europe/Warsaw" }).format(dt)
}

export function MatchesView({ matches }: { matches: WCMatch[] }) {
  const [stage, setStage] = useState<"ALL" | WCStage>("ALL")
  const [group, setGroup] = useState("ALL")
  const [day, setDay] = useState("ALL")
  const [q, setQ] = useState("")

  const groups = useMemo(
    () => [...new Set(matches.map((m) => m.group).filter(Boolean))].sort() as string[],
    [matches],
  )
  const days = useMemo(() => {
    const map = new Map<string, number>()
    for (const m of matches) {
      const k = dayKey(m.kickoff_utc)
      if (k) map.set(k, (map.get(k) ?? 0) + 1)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [matches])
  const maxPerDay = Math.max(1, ...days.map(([, c]) => c))

  const visible = useMemo(() => {
    const needle = q.toLowerCase().trim()
    return matches.filter(
      (m) =>
        (stage === "ALL" || m.stage === stage) &&
        (group === "ALL" || m.group === group) &&
        (day === "ALL" || dayKey(m.kickoff_utc) === day) &&
        (!needle || m.home.toLowerCase().includes(needle) || m.away.toLowerCase().includes(needle)),
    )
  }, [matches, stage, group, day, q])

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm font-medium transition ${
      active ? "border-[color:var(--accent)]/40 bg-[var(--accent)]/15 text-white" : "border-white/12 bg-white/[0.05] text-white/60 hover:bg-white/10"
    }`
  const selectCls = "rounded-full border border-white/12 bg-[var(--bg-soft)] px-4 py-2 text-sm text-white/80 outline-none"

  return (
    <div>
      {/* kalendarz turnieju */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-2">
        <button type="button" onClick={() => setDay("ALL")} className={`${chip(day === "ALL")} shrink-0`}>
          Wszystkie
        </button>
        {days.map(([d, c]) => {
          const intensity = 0.12 + (c / maxPerDay) * 0.5
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDay(d)}
              className={`shrink-0 rounded-xl border px-3 py-1.5 text-center text-xs transition ${
                day === d ? "border-[color:var(--accent)]/50" : "border-white/12"
              }`}
              style={{ background: `rgba(103,232,249,${intensity})` }}
              title={`${c} meczów`}
            >
              <div className="font-semibold">{dayLabel(d)}</div>
              <div className="text-[10px] text-white/70">{c} m.</div>
            </button>
          )
        })}
      </div>

      {/* filtry */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <select value={stage} onChange={(e) => setStage(e.target.value as "ALL" | WCStage)} className={selectCls} aria-label="Faza">
          <option value="ALL">Wszystkie fazy</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>{STAGE_LABEL[s]}</option>
          ))}
        </select>
        <select value={group} onChange={(e) => setGroup(e.target.value)} className={selectCls} aria-label="Grupa">
          <option value="ALL">Wszystkie grupy</option>
          {groups.map((g) => (
            <option key={g} value={g}>Grupa {g}</option>
          ))}
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Szukaj drużyny…"
          aria-label="Szukaj drużyny"
          className="rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-[color:var(--accent)]/40"
        />
        <span className="ml-auto text-sm text-white/55">{visible.length} meczów</span>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-[1.6rem] border border-white/12 bg-white/[0.04] p-8 text-center text-white/60">
          Brak meczów dla wybranych filtrów.
        </p>
      ) : (
        <StaggerGrid key={`${stage}-${group}-${day}-${q}`} className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((m) => (
            <StaggerItem key={String(m.event_id)}>
              <WCMatchCard m={m} />
            </StaggerItem>
          ))}
        </StaggerGrid>
      )}
    </div>
  )
}
