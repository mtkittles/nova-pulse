"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Trophy } from "lucide-react"
import type { WCOverview } from "@/lib/extra-types"
import { flagForNation, nationPL } from "@/lib/design"

function diffParts(target: number, now: number) {
  const diff = Math.max(0, target - now)
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff % 86_400_000) / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1000),
  }
}

// Nagłówek = maszyna stanów wg overview.phase: pre / group / knockout / finished.
const PHASE_LABEL: Record<WCOverview["phase"], string> = {
  pre: "Mundial startuje już wkrótce",
  group: "Faza grupowa trwa",
  knockout: "Faza pucharowa trwa",
  finished: "Mistrzostwa Świata zakończone",
}

export function WCHero({ overview }: { overview: WCOverview }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const { phase } = overview
  const next = overview.next_match
  const isPre = phase === "pre"
  const isFinished = phase === "finished"

  // Odliczanie tylko w fazie "pre" (do startu turnieju).
  const target = new Date(overview.start_utc).getTime()
  const p = isPre && now != null && Number.isFinite(target) ? diffParts(target, now) : null
  const parts = p
    ? [
        { v: p.d, l: "dni" },
        { v: p.h, l: "godz" },
        { v: p.m, l: "min" },
        { v: p.s, l: "sek" },
      ]
    : null

  const playedGroup = overview.groups.reduce((a, g) => a + g.matches_played, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-[2rem] border border-[color:var(--accent)]/25 bg-gradient-to-br from-[var(--accent)]/15 via-white/[0.04] to-[var(--glow-2)] p-6 backdrop-blur md:p-8"
    >
      <div className="absolute right-[-30px] top-[-30px] h-44 w-44 rounded-full bg-[var(--glow-1)] blur-3xl" />
      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white/85">
          <Trophy className="h-3.5 w-3.5 text-[color:var(--accent)]" /> MŚ 2026
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{PHASE_LABEL[phase]}</h1>

        {/* Mistrz — faza finished */}
        {isFinished && overview.champion && (
          <p className="mt-3 flex items-center gap-2 text-xl font-semibold text-[color:var(--accent)]">
            <Trophy className="h-6 w-6" /> Mistrz: {flagForNation(overview.champion)} {nationPL(overview.champion)}
          </p>
        )}

        {/* Postęp turnieju — group/knockout */}
        {(phase === "group" || phase === "knockout") && (
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-white/80">
              Rozegrane: <strong className="text-white">{phase === "group" ? playedGroup : overview.group_matches}</strong>
              {phase === "group" ? ` / ${overview.group_matches} w grupach` : " meczów grupowych"}
            </span>
            <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-white/80">
              Łącznie <strong className="text-white">{overview.total_matches}</strong> meczów
            </span>
          </div>
        )}

        {/* Następny mecz */}
        {next && (next.home || next.away) && (
          <p className="mt-3 flex flex-wrap items-center gap-2 text-white/70">
            Następny mecz:
            <span className="font-semibold text-white">
              {flagForNation(next.home)} {nationPL(next.home)} vs {nationPL(next.away)} {flagForNation(next.away)}
            </span>
          </p>
        )}

        {/* Odliczanie — tylko pre */}
        {parts && (
          <div className="mt-5 flex gap-2 sm:gap-3">
            {parts.map((x) => (
              <div
                key={x.l}
                className="min-w-[3.5rem] rounded-2xl border border-white/15 bg-[var(--bg)]/50 px-2 py-2.5 text-center backdrop-blur sm:min-w-[4.5rem] sm:px-4"
              >
                <p className="text-2xl font-semibold tabular-nums sm:text-3xl">{String(x.v).padStart(2, "0")}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/60 sm:text-xs">{x.l}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
