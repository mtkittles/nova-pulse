"use client"

import { useState } from "react"
import Link from "next/link"
import { FlaskConical } from "lucide-react"
import type { WCStage, WCTie } from "@/lib/extra-types"
import { flagForNation, nationPL } from "@/lib/design"
import { AnimatedTabs } from "@/components/ui/tabs"
import { STAGE_LABEL } from "./wc-match-card"

const ORDER: WCStage[] = ["R32", "R16", "QF", "SF", "FINAL", "3RD"]

type Mode = "real" | "simulation" | "placeholder"

function TieSide({
  team,
  label,
  score,
  fav,
  placeholder,
}: {
  team?: string | null
  label?: string | null
  score?: number | null
  fav: boolean
  placeholder: boolean
}) {
  // placeholder = nieznana drużyna → pokaż etykietę slotu (np. "1A", "3C/D/E/F")
  if (placeholder) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg px-2 py-1">
        <span className="truncate text-sm text-white/45">{label || "Awans z fazy grupowej"}</span>
      </div>
    )
  }
  return (
    <div className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1 ${fav ? "bg-[var(--accent)]/15" : ""}`}>
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="text-base leading-none">{team ? flagForNation(team) : "🏳️"}</span>
        <span className={`truncate text-sm ${fav ? "font-semibold text-white" : "text-white/75"}`}>
          {team ? nationPL(team) : label || "—"}
        </span>
      </span>
      {score != null && <span className="shrink-0 text-sm font-bold tabular-nums">{score}</span>}
    </div>
  )
}

function TieCard({ tie, mode }: { tie: WCTie; mode: Mode }) {
  const known = (v?: string | null) => v != null && v !== ""
  // W trybie placeholder pokazujemy etykiety, gdy drużyny nieznane.
  const homePlaceholder = mode === "placeholder" && !known(tie.home)
  const awayPlaceholder = mode === "placeholder" && !known(tie.away)

  const showProb = mode === "simulation" && tie.winner == null && tie.prob_home != null
  const favHome = tie.winner === "home" || (mode === "simulation" && tie.winner == null && (tie.prob_home ?? 0) >= 0.5)
  const favAway = tie.winner === "away" || (mode === "simulation" && tie.winner == null && (tie.prob_home ?? 1) < 0.5 && tie.prob_home != null)

  const card = (
    <div className="rounded-xl border border-white/12 bg-white/[0.05] p-2.5">
      <TieSide team={tie.home} label={tie.home_label} score={mode === "placeholder" ? null : tie.home_score} fav={favHome} placeholder={homePlaceholder} />
      <TieSide team={tie.away} label={tie.away_label} score={mode === "placeholder" ? null : tie.away_score} fav={favAway} placeholder={awayPlaceholder} />
      {showProb && (
        <p className="mt-1 text-center text-[10px] text-white/45">
          szansa: {Math.round((tie.prob_home ?? 0) * 100)}% / {Math.round((1 - (tie.prob_home ?? 0)) * 100)}%
        </p>
      )}
    </div>
  )
  // Link do meczu tylko gdy realnie istnieje (nie w symulacji/placeholderze).
  return mode === "real" && tie.event_id ? (
    <Link href={`/mecz/${tie.event_id}`} className="block transition hover:brightness-125">
      {card}
    </Link>
  ) : (
    card
  )
}

function BracketColumns({ ties, mode }: { ties: WCTie[]; mode: Mode }) {
  const byStage = ORDER.map((st) => ({ stage: st, ties: ties.filter((t) => t.stage === st) })).filter((c) => c.ties.length)
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-4">
        {byStage.map((col) => (
          <div key={col.stage} className="w-56 shrink-0">
            <h3 className="mb-3 text-center text-sm font-semibold text-[color:var(--accent)]">{STAGE_LABEL[col.stage]}</h3>
            <div className="flex flex-col gap-3">
              {col.ties.map((t, i) => (
                <TieCard key={t.slot ?? i} tie={t} mode={mode} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Wejście: drabinka. `decided` = faza pucharowa/zakończona → realne pary.
// Inaczej: zakładka "Drabinka" pokazuje placeholdery, a prognoza modelu siedzi
// w OSOBNEJ zakładce "Symulacja" (nie mieszamy).
export function BracketView({ ties, decided }: { ties: WCTie[]; decided: boolean }) {
  const [tab, setTab] = useState<"real" | "sim">("real")

  if (ties.length === 0)
    return (
      <p className="rounded-[1.6rem] border border-white/12 bg-white/[0.04] p-8 text-center text-white/60">
        Drabinka pojawi się po zakończeniu fazy grupowej.
      </p>
    )

  // Faza pucharowa/zakończona — realne pary, bez zakładek.
  if (decided) return <BracketColumns ties={ties} mode="real" />

  // Przed rozstrzygnięciem grup: czy model dostarczył prognozę?
  const hasSimulation = ties.some((t) => (t.home != null && t.home !== "") || t.prob_home != null)

  if (!hasSimulation) return <BracketColumns ties={ties} mode="placeholder" />

  return (
    <div>
      <AnimatedTabs
        groupId="wc-bracket"
        className="mb-4"
        value={tab}
        onChange={(k) => setTab(k as "real" | "sim")}
        items={[
          { key: "real", label: "Drabinka" },
          { key: "sim", label: "Symulacja modelu" },
        ]}
      />
      {tab === "real" ? (
        <>
          <p className="mb-4 rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white/65">
            Pary zostaną ustalone po fazie grupowej. Poniżej schemat drabinki z miejscami awansu.
          </p>
          <BracketColumns ties={ties} mode="placeholder" />
        </>
      ) : (
        <>
          <p className="mb-4 flex items-center gap-2 rounded-2xl border border-amber-300/30 bg-amber-300/[0.08] px-4 py-3 text-sm text-amber-100/90">
            <FlaskConical className="h-4 w-4 shrink-0 text-amber-300" />
            <span><strong>Symulacja</strong> — prognoza modelu, nie oficjalna drabinka. Pary i wyniki mogą się zmienić.</span>
          </p>
          <BracketColumns ties={ties} mode="simulation" />
        </>
      )}
    </div>
  )
}
