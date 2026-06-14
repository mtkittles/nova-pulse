import type { FormResult } from "@/lib/extra-types"

// Kolory formy: W = zielony (success), D/R = żółty (warning), L = czerwony (danger).
// Jedno źródło prawdy dla kółek formy (reuse: FormPanel, /mecz, drużyna).
export const FORM_COLOR: Record<FormResult, { bg: string; text: string; label: string }> = {
  W: { bg: "bg-[var(--success)]", text: "text-[color:var(--bg-0)]", label: "W" },
  D: { bg: "bg-[var(--warning)]", text: "text-[color:var(--bg-0)]", label: "R" },
  L: { bg: "bg-[var(--danger)]", text: "text-[color:var(--bg-0)]", label: "P" },
}

export function formColor(r: FormResult) {
  return FORM_COLOR[r]
}
