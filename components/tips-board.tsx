"use client"

import { useMemo, useState } from "react"
import type { BetType, TipsResponse } from "@/lib/types"
import TipCard from "./tip-card"

// W MVP pokazujemy tylko rynki podstawowe — Thriller (wysokie ryzyko) ukryty.
const FILTERS: { key: "ALL" | BetType; label: string }[] = [
  { key: "ALL", label: "Wszystkie" },
  { key: "BTTS", label: "BTTS" },
  { key: "OVER_1_5", label: "Over 1.5" },
  { key: "MIX", label: "Mix" },
]

export default function TipsBoard({ data }: { data: TipsResponse }) {
  const [filter, setFilter] = useState<"ALL" | BetType>("ALL")

  const visible = useMemo(() => {
    return data.tips
      .filter((t) => t.bet_type !== "THRILLER") // MVP: bez Thrillera
      .filter((t) => (filter === "ALL" ? true : t.bet_type === filter))
      .sort((a, b) => b.q_score - a.q_score) // domyślnie: Q-Score malejąco
  }, [data.tips, filter])

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              filter === f.key
                ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100"
                : "border-white/12 bg-white/[0.05] text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-[1.8rem] border border-white/12 bg-white/[0.04] p-10 text-center text-white/55">
          Brak typów dla wybranego filtra.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((tip) => (
            <TipCard key={tip.event_id} tip={tip} />
          ))}
        </div>
      )}
    </div>
  )
}
