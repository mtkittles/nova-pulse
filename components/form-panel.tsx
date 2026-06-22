"use client"

import { useEffect, useState } from "react"
import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from "recharts"
import type { FormMatch, FormScope, TeamForm } from "@/lib/extra-types"

const SCOPES: { k: FormScope; l: string }[] = [
  { k: "all", l: "Ogólna" },
  { k: "home", l: "Dom" },
  { k: "away", l: "Wyjazd" },
]
const COUNTS = [5, 10, 15]

import { FORM_COLOR } from "@/lib/utils/form-colors"

// W = zielony, R(D) = żółty, P(L) = czerwony — wspólny helper FORM_COLOR.
const SQUARE: Record<"W" | "D" | "L", { label: string; cls: string }> = {
  W: { label: FORM_COLOR.W.label, cls: `${FORM_COLOR.W.bg} ${FORM_COLOR.W.text}` },
  D: { label: FORM_COLOR.D.label, cls: `${FORM_COLOR.D.bg} ${FORM_COLOR.D.text}` },
  L: { label: FORM_COLOR.L.label, cls: `${FORM_COLOR.L.bg} ${FORM_COLOR.L.text}` },
}

// Rynki rozliczane per mecz (✓/✗ w wierszu i w podsumowaniu).
const MARKETS = [
  { key: "btts", label: "BTTS" },
  { key: "over15", label: "O1.5" },
  { key: "over25", label: "O2.5" },
  { key: "teamOver15", label: "T.O1.5" },
] as const

// kolor odsetka: ≥60% zielony, 40-59% żółty, <40% czerwony
function pctColor(pct: number | null): string {
  if (pct == null) return "text-white/50"
  if (pct >= 60) return "text-emerald-300"
  if (pct >= 40) return "text-amber-300"
  return "text-rose-300"
}

