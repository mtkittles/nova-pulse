import Link from "next/link"
import { Flame } from "lucide-react"
import type { ThrillerSpotlight as ThrillerSpotlightData } from "@/lib/demo-tips"
import { getLeagueDisplayName } from "@/lib/leagues"
import { formatKickoff } from "@/lib/time"
import { fmtOdds, fmtQ } from "@/lib/format"
import { TeamBadge } from "../team-badge"
import { ScrollReveal } from "../scroll-reveal"

/**
 * "Mecz wieczoru" — jeden wyróżniony mecz, niezależny od tego czy ma typ.
 * Karta świadomie szersza i z większymi herbami niż zwykłe karty siatki —
 * to jedna wyróżniona pozycja, nie kolejny element listy.
 */
export function ThrillerSpotlight({ data }: { data: ThrillerSpotlightData | null }) {
  if (!data) return null

  const leagueText = getLeagueDisplayName(data.league)
  const finished = data.match_status === "FINISHED"
  const live = data.match_status === "IN_PLAY"
  const hasScore = data.home_score != null && data.away_score != null

  return (
    <ScrollReveal>
      <Link
        href={`/mecz/${data.event_id}`}
        className="lift group block overflow-hidden rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-1)] p-5 md:p-8"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--cyan)]/40 bg-[var(--cyan-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--cyan)]">
            <Flame className="h-3.5 w-3.5" /> {data.tag}
          </span>

          {data.badge && (
            <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-[var(--bg-0)] px-3 py-1 text-xs">
              <span className="font-semibold text-[color:var(--text-primary)]">{data.badge.marketLabel}</span>
              <span className="text-[color:var(--text-muted)]">·</span>
              <span className="font-bold text-[color:var(--cyan)] tnum">{fmtOdds(data.badge.odds)}</span>
              <span className="text-[color:var(--text-muted)]">·</span>
              <span className="tnum text-[color:var(--text-secondary)]">Q {fmtQ(data.badge.q_score)}</span>
            </span>
          )}
        </div>

        <p className="mt-4 text-center text-xs uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
          {leagueText}
        </p>

        <div className="mt-3 flex items-center justify-center gap-6 sm:gap-12">
          <div className="flex min-w-0 flex-col items-center gap-2.5">
            <TeamBadge teamName={data.home_team} logoUrl={data.home_team_logo} size="xl" />
            <span className="max-w-[9rem] truncate text-center text-base font-semibold sm:max-w-[12rem] sm:text-lg">
              {data.home_team}
            </span>
          </div>

          <div className="flex shrink-0 flex-col items-center">
            {hasScore && (live || finished) ? (
              <span className={`text-3xl font-extrabold tnum sm:text-4xl ${live ? "text-[color:var(--cyan)]" : "text-[color:var(--text-primary)]"}`}>
                {data.home_score} : {data.away_score}
              </span>
            ) : (
              <span className="text-sm font-medium text-[color:var(--text-secondary)] sm:text-base">
                {formatKickoff(data.kickoff_utc)}
              </span>
            )}
            {live && <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--cyan)]">na żywo</span>}
          </div>

          <div className="flex min-w-0 flex-col items-center gap-2.5">
            <TeamBadge teamName={data.away_team} logoUrl={data.away_team_logo} size="xl" />
            <span className="max-w-[9rem] truncate text-center text-base font-semibold sm:max-w-[12rem] sm:text-lg">
              {data.away_team}
            </span>
          </div>
        </div>

        <ul className="mx-auto mt-6 max-w-md space-y-1.5 text-center text-sm text-[color:var(--text-secondary)]">
          {data.facts.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>

        <p className="mt-5 text-center text-xs font-medium text-[color:var(--text-muted)] transition-colors duration-150 group-hover:text-[color:var(--cyan)]">
          Zobacz analizę meczu →
        </p>
      </Link>
    </ScrollReveal>
  )
}
