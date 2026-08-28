"use client"

import { useEffect, useRef, useState } from "react"
import { Check } from "lucide-react"
import { useInViewOnce, usePrefersReducedMotion } from "@/hooks/use-scroll-animation"

// Warianty przykładowych meczów — w duchu puli demo-tips.ts (te same drużyny/
// ligi co gdzie indziej w trybie demo), czysto ilustracyjne dla wizualizacji
// pipeline'u, nie realny fetch.
const EXAMPLES = [
  { home: "VfB Stuttgart", away: "Borussia M'gladbach", league: "Bundesliga", market: "Team O1.5", q: 99, edge: "4.3" },
  { home: "AS Roma", away: "Lazio", league: "Serie A", market: "Over 1.5", q: 94, edge: "10.6" },
  { home: "Ajax", away: "PSV Eindhoven", league: "Eredivisie", market: "BTTS", q: 69, edge: "4.3" },
] as const

type Step = {
  label: string
  progress?: boolean // czy pokazać pasek ASCII przy tym kroku
}

const STEPS: Step[] = [
  { label: "Pobieranie danych meczu..." },
  { label: "Model Poissona/Dixon-Coles...", progress: true },
  { label: "Kalibracja prawdopodobieństw..." },
  { label: "Obliczanie Q-Score...", progress: true },
  { label: "Typ gotowy" },
]

const BAR_WIDTH = 24
const STEP_GAP_MS = 500 // stagger 400-600ms między krokami
const PROGRESS_DURATION_MS = 650
const LOOP_PAUSE_MS = 2000

function AsciiBar({ progress }: { progress: number }) {
  const filled = Math.round((progress / 100) * BAR_WIDTH)
  return (
    <span className="tnum text-[color:var(--cyan)]">
      [{"█".repeat(filled)}
      <span className="text-white/15">{"░".repeat(BAR_WIDTH - filled)}</span>] {progress}%
    </span>
  )
}

/**
 * "Silnik w akcji" — symulowany terminal pokazujący pipeline liczenia typu.
 * Startuje dopiero po wejściu w viewport (useInViewOnce), potem pętla:
 * sekwencja 5 kroków (checkmarki ze staggerem, pasek postępu ASCII na
 * krokach obliczeniowych) → 2s pauzy → restart z kolejnym przykładem.
 */
export function EngineTerminal() {
  const [containerRef, inView] = useInViewOnce<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const [exampleIdx, setExampleIdx] = useState(0)
  const [doneCount, setDoneCount] = useState(0)
  const [progress, setProgress] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (!inView) return
    const schedule = (fn: () => void, ms: number) => {
      const id = setTimeout(fn, ms)
      timers.current.push(id)
    }

    function runStep(i: number) {
      if (i >= STEPS.length) {
        schedule(() => {
          setDoneCount(0)
          setProgress(0)
          setExampleIdx((v) => (v + 1) % EXAMPLES.length)
          schedule(() => runStep(0), 30)
        }, LOOP_PAUSE_MS)
        return
      }
      const step = STEPS[i]
      if (step.progress && !reduced) {
        const tickMs = 40
        const ticks = Math.round(PROGRESS_DURATION_MS / tickMs)
        let t = 0
        const tick = () => {
          t++
          setProgress(Math.min(100, Math.round((t / ticks) * 100)))
          if (t < ticks) {
            schedule(tick, tickMs)
          } else {
            setDoneCount(i + 1)
            schedule(() => {
              setProgress(0)
              runStep(i + 1)
            }, STEP_GAP_MS)
          }
        }
        tick()
      } else {
        if (step.progress) setProgress(100) // reduced motion: bez tykania, od razu 100%
        setDoneCount(i + 1)
        schedule(() => {
          setProgress(0)
          runStep(i + 1)
        }, STEP_GAP_MS)
      }
    }

    runStep(0)
    return () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduced])

  const example = EXAMPLES[exampleIdx]
  const finished = doneCount >= STEPS.length

  return (
    <div ref={containerRef} className="lift rounded-xl border border-[color:var(--cyan)]/25 bg-[#03050a] font-mono text-[13px] shadow-[0_0_60px_-30px_var(--cyan)]">
      {/* pasek tytułowy — kropki ozdobne w odcieniach szarości (nie czerwień/żółć/zieleń macOS) */}
      <div className="flex items-center gap-2 border-b border-white/8 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/22" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
        <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-white/30">silnik.py — obliczanie typu</span>
      </div>

      <div className="min-h-[220px] space-y-2.5 p-5">
        <p className="text-white/35">
          $ analizuj --mecz <span className="text-white/60">"{example.home} vs {example.away}"</span> --liga {example.league}
        </p>

        {STEPS.map((step, i) => {
          const done = i < doneCount
          const active = i === doneCount && inView
          if (!done && !active) return null
          return (
            <div key={step.label} className="flex flex-wrap items-center gap-2">
              {done ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-[color:var(--cyan)]" />
              ) : (
                <span className="inline-block h-3.5 w-3.5 shrink-0 animate-pulse rounded-full border border-[color:var(--cyan)]/50" />
              )}
              <span className={done ? "text-white/75" : "text-white/50"}>{step.label}</span>
              {step.progress && active && !done && <AsciiBar progress={progress} />}
              {i === STEPS.length - 1 && done && (
                <span className="tnum text-[color:var(--cyan)]">
                  · Q {example.q} · {example.market} · edge +{example.edge}%
                </span>
              )}
            </div>
          )
        })}

        {finished && (
          <p className="pt-1 text-white/25">$ _{!reduced && <span className="animate-pulse">|</span>}</p>
        )}
      </div>
    </div>
  )
}
