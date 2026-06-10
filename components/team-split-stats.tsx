"use client"

import useSWR from "swr"
import type { SideStats, TeamForm } from "@/lib/extra-types"
import { formMarkets } from "@/lib/tip-utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Metrics {
  played: number
  w: number
  d: number
  l: number
  gfAvg: number
  gaAvg: number
  bttsPct: number
  teamO15Pct: number
  over15Pct: number
  cleanPct: number
}

// Policz metryki z meczów formy (gf/ga = perspektywa tej drużyny).
function metricsFrom(form?: TeamForm): Metrics | null {
  const ms = (form?.matches ?? []).filter((m) => m.gf != null && m.ga != null)
  const n = ms.length
  if (n === 0) return null
  let w = 0, d = 0, l = 0, gf = 0, ga = 0, btts = 0, to15 = 0, o15 = 0, clean = 0
  for (const m of ms) {
    if (m.result === "W") w++
    else if (m.result === "D") d++
    else l++
    gf += m.gf ?? 0
    ga += m.ga ?? 0
    const mk = formMarkets(m.gf, m.ga)
    if (mk?.btts) btts++
    if (mk?.teamOver15) to15++
    if (mk?.over15) o15++
    if ((m.ga ?? 0) === 0) clean++
  }
  const pct = (x: number) => Math.round((x / n) * 100)
  return {
    played: n, w, d, l,
    gfAvg: +(gf / n).toFixed(2),
    gaAvg: +(ga / n).toFixed(2),
    bttsPct: pct(btts), teamO15Pct: pct(to15), over15Pct: pct(o15), cleanPct: pct(clean),
  }
}

// Z fallbacku (SideStats z obiektu drużyny) — gdy brak danych formy.
function fromSide(s?: SideStats | null): Partial<Metrics> | null {
  if (!s) return null
  return {
    played: s.played,
    gfAvg: s.gf_avg ?? undefined,
    gaAvg: s.ga_avg ?? undefined,
    bttsPct: s.btts_pct ?? undefined,
    over15Pct: s.over15_pct ?? undefined,
    cleanPct: s.clean_sheets_pct ?? undefined,
  } as Partial<Metrics>
}

function val(n?: number, suffix = ""): string {
  return n != null && Number.isFinite(n) ? `${n}${suffix}` : "—"
}

export function TeamSplitStats({
  teamId,
  fallbackHome,
  fallbackAway,
}: {
  teamId: string | number
  fallbackHome?: SideStats | null
  fallbackAway?: SideStats | null
}) {
  // SWR uruchamia oba zapytania równolegle (efektywnie Promise.all).
  const { data: homeF, isLoading: lh } = useSWR<TeamForm>(`/api/team/${teamId}/form?scope=home&count=15`, fetcher, {
    revalidateOnFocus: false,
  })
  const { data: awayF, isLoading: la } = useSWR<TeamForm>(`/api/team/${teamId}/form?scope=away&count=15`, fetcher, {
    revalidateOnFocus: false,
  })

  const home = metricsFrom(homeF) ?? fromSide(fallbackHome)
  const away = metricsFrom(awayF) ?? fromSide(fallbackAway)

  if (lh || la) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-[1.4rem] border border-white/12 bg-white/[0.04]" />
        ))}
      </div>
    )
  }

  if (!home && !away)
    return (
      <p className="rounded-[1.4rem] border border-white/12 bg-white/[0.04] p-6 text-white/60">
        Statystyki dom/wyjazd niedostępne w aktualnym źródle danych.
      </p>
    )

  const rows: { label: string; home: string; away: string }[] = [
    { label: "Mecze", home: val(home?.played), away: val(away?.played) },
    {
      label: "W / R / P",
      home: home?.w != null ? `${home.w}/${home.d}/${home.l}` : "—",
      away: away?.w != null ? `${away.w}/${away.d}/${away.l}` : "—",
    },
    { label: "Gole zdobyte (śr)", home: val(home?.gfAvg), away: val(away?.gfAvg) },
    { label: "Gole stracone (śr)", home: val(home?.gaAvg), away: val(away?.gaAvg) },
    { label: "% BTTS", home: val(home?.bttsPct, "%"), away: val(away?.bttsPct, "%") },
    { label: "% Team O1.5", home: val(home?.teamO15Pct, "%"), away: val(away?.teamO15Pct, "%") },
    { label: "% Over 1.5", home: val(home?.over15Pct, "%"), away: val(away?.over15Pct, "%") },
    { label: "Clean sheets", home: val(home?.cleanPct, "%"), away: val(away?.cleanPct, "%") },
  ]

  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-white/12 bg-white/[0.04]">
      <table className="w-full text-sm">
        <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/55">
          <tr>
            <th className="px-4 py-2.5 text-left">Metryka</th>
            <th className="px-4 py-2.5 text-center">🏠 Dom</th>
            <th className="px-4 py-2.5 text-center">✈️ Wyjazd</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-white/5 last:border-0">
              <td className="px-4 py-2.5 text-white/65">{r.label}</td>
              <td className="px-4 py-2.5 text-center font-medium">{r.home}</td>
              <td className="px-4 py-2.5 text-center font-medium">{r.away}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
