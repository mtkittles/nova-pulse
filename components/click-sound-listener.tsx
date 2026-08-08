"use client"

import { useEffect, useRef } from "react"
import { getSoundPref } from "@/lib/sound-prefs"
import { playClickSound } from "@/lib/click-sound"

// Globalny listener kliknięć — jeden mount w root layout zamiast dopisywania
// onClick w dziesiątkach komponentów. Capture phase: dźwięk odpala się nawet
// gdy element sam wywoła stopPropagation(). Cichy (0.05 gain) i domyślnie
// WYŁĄCZONY (patrz lib/sound-prefs.ts) — przełącznik w headerze.
export function ClickSoundListener() {
  const enabledRef = useRef(false)

  useEffect(() => {
    enabledRef.current = getSoundPref()

    const onPrefChange = (e: Event) => {
      enabledRef.current = (e as CustomEvent<boolean>).detail
    }
    window.addEventListener("lb-sound-pref-change", onPrefChange)

    const onClick = (e: MouseEvent) => {
      if (!enabledRef.current) return
      const target = e.target as HTMLElement | null
      if (target?.closest('button, a, [role="button"], [role="tab"]')) {
        playClickSound()
      }
    }
    document.addEventListener("click", onClick, { capture: true })

    return () => {
      window.removeEventListener("lb-sound-pref-change", onPrefChange)
      document.removeEventListener("click", onClick, { capture: true })
    }
  }, [])

  return null
}
