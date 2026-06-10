import Link from "next/link"
import type { WCStage, WCTie } from "@/lib/extra-types"
import { flagForNation } from "@/lib/design"
import { STAGE_LABEL } from "./wc-match-card"

const ORDER: WCStage[] = ["R32", "R16", "QF", "SF", "FINAL", "3RD"]

function TieSide({ team, score, fav }: { team?: string | null; score?: number | null; fav: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1 ${fav ? "bg-[var(--accent)]/15" : ""}`}>
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="text-base leading-none">{team ? flagForNation(team) : "🏳️"}</span>
        <span className={`truncate text-sm ${fav ? "font-semibold text-white" : "text-white/75"}`}>
          {team || "—"}
        </span>
      </span>
      {score != null && <span className="shrink-0 text-sm font-bold tabular-nums">{score}</span>}
    </div>
  )
}

function TieCard({ tie }: { tie: WCTie }) {
  const favHome = tie.winner === "home" || (tie.winner == null && (tie.prob_home ?? 0) >= 0.5)
  const favAway = tie.winner === "away" || (tie.winner == null && (tie.prob_home ?? 1) < 0.5 && tie.prob_home != null)
  const card = (
    <div className="rounded-xl border border-white/12 bg-white/[0.05] p-2.5">
      <TieSide team={tie.home} score={tie.home_score} fav={favHome} />
      <TieSide team={tie.away} score={tie.away_score} fav={favAway} />
      {tie.winner == null && tie.prob_home != null && (
        <p className="mt-1 text-center text-[10px] text-white/45">
          szansa: {Math.round((tie.prob_home ?? 0) * 100)}% / {Math.round((1 - (tie.prob_home ?? 0)) * 100)}%
        </p>
      )}
    </div>
  )
  return tie.event_id ? (
    <Link href={`/mecz/${tie.event_id}`} className="block transition hover:brightness-125">
      {card}
    </Link>
  ) : (
    card
  )
}

export function BracketView({ ties }: { ties: WCTie[] }) {
  if (ties.length === 0)
    return (
      <p className="rounded-[1.6rem] border border-white/12 bg-white/[0.04] p-8 text-center text-white/60">
        Drabinka pojawi się po zakończeniu fazy grupowej.
      </p>
    )
  const byStage = ORDER.map((st) => ({ stage: st, ties: ties.filter((t) => t.stage === st) })).filter((c) => c.ties.length)

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-4">
        {byStage.map((col) => (
          <div key={col.stage} className="w-56 shrink-0">
            <h3 className="mb-3 text-center text-sm font-semibold text-[color:var(--accent)]">
              {STAGE_LABEL[col.stage]}
            </h3>
            <div className="flex flex-col gap-3">
              {col.ties.map((t, i) => (
                <TieCard key={t.slot ?? i} tie={t} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
