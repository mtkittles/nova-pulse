"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { FormMatch, TeamForm } from "@/lib/extra-types"
import { formMarkets, type FormMarkets } from "@/lib/tip-utils"
import { AnimatedTabs } from "./ui/tabs"
import { RowsSkeleton } from "./ui/skeletons"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const tooltipStyle = {
  background: "#10111d",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "0.75rem",
  color: "#fff",
} as const

// gf/ga z rekordu lub z parsowania "a:b" (perspektywa drużyny)
function goals(m: FormMatch): { gf: number; ga: number } | null {
  if (m.gf != null && m.ga != null) return { gf: m.gf, ga: m.ga }
  if (m.score) {
    const mt = m.score.match(/^(\d+)\s*[:\-]\s*(\d+)$/)
    if (mt) return { gf: Number(mt[1]), ga: Number(mt[2]) }
  }
  return null
}

const WRP: Record<"W" | "D" | "L", { label: string; cls: string }> = {
  W: { label: "W", cls: "bg-emerald-400/90 text-[#06120a]" },
  D: { label: "R", cls: "bg-amber-300/80 text-[#1a1405]" },
  L: { label: "P", cls: "bg-rose-400/90 text-[#1a0606]" },
}

function MarketCell({ ok }: { ok: boolean | null }) {
  if (ok == null) return <td className="px-2 py-2 text-center text-white/30">—</td>
  return (
    <td className="px-2 py-2 text-center">
      <span
        className={`inline-grid h-6 w-6 place-items-center rounded-md text-xs ${
          ok ? "bg-emerald-400/20 text-emerald-300" : "bg-rose-400/15 text-rose-300"
        }`}
      >
        {ok ? "✓" : "✗"}
      </span>
    </td>
  )
}

