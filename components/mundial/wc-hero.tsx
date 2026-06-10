"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Trophy } from "lucide-react"
import type { WCInfo } from "@/lib/extra-types"
import { flagForNation } from "@/lib/design"

function diffParts(target: number, now: number) {
  const diff = Math.max(0, target - now)
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff % 86_400_000) / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1000),
  }
}

export function WCHero({ info }: { info: WCInfo }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const next = info.next_match
  const targetIso = next?.kickoff_utc || info.start_utc
  const target = new Date(targetIso).getTime()
  const p = now != null && Number.isFinite(target) ? diffParts(target, now) : null
  const parts = p ? [
    { v: p.d, l: "dni" },
    { v: p.h, l: "godz" },
    { v: p.m, l: "min" },
    { v: p.s, l: "sek" },
  ] : null

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
          <Trophy className="h-3.5 w-3.5 text-[color:var(--accent)]" /> Mistrzostwa Świata 2026
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{info.phase}</h1>

        {next && (
          <p className="mt-2 flex flex-wrap items-center gap-2 text-white/70">
            Następny mecz:
            <span className="font-semibold text-white">
              {flagForNation(next.home)} {next.home} vs {next.away} {flagForNation(next.away)}
            </span>
          </p>
        )}

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
