"use client"

import { useState } from "react"
import Image from "next/image"
import { teamInitials } from "@/lib/design"

// Herb drużyny: logo z API (media.api-sports.io itd.) z fallbackiem na kółko
// z inicjałami. Fallback gdy brak URL LUB gdy obrazek się nie załaduje (onError).
// ~14% drużyn nie ma logo — fallback jest obowiązkowy.

export type BadgeSize = "sm" | "md" | "lg" | "xl"
const SIZE_PX: Record<BadgeSize, number> = { sm: 24, md: 40, lg: 64, xl: 96 }

// Deterministyczny odcień z nazwy — ta sama drużyna = ten sam kolor kółka.
function hue(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  return h
}

export function TeamBadge({
  logoUrl,
  teamName,
  size = "md",
  className = "",
}: {
  logoUrl?: string | null
  teamName: string
  size?: BadgeSize
  className?: string
}) {
  const px = SIZE_PX[size]
  const [errored, setErrored] = useState(false)
  const showLogo = Boolean(logoUrl) && !errored

  if (showLogo) {
    return (
      <span
        className={`grid shrink-0 place-items-center overflow-hidden rounded-full border border-white/12 bg-white/10 ${className}`}
        style={{ width: px, height: px }}
      >
        <Image
          src={logoUrl as string}
          alt={teamName}
          width={px}
          height={px}
          className="h-full w-full object-contain p-1"
          onError={() => setErrored(true)}
        />
      </span>
    )
  }

  const h = hue(teamName || "?")
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full border border-white/15 font-semibold text-white ${className}`}
      style={{
        width: px,
        height: px,
        fontSize: px * 0.36,
        background: `linear-gradient(135deg, hsla(${h},70%,45%,0.55), hsla(${(h + 40) % 360},70%,35%,0.55))`,
      }}
      aria-hidden
    >
      {teamInitials(teamName)}
    </span>
  )
}
