"use client"

import { useEffect, useState } from "react"
import type { FormScope, TeamForm } from "@/lib/extra-types"

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

          <div className={`flex flex-wrap gap-1.5 ${loading ? "opacity-50" : ""}`}>
            {form && form.matches.length > 0 ? (
              form.matches.map((m, i) => {
                const sq = SQUARE[m.result]
                return (
                  <span
                    key={i}
                    title={[m.opponent, m.score, m.date].filter(Boolean).join(" · ")}
                    className={`grid h-8 w-8 place-items-center rounded-lg text-sm font-bold ${sq.cls}`}
                  >
                    {sq.label}
                  </span>
                )
              })
            ) : (
              <p className="text-sm text-white/60">{loading ? "Ładowanie…" : "Brak danych o formie."}</p>
            )}
          </div>

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
