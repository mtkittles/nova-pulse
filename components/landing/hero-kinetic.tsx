"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ChevronDown } from "lucide-react"
import type { Tip } from "@/lib/types"
import { CountUp } from "../ui/count-up"

// Litera jako osobny span z --i (kolejność w animacji CSS .kinetic-letter).
// Index ciągły przez oba słowa, żeby stagger nie "resetował się" na spacji.
function KineticWord({
  word,
  startIndex,
  className,
}: {
  word: string
  startIndex: number
  className: string
}) {
  return (
    <span className={className}>
      {word.split("").map((ch, i) => (
        <span key={i} className="kinetic-letter" style={{ "--i": startIndex + i } as React.CSSProperties}>
          {ch}
        </span>
      ))}
    </span>
  )
}

function avg(values: (number | null | undefined)[]): number | null {
  const nums = values.filter((v): v is number => v != null && Number.isFinite(v))
  if (nums.length === 0) return null
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

/**
 * Hero landingu — ~65vh desktop / ~55vh mobile (świadomie NIE full-screen:
 * dane „Dziś w skrócie" muszą wejść w zasięg jednego scrolla).
 *
 * Animacja wjazdu liter jest czystym CSS-em (keyframes + animation-delay
 * przez zmienną --i) — działa natychmiast po odmalowaniu strony, bez
 * czekania na hydratację, i nie znika przy wyłączonym JS.
 */
export function HeroKinetic({ tips }: { tips: Tip[] }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const avgQ = avg(tips.map((t) => t.q_score))

  const scrollToNext = () => {
    document.getElementById("dzis")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <section
      id="hero"
      className="relative flex min-h-[55vh] scroll-mt-20 flex-col justify-center md:min-h-[65vh]"
    >
      <h1
        aria-label="LUPUS PRED"
        className="text-[clamp(3rem,12vw,9rem)] font-bold leading-[0.95] tracking-[-0.03em]"
      >
        <span aria-hidden className="inline-flex flex-wrap items-baseline">
          <KineticWord word="LUPUS" startIndex={0} className="text-[color:var(--text-primary)]" />
          <span className="inline-block w-[0.28em]" aria-hidden />
          <KineticWord word="PRED" startIndex={5} className="text-[color:var(--cyan)]" />
        </span>
      </h1>

      <p className="kinetic-sub mt-4 max-w-lg text-[15px] leading-7 text-[color:var(--text-muted)] md:text-base">
        Model goli Poissona/Dixon-Coles, kalibracja prawdopodobieństw i własny Q-Score.
        Każdy typ rozliczany automatycznie po meczu.
      </p>

      {/* sygnet pod claimem — sama głowa (bez powtarzania napisu "Lupus Pred",
          który już jest wyżej jako kinetyczna typografia), z poświatą cyan w tle */}
      <div className="kinetic-logo relative my-6 grid place-items-center self-start">
        <div
          aria-hidden
          className="absolute h-40 w-40 rounded-full bg-[var(--cyan)] opacity-20 blur-[60px] md:h-48 md:w-48"
        />
        <Image
          src="/brand/wolf-icon-transparent.png"
          width={160}
          height={160}
          alt=""
          aria-hidden
          className="relative h-[120px] w-[120px] object-contain md:h-[160px] md:w-[160px]"
        />
      </div>

      <p className="kinetic-sub mt-4 text-sm text-[color:var(--text-secondary)]">
        <CountUp to={tips.length} className="tnum font-semibold text-[color:var(--cyan)]" /> typów
        dziś
        {avgQ != null && (
          <>
            {" "}
            <span className="text-[color:var(--text-muted)]">·</span> średni Q{" "}
            <CountUp to={avgQ} decimals={0} className="tnum font-semibold text-[color:var(--text-primary)]" />
          </>
        )}
      </p>

      <button
        type="button"
        onClick={scrollToNext}
        aria-label="Przewiń do sekcji Dziś w skrócie"
        className={`kinetic-arrow tap absolute bottom-0 left-1/2 grid -translate-x-1/2 place-items-center text-[color:var(--text-muted)] transition-opacity duration-200 ${
          scrolled ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <ChevronDown className="h-6 w-6" />
      </button>
    </section>
  )
}