// Sparkline trendu formy: W=1, D=0.5, L=0 (chronologicznie, najnowszy z prawej).
function SparkTooltip({ active, payload }: { active?: boolean; payload?: { payload: { label: string } }[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-white/12 bg-[var(--bg-soft)] px-2 py-1 text-[11px] text-white/80">
      {payload[0].payload.label}
    </div>
  )
}

function FormSparkline({ matches }: { matches: FormMatch[] }) {
  const data = [...matches].reverse().map((m) => ({
    v: m.result === "W" ? 1 : m.result === "D" ? 0.5 : 0,
    label: `${m.date ? m.date.slice(5, 10) : "—"} ${m.result}${m.opponent ? ` vs ${m.opponent}` : ""}${m.score ? ` ${m.score}` : ""}`,
  }))
  if (data.length < 2) return null
  return (
    <div className="mb-3 h-12 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 4, bottom: 6, left: 4 }}>
          <YAxis hide domain={[-0.1, 1.1]} />
          <Tooltip content={<SparkTooltip />} cursor={{ stroke: "rgba(255,255,255,0.15)" }} />
          <Line type="monotone" dataKey="v" stroke="#58E6F5" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Mała plakietka rynku: ✓ zielony / ✗ czerwony / — muted (null).
function MarketFlag({ label, v }: { label: string; v: boolean | null | undefined }) {
  const cls =
    v == null
      ? "border-white/10 bg-white/[0.04] text-white/45"
      : v
        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
        : "border-rose-400/30 bg-rose-400/10 text-rose-300"
  return <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${cls}`}>{label} {v == null ? "—" : v ? "✓" : "✗"}</span>
}

export function FormPanel({ teamId, teamName }: { teamId: string | number | null; teamName: string }) {
  const [scope, setScope] = useState<FormScope>("all")
  const [count, setCount] = useState(10)
  const [form, setForm] = useState<TeamForm | null>(null)
  const [loading, setLoading] = useState(teamId != null)

  useEffect(() => {
    if (teamId == null) return
    let active = true
    setLoading(true)
    fetch(`/api/team/${teamId}/form?scope=${scope}&count=${count}`)
      .then((r) => r.json())
      .then((d) => {
        if (active) setForm(d)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [teamId, scope, count])

  return (
    <div className="rounded-[1.6rem] border border-white/12 bg-white/[0.05] p-5 backdrop-blur">
      <h4 className="mb-4 font-semibold">{teamName}</h4>

      {teamId == null ? (
        <p className="text-sm text-white/60">Brak danych o formie tej drużyny.</p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {SCOPES.map((sc) => (
              <button
                key={sc.k}
                type="button"
                onClick={() => setScope(sc.k)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  scope === sc.k
                    ? "border-[color:var(--accent)]/40 bg-[var(--accent)]/15 text-white"
                    : "border-white/12 bg-white/[0.05] text-white/55 hover:bg-white/10"
                }`}
              >
                {sc.l}
              </button>
            ))}
            <span className="mx-1 w-px self-stretch bg-white/10" />
            {COUNTS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCount(c)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  count === c
                    ? "border-[color:var(--accent)]/40 bg-[var(--accent)]/15 text-white"
                    : "border-white/12 bg-white/[0.05] text-white/55 hover:bg-white/10"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {form && form.matches.length > 0 ? (
            <div className={loading ? "opacity-50" : ""}>
              {/* skróty W/D/L (szybki rzut oka) */}
              <div className="mb-3 flex flex-wrap gap-1.5">
                {form.matches.map((m, i) => {
                  const sq = SQUARE[m.result]
                  return (
                    <span
                      key={i}
                      title={[m.opponent, m.score, m.date].filter(Boolean).join(" · ")}
                      className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-bold ${sq.cls}`}
                    >
                      {sq.label}
                    </span>
                  )
                })}
              </div>

              {/* sparkline trendu formy (W=1/D=0.5/L=0) */}
              <FormSparkline matches={form.matches} />

              {/* podsumowanie rynków z aktualnego zakresu (5/10/15) */}
              <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                {MARKETS.slice(0, 3).map((mk) => {
                  const known = form.matches.filter((m) => m[mk.key] != null)
                  const hit = known.filter((m) => m[mk.key]).length
                  const pp = known.length ? Math.round((hit / known.length) * 100) : null
                  return (
                    <span key={mk.key} className="text-white/55">
                      {mk.label}:{" "}
                      <span className={`font-semibold tnum ${pctColor(pp)}`}>
                        {hit}/{known.length} ({pp == null ? "—" : `${pp}%`})
                      </span>
                    </span>
                  )
                })}
              </div>

              {/* wiersze meczów: wynik + rynki ✓/✗ */}
              <div className="space-y-1.5">
                {form.matches.map((m, i) => {
                  const sq = SQUARE[m.result]
                  return (
                    <div key={i} className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded text-[11px] font-bold ${sq.cls}`}>{sq.label}</span>
                        <span className="w-10 shrink-0 text-white/50 tnum">{m.date ? m.date.slice(5, 10) : "—"}</span>
                        <span className="min-w-0 flex-1 truncate text-white/80">{m.opponent ?? "—"}</span>
                        <span className="shrink-0 text-white/70 tnum">{m.score ?? "—"}</span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {MARKETS.map((mk) => (
                          <MarketFlag key={mk.key} label={mk.label} v={m[mk.key]} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-white/60">{loading ? "Ładowanie…" : "Brak danych o formie."}</p>
          )}

          {form && (form.btts_pct != null || form.avg_gf != null || form.avg_ga != null) && (
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2">
                <p className="text-[11px] text-white/60">BTTS</p>
                <p className="mt-0.5 font-semibold">{form.btts_pct != null ? `${form.btts_pct}%` : "—"}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2">
                <p className="text-[11px] text-white/60">Śr. strzel.</p>
                <p className="mt-0.5 font-semibold">{form.avg_gf != null ? form.avg_gf.toFixed(2) : "—"}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2">
                <p className="text-[11px] text-white/60">Śr. strac.</p>
                <p className="mt-0.5 font-semibold">{form.avg_ga != null ? form.avg_ga.toFixed(2) : "—"}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
