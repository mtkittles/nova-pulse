"use client"

import useSWR from "swr"
import type { MarketRankings as Rankings } from "@/lib/extra-types"
import { HorizontalCarousel } from "./horizontal-carousel"
import { RankingTeamCard } from "./ranking-team-card"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function CardSkeleton() {
  return <div className="h-56 w-[280px] shrink-0 animate-pulse rounded-[var(--radius-card)] border border-[color:var(--border)] bg-white/[0.04] sm:w-[320px]" />
}

export function MarketRankings() {
  const { data, isLoading } = useSWR<Rankings>("/api/rankings", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })

  const btts = data?.btts ?? []
  const over15 = data?.over_15 ?? []

  if (isLoading) {
    return (
      <div className="space-y-8">
        {[0, 1].map((i) => (
          <div key={i}>
            <div className="mb-4 h-7 w-64 animate-pulse rounded bg-white/[0.06]" />
            <div className="flex gap-4 overflow-hidden">
              {[0, 1, 2, 3].map((j) => (
                <CardSkeleton key={j} />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (btts.length === 0 && over15.length === 0) return null

  return (
    <div className="space-y-8">
      {btts.length > 0 && (
        <div>
          <h2 className="mb-4 text-2xl font-semibold">Najwyższa szansa BTTS</h2>
          <HorizontalCarousel
            items={btts}
            ariaLabel="Ranking drużyn — BTTS"
            getKey={(t) => `btts-${t.team_id}`}
            renderItem={(t) => <RankingTeamCard team={t} market="BTTS" />}
          />
        </div>
      )}
      {over15.length > 0 && (
        <div>
          <h2 className="mb-4 text-2xl font-semibold">Najwyższa szansa Over 1.5</h2>
          <HorizontalCarousel
            items={over15}
            ariaLabel="Ranking drużyn — Over 1.5"
            getKey={(t) => `o15-${t.team_id}`}
            renderItem={(t) => <RankingTeamCard team={t} market="Over 1.5" />}
          />
        </div>
      )}
    </div>
  )
}
