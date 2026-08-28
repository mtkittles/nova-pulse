"use client"

import { useEffect, useState } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { getSoundPref, setSoundPref } from "@/lib/sound-prefs"
import { playClickSound } from "@/lib/click-sound"

// Przełącznik dźwięku kliknięć — ikona głośnika w headerze. Stan czytany
// z localStorage po mount (unika rozjazdu SSR/klient). Włączenie odtwarza
// dźwięk od razu jako potwierdzenie (global listener nie złapałby TEGO
// samego kliknięcia — capture fires przed aktualizacją stanu w onClick).
export function SoundToggle() {
  const [on, setOn] = useState(false)
  useEffect(() => setOn(getSoundPref()), [])

  function toggle() {
    const next = !on
    setOn(next)
    setSoundPref(next)
    if (next) playClickSound()
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={on ? "Wyłącz dźwięk kliknięć" : "Włącz dźwięk kliknięć"}
      aria-pressed={on}
      title={on ? "Dźwięk kliknięć: włączony" : "Dźwięk kliknięć: wyłączony"}
      className="tap grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[color:var(--text-muted)] transition-colors duration-150 hover:text-[color:var(--text-primary)]"
    >
      {on ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
    </button>
  )
}
