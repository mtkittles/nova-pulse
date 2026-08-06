// Krótki, cichy "click" generowany oscylatorem (Web Audio API) — zero
// dodatkowego pliku audio do ładowania. AudioContext tworzony DOPIERO przy
// pierwszym realnym wywołaniu (zawsze wewnątrz handlera kliknięcia — user
// gesture), bo przeglądarki blokują audio przed pierwszą interakcją.
let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === "suspended") void ctx.resume()
  return ctx
}

export function playClickSound(): void {
  const c = getCtx()
  if (!c) return
  const t0 = c.currentTime
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = "sine"
  // wysoka częstotliwość, krótki opadający "tick" ~40ms — subtelny, nie brzęczący
  osc.frequency.setValueAtTime(1800, t0)
  osc.frequency.exponentialRampToValueAtTime(1100, t0 + 0.04)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(0.05, t0 + 0.004)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.045)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + 0.05)
}
