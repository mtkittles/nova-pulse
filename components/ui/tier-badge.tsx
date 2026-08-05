import type { RecommendationTier } from "@/lib/types"

// Badge tieru rekomendacji z Oracle: value / watchlist / analysis.
// Jeden kolor bazowy (--cyan) dla wszystkich trzech — rozróżnienie wyłącznie
// przez ikonę i styl wypełnienia (nie przez barwę): Value = pełne tło,
// Analiza = sam obrys, Watchlist = przezroczyste tło z cyan tekstem.
const TIER: Record<RecommendationTier, { label: string; cls: string }> = {
  value: { label: "💎 Value", cls: "border border-[color:var(--cyan)] bg-[var(--cyan)] text-[color:var(--on-accent)]" },
  analysis: { label: "📊 Analiza", cls: "border border-[color:var(--cyan)] bg-transparent text-[color:var(--cyan)]" },
  watchlist: { label: "👁 Watchlist", cls: "border border-transparent bg-transparent text-[color:var(--cyan)]" },
}

export function TierBadge({ tier, className = "" }: { tier?: RecommendationTier | null; className?: string }) {
  if (!tier) return null
  const t = TIER[tier]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${t.cls} ${className}`}>
      {t.label}
    </span>
  )
}
