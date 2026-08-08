"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ChevronDown } from "lucide-react"
import type { Tip } from "@/lib/types"
import { CountUp } from "../ui/count-up"
import { RotatingSteps } from "./rotating-steps"

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
      {/* winieta — przyciemnienie do --bg-0 na krawędziach hero, żeby logo
          i typografia lepiej odcinały się od ambientowego tła. Ujemny
          z-index działa lokalnie w obrębie tej (position:relative) sekcji:
          maluje się PRZED nie-pozycjonowaną treścią sekcji, ale sekcja jako
          całość i tak maluje się PO globalnym ambient-bg (position:fixed,
          z-index:-1 na body) — więc końcowy porządek jest poprawny (bg →
          winieta → tekst) bez pułapki "position:fixed + transform". */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 75% 65% at 50% 42%, transparent 0%, transparent 40%, var(--bg-0) 100%)",
        }}
      />

      <h1
        aria-label="LUPUS PRED"
        className="text-[clamp(2.5rem,8vw,5.75rem)] font-bold leading-[0.95] tracking-[-0.03em]"
      >
        <span aria-hidden className="inline-flex flex-wrap items-baseline">
          <KineticWord word="LUPUS" startIndex={0} className="text-[color:var(--text-primary)]" />
          <span className="inline-block w-[0.28em]" aria-hidden />
          <KineticWord word="PRED" startIndex={5} className="text-[color:var(--cyan)]" />
        </span>
      </h1>

      {/* sygnet + rotujący opis "Jak działa model" — na desktopie obok
          logo, na mobile pod nim (kolejność DOM + flex-col). Poświata i
          sygnet pulsują niezależnie od jednorazowego wjazdu (.kinetic-logo
          na wrapperze), więc oba ruchy się składają zamiast nadpisywać. */}
      <div className="my-5 flex flex-col items-start gap-5 md:my-7 md:flex-row md:items-center md:gap-10">
        <div className="kinetic-logo relative shrink-0 grid place-items-center self-start md:self-auto">
          <div
            aria-hidden
            className="wolf-glow-pulse absolute h-64 w-64 rounded-full bg-[var(--cyan)] opacity-25 blur-[80px] md:h-80 md:w-80 md:blur-[100px]"
          />
          <Image
            src="/brand/wolf-icon-transparent.png"
            width={320}
            height={320}
            alt=""
            aria-hidden
            className="wolf-pulse relative h-[200px] w-[200px] object-contain md:h-[280px] md:w-[280px]"
          />
        </div>

        <div className="kinetic-sub w-full md:max-w-sm">
          <RotatingSteps />
        </div>
      </div>

      <p className="kinetic-sub max-w-lg text-[15px] leading-7 text-[color:var(--text-muted)] md:text-base">
        Model goli Poissona/Dixon-Coles, kalibracja prawdopodobieństw i własny Q-Score.
        Każdy typ rozliczany automatycznie po meczu.
      </p>

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
