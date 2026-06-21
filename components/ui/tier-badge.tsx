import type { RecommendationTier } from "@/lib/types"

// Badge tieru rekomendacji z Oracle: value / watchlist / analysis.
const TIER: Record<RecommendationTier, { label: string; cls: string }> = {
  value: { label: "💎 Value", cls: "border-emerald-400/40 bg-emerald-400/15 text-emerald-200" },
  watchlist: { label: "👁 Watchlist", cls: "border-amber-400/40 bg-amber-400/15 text-amber-200" },
  analysis: { label: "📊 Analiza", cls: "border-white/15 bg-white/5 text-[color:var(--text-muted)]" },
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
