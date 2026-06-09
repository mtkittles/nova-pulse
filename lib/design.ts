// === System designu LUPUS BETS ===
// Jedno źródło prawdy dla kolorów trybów, skali prawdopodobieństwa/Q-Score,
// flag krajów i inicjałów drużyn. Używane w całej aplikacji (karty, wykresy, taby).

import type { BetType } from "./types"
import { LEAGUES } from "./leagues"

export type ModeKey = BetType | "WC"

export interface ModeMeta {
  short: string
  full: string
  /** hex — wykresy, pierścienie */
  color: string
  /** klasy badge (border+bg+text) */
  badge: string
  /** sama klasa tekstu akcentu */
  text: string
}

// Spójna paleta trybów — te same kolory wszędzie.
export const MODE_META: Record<ModeKey, ModeMeta> = {
  BTTS: {
    short: "BTTS",
    full: "Obie drużyny strzelą",
    color: "#22d3ee",
    badge: "border-cyan-300/30 bg-cyan-300/10 text-cyan-200",
    text: "text-cyan-300",
  },
  OVER_1_5: {
    short: "Over 1.5",
    full: "Powyżej 1.5 gola",
    color: "#a78bfa",
    badge: "border-violet-300/30 bg-violet-300/10 text-violet-200",
    text: "text-violet-300",
  },
  MIX: {
    short: "Mix",
    full: "Mieszany",
    color: "#34d399",
    badge: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200",
    text: "text-emerald-300",
  },
  THRILLER: {
    short: "Thriller",
    full: "Dokładny wynik 3:2/2:3",
    color: "#fbbf24",
    badge: "border-amber-300/30 bg-amber-300/10 text-amber-200",
    text: "text-amber-300",
  },
  WC: {
    short: "MŚ 2026",
    full: "Mistrzostwa Świata",
    color: "#f472b6",
    badge: "border-pink-300/30 bg-pink-300/10 text-pink-200",
    text: "text-pink-300",
  },
}

// Skala pewności: czerwony (niskie) → bursztyn (średnie) → zielony (wysokie).
// v w zakresie 0..1. Zwraca rgb() (kontrast AA na ciemnym tle).
export function scaleColor(v: number): string {
  const c = Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0))
  const stops = [
    { p: 0, r: 251, g: 113, b: 133 }, // rose-400
    { p: 0.5, r: 251, g: 191, b: 36 }, // amber-400
    { p: 1, r: 52, g: 211, b: 153 }, // emerald-400
  ]
  let a = stops[0]
  let b = stops[stops.length - 1]
  for (let i = 0; i < stops.length - 1; i++) {
    if (c >= stops[i].p && c <= stops[i + 1].p) {
      a = stops[i]
      b = stops[i + 1]
      break
    }
  }
  const t = (c - a.p) / (b.p - a.p || 1)
  const r = Math.round(a.r + (b.r - a.r) * t)
  const g = Math.round(a.g + (b.g - a.g) * t)
  const bl = Math.round(a.b + (b.b - a.b) * t)
  return `rgb(${r}, ${g}, ${bl})`
}

/** Kolor dla Q-Score 0..100. */
export function qColor(q: number): string {
  return scaleColor(q / 100)
}

/** Klasa tekstu (Tailwind) dla wartości 0..1 — gdy potrzebny utility, nie inline. */
export function toneClass(v: number): string {
  if (v < 0.5) return "text-rose-300"
  if (v < 0.75) return "text-amber-300"
  return "text-emerald-300"
}

// === Flagi krajów (emoji) ===
const COUNTRY_FLAG: Record<string, string> = {
  Anglia: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Szkocja: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  Hiszpania: "🇪🇸",
  Włochy: "🇮🇹",
  Niemcy: "🇩🇪",
  Portugalia: "🇵🇹",
  Japonia: "🇯🇵",
  Argentyna: "🇦🇷",
  Brazylia: "🇧🇷",
  USA: "🇺🇸",
  Meksyk: "🇲🇽",
  Turcja: "🇹🇷",
  Rumunia: "🇷🇴",
  Francja: "🇫🇷",
  Szwecja: "🇸🇪",
  Austria: "🇦🇹",
  Holandia: "🇳🇱",
  Kolumbia: "🇨🇴",
  Algieria: "🇩🇿",
  Europa: "🇪🇺",
}

function norm(s: string): string {
  return (s || "").toLowerCase().replace(/\s+/g, " ").trim()
}

const COUNTRY_BY_LEAGUE: Record<string, string> = (() => {
  const m: Record<string, string> = {}
  for (const l of LEAGUES) if (!(norm(l.name) in m)) m[norm(l.name)] = l.country
  return m
})()

export function flagForCountry(country?: string): string {
  if (!country) return ""
  return COUNTRY_FLAG[country] ?? "🌍"
}

/** Flaga dla nazwy ligi (mapowana przez LEAGUES → kraj). MŚ → 🏆. */
export function flagForLeague(league?: string): string {
  if (!league) return ""
  const l = norm(league)
  if (l.includes("world cup") || l.includes("mundial") || l.includes("mistrzostwa świata"))
    return "🏆"
  const country = COUNTRY_BY_LEAGUE[l]
  return country ? flagForCountry(country) : ""
}

/** Inicjały drużyny do herbu-zastępnika (gdy brak logo). */
export function teamInitials(name?: string): string {
  if (!name) return "?"
  const words = name.replace(/[^\p{L}\p{N} ]/gu, " ").split(/\s+/).filter(Boolean)
  if (words.length === 0) return "?"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

// Wspólne presety przejść (framer-motion).
export const spring = { type: "spring" as const, stiffness: 400, damping: 32 }
export const springSoft = { type: "spring" as const, stiffness: 260, damping: 28 }
