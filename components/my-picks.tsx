"use client"

import { useEffect, useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Plus, Trash2, X } from "lucide-react"
import type { BetType, Tip } from "@/lib/types"
import type { UserPick } from "@/lib/extra-types"
import { BET_TYPE_SHORT } from "@/lib/labels"
import { fmtOdds } from "@/lib/format"

const COLORS = { cyan: "#67e8f9", violet: "#c4b5fd", emerald: "#6ee7b7", rose: "#fda4af", grid: "rgba(255,255,255,0.08)", axis: "rgba(255,255,255,0.45)" }
const tip = { background: "#10111d", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.75rem", color: "#fff" } as const

function statusBadge(s: UserPick["status"]) {
  if (s === "won") return "border-emerald-300/30 bg-emerald-300/10 text-emerald-200"
  if (s === "lost") return "border-rose-300/30 bg-rose-300/10 text-rose-200"
  return "border-white/15 bg-white/[0.06] text-white/55"
}
const statusLabel = (s: UserPick["status"]) => (s === "won" ? "trafiony ✅" : s === "lost" ? "nietrafiony ❌" : "oczekuje")

export function MyPicks() {
  const [picks, setPicks] = useState<UserPick[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const r = await fetch("/api/user/picks")
      const j = await r.json()
      setPicks(Array.isArray(j?.picks) ? j.picks : [])
    } catch {
      setPicks([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  async function remove(id: string | number) {
    setPicks((prev) => (prev ? prev.filter((p) => p.id !== id) : prev))
    await fetch(`/api/user/picks/${id}`, { method: "DELETE" }).catch(() => {})
  }

  const stats = useMemo(() => {
    const list = picks ?? []
    const settled = list.filter((p) => p.status !== "pending")
    const stake = settled.reduce((a, p) => a + p.stake, 0)
    const ret = settled.reduce((a, p) => a + (p.status === "won" ? p.stake * p.odds : 0), 0)
    const wins = settled.filter((p) => p.status === "won").length
    const roi = stake ? (ret - stake) / stake : 0
    return { count: list.length, settled: settled.length, wins, stake, ret, roi, winRate: settled.length ? wins / settled.length : 0 }
  }, [picks])

  // ROI skumulowany w czasie (po rozliczonych, wg daty)
  const roiSeries = useMemo(() => {
    const settled = (picks ?? []).filter((p) => p.status !== "pending").sort((a, b) => a.date.localeCompare(b.date))
    let stake = 0
    let ret = 0
    return settled.map((p) => {
      stake += p.stake
      ret += p.status === "won" ? p.stake * p.odds : 0
      return { date: p.date.slice(5, 10), roi: +(((ret - stake) / stake) * 100).toFixed(1) }
    })
  }, [picks])

  const perMode = useMemo(() => {
    const m = new Map<BetType, { w: number; n: number }>()
    for (const p of picks ?? []) {
      if (p.status === "pending") continue
      const cur = m.get(p.bet_type) ?? { w: 0, n: 0 }
      cur.n++
      if (p.status === "won") cur.w++
      m.set(p.bet_type, cur)
    }
    return [...m.entries()].map(([k, v]) => ({ name: BET_TYPE_SHORT[k], wr: v.n ? +((v.w / v.n) * 100).toFixed(1) : 0 }))
  }, [picks])

  const moneyData = [
    { name: "Stawki", value: +stats.stake.toFixed(2) },
    { name: "Wygrane", value: +stats.ret.toFixed(2) },
  ]

  if (loading)
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-[1.6rem] border border-white/12 bg-white/[0.04]" />
        ))}
      </div>
    )

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { l: "Kupony", v: `${stats.count}` },
            { l: "Skuteczność", v: `${(stats.winRate * 100).toFixed(0)}%` },
            { l: "ROI", v: `${stats.roi >= 0 ? "+" : ""}${(stats.roi * 100).toFixed(1)}%` },
            { l: "Bilans", v: `${(stats.ret - stats.stake).toFixed(0)} zł` },
          ].map((k) => (
            <div key={k.l} className="rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-3">
              <p className="text-xs text-white/60">{k.l}</p>
              <p className="mt-0.5 text-xl font-semibold text-[color:var(--accent)]">{k.v}</p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setModal(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-[color:var(--on-accent)] transition hover:scale-105"
        >
          <Plus className="h-4 w-4" /> Postaw kupon
        </button>
      </div>

      {(picks ?? []).length === 0 ? (
        <div className="rounded-[1.8rem] border border-white/12 bg-white/[0.04] p-12 text-center">
          <p className="text-white/60">Nie masz jeszcze żadnych kuponów.</p>
          <button type="button" onClick={() => setModal(true)} className="mt-5 rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-[color:var(--on-accent)]">
            Postaw pierwszy kupon
          </button>
        </div>
      ) : (
        <>
          {/* wykresy */}
          {stats.settled > 0 && (
            <div className="mb-8 grid gap-5 lg:grid-cols-3">
              <div className="rounded-[1.6rem] border border-white/12 bg-white/[0.04] p-5">
                <p className="mb-3 text-sm text-white/55">ROI w czasie</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={roiSeries} margin={{ left: -16, right: 8, top: 8 }}>
                      <CartesianGrid stroke={COLORS.grid} vertical={false} />
                      <XAxis dataKey="date" stroke={COLORS.axis} tick={{ fontSize: 11 }} />
                      <YAxis stroke={COLORS.axis} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                      <Tooltip contentStyle={tip} formatter={(v: unknown) => [`${v}%`, "ROI"]} />
                      <Line type="monotone" dataKey="roi" stroke={COLORS.cyan} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-[1.6rem] border border-white/12 bg-white/[0.04] p-5">
                <p className="mb-3 text-sm text-white/55">Skuteczność per tryb</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={perMode} margin={{ left: -16, right: 8, top: 8 }}>
                      <CartesianGrid stroke={COLORS.grid} vertical={false} />
                      <XAxis dataKey="name" stroke={COLORS.axis} tick={{ fontSize: 11 }} />
                      <YAxis stroke={COLORS.axis} tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={tip} formatter={(v: unknown) => [`${v}%`, "Skuteczność"]} />
                      <Bar dataKey="wr" fill={COLORS.violet} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-[1.6rem] border border-white/12 bg-white/[0.04] p-5">
                <p className="mb-3 text-sm text-white/55">Stawki vs wygrane</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={moneyData} margin={{ left: -8, right: 8, top: 8 }}>
                      <CartesianGrid stroke={COLORS.grid} vertical={false} />
                      <XAxis dataKey="name" stroke={COLORS.axis} tick={{ fontSize: 11 }} />
                      <YAxis stroke={COLORS.axis} tick={{ fontSize: 11 }} />
                      <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={tip} formatter={(v: unknown) => [`${v} zł`, ""]} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        <Cell fill={COLORS.cyan} />
                        <Cell fill={COLORS.emerald} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* lista */}
          <div className="overflow-hidden rounded-[1.6rem] border border-white/12 bg-white/[0.04]">
            {(picks ?? []).map((p) => (
              <div key={String(p.id)} className="flex flex-wrap items-center gap-3 border-b border-white/5 px-5 py-3 text-sm last:border-0">
                <span className="w-20 shrink-0 text-white/60">{p.date.slice(0, 10)}</span>
                <span className="min-w-[10rem] flex-1 truncate">
                  {p.home} <span className="text-white/55">vs</span> {p.away}
                </span>
                <span className="text-white/70">{BET_TYPE_SHORT[p.bet_type]} · {p.bet_side}</span>
                <span className="text-white/55">@ {p.odds.toFixed(2)}</span>
                <span className="text-white/55">{p.stake} zł</span>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadge(p.status)}`}>{statusLabel(p.status)}</span>
                {p.status === "pending" && (
                  <button type="button" onClick={() => remove(p.id)} aria-label="Usuń" className="text-white/60 hover:text-rose-300">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {modal && <PickModal onClose={() => setModal(false)} onSaved={load} />}
    </div>
  )
}

function PickModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [tips, setTips] = useState<Tip[] | null>(null)
  const [date, setDate] = useState<string>("")
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [stake, setStake] = useState(10)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const cal = await (await fetch("/api/calendar")).json()
        const days: { date: string; tips: number }[] = Array.isArray(cal?.days) ? cal.days : []
        const today = new Date().toISOString().slice(0, 10)
        const d = days.filter((x) => x.tips !== 0).map((x) => x.date).sort().find((x) => x >= today) ?? days[0]?.date ?? today
        const t = await (await fetch(`/api/tips?date=${d}`)).json()
        if (active) {
          setDate(d)
          setTips(Array.isArray(t?.tips) ? t.tips.filter((x: Tip) => x.bet_type !== "THRILLER") : [])
        }
      } catch {
        if (active) setTips([])
      }
    })()
    return () => {
      active = false
    }
  }, [])

  function toggle(id: string) {
    setSel((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  async function save() {
    const chosen = (tips ?? []).filter((t) => sel.has(String(t.event_id)))
    if (chosen.length === 0) return
    setSaving(true)
    try {
      await fetch("/api/user/picks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          picks: chosen.map((t) => ({ event_id: t.event_id, bet_type: t.bet_type, bet_side: t.bet_side, odds: t.odds, stake })),
        }),
      })
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-[1.8rem] border border-white/12 bg-[var(--bg-soft)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h3 className="font-semibold">Postaw kupon {date && <span className="text-white/60">· {date}</span>}</h3>
          <button type="button" onClick={onClose} aria-label="Zamknij">
            <X className="h-5 w-5 text-white/50 hover:text-white" />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-auto p-4">
          {tips === null ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-white/[0.05]" />
              ))}
            </div>
          ) : tips.length === 0 ? (
            <p className="py-8 text-center text-white/55">Brak dostępnych typów do wyboru.</p>
          ) : (
            <div className="space-y-2">
              {tips.map((t) => {
                const id = String(t.event_id)
                const on = sel.has(id)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggle(id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition ${
                      on ? "border-[color:var(--accent)]/50 bg-[var(--accent)]/10" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {t.home} <span className="text-white/55">vs</span> {t.away}
                      <span className="ml-2 text-white/60">{BET_TYPE_SHORT[t.bet_type]} {t.bet_side}</span>
                    </span>
                    <span className="shrink-0 font-semibold">{fmtOdds(t.odds)}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
          <label className="flex items-center gap-2 text-sm text-white/60">
            Stawka/typ
            <input type="number" min={1} value={stake} onChange={(e) => setStake(Math.max(0, Number(e.target.value)))} className="w-20 rounded-full border border-white/12 bg-[var(--bg)] px-3 py-1.5 text-right outline-none focus:border-[color:var(--accent)]/40" />
            zł
          </label>
          <button
            type="button"
            onClick={save}
            disabled={saving || sel.size === 0}
            className="rounded-full bg-[var(--accent)] px-6 py-2.5 font-semibold text-[color:var(--on-accent)] transition hover:scale-105 disabled:opacity-50"
          >
            {saving ? "Zapisywanie…" : `Zapisz (${sel.size})`}
          </button>
        </div>
      </div>
    </div>
  )
}