export function TeamFormTable({ teamId, teamName }: { teamId: string | number | null; teamName: string }) {
  const [count, setCount] = useState(5)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const { data, isLoading } = useSWR<TeamForm>(
    teamId != null ? `/api/team/${teamId}/form?scope=all&count=${count}` : null,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true },
  )

  if (teamId == null)
    return (
      <p className="rounded-[1.4rem] border border-white/12 bg-white/[0.04] p-6 text-white/60">
        Brak danych historycznych dla tej drużyny w aktualnym źródle danych.
      </p>
    )

  const matches = data?.matches ?? []
  const rows = matches.map((m) => ({ m, g: goals(m), mk: (() => { const g = goals(m); return g ? formMarkets(g.gf, g.ga) : null })() }))
  const n = rows.length

  // podsumowania %
  const sum = (sel: (mk: FormMarkets) => boolean) =>
    n ? Math.round((rows.filter((r) => r.mk != null && sel(r.mk)).length / n) * 100) : 0

  // dane wykresów (chronologicznie: od najstarszego)
  const chrono = [...rows].reverse()
  const goalsData = chrono.map((r, i) => ({ i: i + 1, gf: r.g?.gf ?? 0, ga: r.g?.ga ?? 0 }))
  const bttsTrend = chrono.map((r, i) => ({ i: i + 1, btts: r.mk?.btts ? 1 : 0 }))

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Forma — {teamName}</h3>
        <AnimatedTabs
          groupId="form-range"
          size="sm"
          value={String(count)}
          onChange={(k) => setCount(Number(k))}
          items={[
            { key: "5", label: "5" },
            { key: "10", label: "10" },
            { key: "15", label: "15" },
          ]}
        />
      </div>

      {isLoading && n === 0 ? (
        <div className="rounded-[1.4rem] border border-white/12 bg-white/[0.04]">
          <RowsSkeleton rows={5} />
        </div>
      ) : n === 0 ? (
        <p className="rounded-[1.4rem] border border-white/12 bg-white/[0.04] p-6 text-white/60">
          Brak danych historycznych dla tej drużyny w aktualnym źródle danych.
        </p>
      ) : (
        <>
          {n < count && (
            <p className="mb-3 rounded-xl border border-amber-300/25 bg-amber-300/[0.07] px-4 py-2 text-sm text-amber-100/85">
              Dane formy: tylko {n} {n === 1 ? "mecz" : "meczów"} dostępnych (brak danych za poprzedni sezon).
            </p>
          )}
          <div className="overflow-x-auto rounded-[1.4rem] border border-white/12 bg-white/[0.04]">
            <table className="w-full min-w-[34rem] text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/55">
                <tr>
                  <th className="px-3 py-2.5 text-left">Mecz</th>
                  <th className="px-2 py-2.5 text-center">Wynik</th>
                  <th className="px-2 py-2.5 text-center">W/R/P</th>
                  <th className="px-2 py-2.5 text-center">BTTS</th>
                  <th className="px-2 py-2.5 text-center">Team O1.5</th>
                  <th className="px-2 py-2.5 text-center">Over 1.5</th>
                  <th className="px-2 py-2.5 text-center">Over 2.5</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const wrp = WRP[r.m.result]
                  return (
                    <tr key={i} className="border-b border-white/5 last:border-0">
                      <td className="px-3 py-2">
                        <span className="text-white/80">{r.m.opponent || "—"}</span>
                        {r.m.home != null && (
                          <span className="ml-1.5 text-[10px] uppercase text-white/45">{r.m.home ? "dom" : "wyj"}</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-center font-semibold tabular-nums">{r.g ? `${r.g.gf}:${r.g.ga}` : "—"}</td>
                      <td className="px-2 py-2 text-center">
                        <span className={`inline-grid h-6 w-6 place-items-center rounded-md text-xs font-bold ${wrp.cls}`}>
                          {wrp.label}
                        </span>
                      </td>
                      <MarketCell ok={r.mk ? r.mk.btts : null} />
                      <MarketCell ok={r.mk ? r.mk.teamOver15 : null} />
                      <MarketCell ok={r.mk ? r.mk.over15 : null} />
                      <MarketCell ok={r.mk ? r.mk.over25 : null} />
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="border-t border-white/10 text-xs font-semibold text-white/70">
                <tr>
                  <td className="px-3 py-2.5" colSpan={3}>
                    Podsumowanie ({n})
                  </td>
                  <td className="px-2 py-2.5 text-center text-emerald-300">{sum((m) => m.btts)}%</td>
                  <td className="px-2 py-2.5 text-center text-emerald-300">{sum((m) => m.teamOver15)}%</td>
                  <td className="px-2 py-2.5 text-center text-emerald-300">{sum((m) => m.over15)}%</td>
                  <td className="px-2 py-2.5 text-center text-emerald-300">{sum((m) => m.over25)}%</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* wykresy — gdy są dane */}
          {mounted && n >= 3 && (
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div className="rounded-[1.4rem] border border-white/12 bg-white/[0.04] p-5">
                <p className="mb-3 text-sm text-white/60">Gole zdobyte / stracone</p>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={goalsData} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis dataKey="i" stroke="rgba(255,255,255,0.45)" tick={{ fontSize: 11 }} />
                      <YAxis stroke="rgba(255,255,255,0.45)" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={tooltipStyle} />
                      <Bar dataKey="gf" name="Zdobyte" fill="#34d399" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={700} />
                      <Bar dataKey="ga" name="Stracone" fill="#fb7185" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={700} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-[1.4rem] border border-white/12 bg-white/[0.04] p-5">
                <p className="mb-3 text-sm text-white/60">Trend BTTS (1 = tak)</p>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={bttsTrend} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis dataKey="i" stroke="rgba(255,255,255,0.45)" tick={{ fontSize: 11 }} />
                      <YAxis stroke="rgba(255,255,255,0.45)" tick={{ fontSize: 11 }} domain={[0, 1]} ticks={[0, 1]} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line type="stepAfter" dataKey="btts" stroke="#67e8f9" strokeWidth={2} dot={{ r: 3 }} isAnimationActive animationDuration={700} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
