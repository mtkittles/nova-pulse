import type { FormResult } from "@/lib/extra-types"

// W = wygrana (zielony), R = remis (szary), P = porażka (czerwony)
const SQ: Record<FormResult, { label: string; cls: string }> = {
  W: { label: "W", cls: "bg-emerald-400/90 text-[#06120a]" },
  D: { label: "R", cls: "bg-white/20 text-white" },
  L: { label: "P", cls: "bg-rose-400/90 text-[#1a0606]" },
}

export function FormSquares({ results, size = "md" }: { results: FormResult[]; size?: "sm" | "md" }) {
  if (results.length === 0) return <span className="text-sm text-white/55">brak</span>
  const dim = size === "sm" ? "h-6 w-6 text-xs" : "h-8 w-8 text-sm"
  return (
    <div className="flex flex-wrap gap-1">
      {results.map((r, i) => (
        <span key={i} className={`grid ${dim} place-items-center rounded-lg font-bold ${SQ[r].cls}`}>
          {SQ[r].label}
        </span>
      ))}
    </div>
  )
}

// punkty formy: W=3, R=1, P=0 — do sortowania
export function formPoints(results: FormResult[]): number {
  return results.reduce((a, r) => a + (r === "W" ? 3 : r === "D" ? 1 : 0), 0)
}
