"use client"

import { useEffect, useRef, useState } from "react"
import type { Tip } from "@/lib/types"
import { mapMatchStatus, statusFromKickoff } from "@/lib/tip-utils"
import { useInViewOnce, usePrefersReducedMotion } from "@/hooks/use-scroll-animation"

const CHAR_MS = 30
const LINE_PAUSE_MS = 250
const LOOP_PAUSE_MS = 4000
const VISIBLE_LINES = 6

function isLive(t: Tip, nowMs: number): boolean {
  const s = mapMatchStatus(t.match_status) ?? statusFromKickoff(t.kickoff_utc, nowMs)
  return s === "live"
}

// Krótkie fakty dnia z tego samego źródła co reszta demo (todayTips + winRate
// z app/page.tsx) — liczone DOPIERO w efekcie po wejściu w viewport (nie
// w initializerze useState), żeby Date.now() nie dał rozjazdu SSR/hydratacja.
function buildFacts(tips: Tip[], winRate: number, nowMs: number): string[] {
  const lines: string[] = []
  const leagues = new Set(tips.map((t) => t.leagueCode || t.league).filter(Boolean)).size
  lines.push(`${tips.length} typów wygenerowanych z ${leagues} ${leagues === 1 ? "ligi" : "lig"}`)

  const best = [...tips].filter((t) => t.q_score != null).sort((a, b) => (b.q_score ?? 0) - (a.q_score ?? 0))[0]
  if (best) lines.push(`najwyższy Q dziś: ${Math.round(best.q_score as number)} (${best.home} vs ${best.away})`)

  const odds = tips.map((t) => t.odds).filter((o): o is number => o != null)
  if (odds.length > 0) lines.push(`średni kurs: ${(odds.reduce((a, b) => a + b, 0) / odds.length).toFixed(2)}`)

  const liveMatches = new Set(tips.filter((t) => isLive(t, nowMs)).map((t) => t.event_id)).size
  if (liveMatches > 0) lines.push(`${liveMatches} ${liveMatches === 1 ? "mecz live" : "mecze live"} w tej chwili`)

  lines.push(`skuteczność 30 dni: ${(winRate * 100).toFixed(1)}%`)

  const valueCount = tips.filter((t) => t.tier === "value").length
  if (valueCount > 0) lines.push(`${valueCount} ${valueCount === 1 ? "typ value" : "typów value"} w dzisiejszej puli`)

  return lines.slice(0, VISIBLE_LINES)
}

/**
 * "Dziś w piłce" — mniejszy terminal pod live tickerem, w tym samym stylu co
 * "Silnik w akcji" (landing/engine-terminal.tsx). Wypisuje krótkie fakty dnia
 * linia po linii (typewriter, ~30ms/znak), potem pauza 4s, czyszczenie,
 * restart w pętli. Start dopiero przy wejściu w viewport.
 */
export function MiniTerminal({ tips, winRate }: { tips: Tip[]; winRate: number }) {
  const [containerRef, inView] = useInViewOnce<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const [doneLines, setDoneLines] = useState<string[]>([])
  const [typing, setTyping] = useState("")
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (!inView) return
    const facts = buildFacts(tips, winRate, Date.now())
    if (facts.length === 0) return

    const schedule = (fn: () => void, ms: number) => {
      const id = setTimeout(fn, ms)
      timers.current.push(id)
    }

    function typeLine(lineIdx: number) {
      if (lineIdx >= facts.length) {
        schedule(() => {
          setDoneLines([])
          setTyping("")
          typeLine(0)
        }, LOOP_PAUSE_MS)
        return
      }
      const full = facts[lineIdx]
      if (reduced) {
        setDoneLines((prev) => [...prev, full])
        schedule(() => typeLine(lineIdx + 1), LINE_PAUSE_MS)
        return
      }
      let charIdx = 0
      const tick = () => {
        charIdx++
        setTyping(full.slice(0, charIdx))
        if (charIdx < full.length) {
          schedule(tick, CHAR_MS)
        } else {
          setDoneLines((prev) => [...prev, full])
          setTyping("")
          schedule(() => typeLine(lineIdx + 1), LINE_PAUSE_MS)
        }
      }
      tick()
    }

    typeLine(0)
    return () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduced])

  return (
    <div
      ref={containerRef}
      className="glass-solid rounded-xl border border-[color:var(--cyan)]/20 bg-[#03050a] font-mono text-[13px]"
    >
      <div className="flex items-center gap-2 border-b border-white/8 px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/22" />
        <span className="h-2 w-2 rounded-full bg-white/30" />
        <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-white/30">dziś w piłce</span>
      </div>
      {/* wysokość stała (6 linii) — treść się nie skacze przy pętli */}
      <div className="h-[196px] space-y-1.5 overflow-hidden p-4">
        {doneLines.map((line, i) => (
          <p key={i} className="truncate text-white/70">
            <span className="text-[color:var(--cyan)]">{">"}</span> {line}
          </p>
        ))}
        {typing && (
          <p className="truncate text-white/70">
            <span className="text-[color:var(--cyan)]">{">"}</span> {typing}
            {!reduced && <span className="text-[color:var(--cyan)] animate-pulse">▍</span>}
          </p>
        )}
      </div>
    </div>
  )
}
