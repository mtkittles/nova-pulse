import Link from "next/link"
import type { RankingTeam } from "@/lib/extra-types"
import { getLeagueDisplayName } from "@/lib/leagues"
import { scaleColor } from "@/lib/design"
import { TeamCrest } from "./ui/team-crest"
import { ArrowRight, CalendarDays } from "lucide-react"

function fmtDate(iso: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(d)
}

// procent może przyjść jako 0..1 lub 0..100 — normalizuj do liczby %
function asPct(v: number | null | undefined): number | null {
  if (v == null || !Number.isFinite(v)) return null
  return v <= 1 ? Math.round(v * 100) : Math.round(v)
}

export function RankingTeamCard({ team, market }: { team: RankingTeam; market: string }) {
  const pct = asPct(team.pct_last10) ?? 0
  const color = scaleColor(pct / 100)
  const league = team.league_code ? getLeagueDisplayName(team.league_code) : team.league
  const nm = team.next_match
  const pred = nm ? asPct(nm.predicted_prob) : null
  const homeAway = nm?.home_away?.toLowerCase().startsWith("h")
    ? "dom"
    : nm?.home_away?.toLowerCase().startsWith("a")
      ? "wyj"
      : ""

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--border)] bg-[var(--bg-card)] p-5 shadow-2xl shadow-black/20">
      <p className="truncate text-xs uppercase tracking-[0.16em] text-[color:var(--text-muted)]">{league}</p>

      <div className="mt-3 flex items-center gap-2.5">
        <TeamCrest name={team.team_name} size={36} />
        <Link
          href={`/druzyna/${team.team_id}`}
          className="truncate text-base font-semibold leading-tight transition hover:text-[color:var(--accent)] hover:underline"
        >
          {team.team_name}
        </Link>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-3xl font-extrabold tabular-nums" style={{ color }}>
            {pct}%
          </p>
          <p className="text-xs text-[color:var(--text-muted)]">{market} · ost. 10 meczów</p>
        </div>
      </div>

      {nm ? (
        nm.event_id != null ? (
          <Link
            href={`/mecz/${nm.event_id}`}
            className="group mt-4 rounded-2xl border border-[color:var(--border)] bg-white/[0.04] p-3 transition hover:bg-white/[0.08]"
          >
            <div className="flex items-center justify-between gap-2 text-xs text-[color:var(--text-muted)]">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" /> {fmtDate(nm.date)}
              </span>
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </div>
            <p className="mt-1 truncate text-sm font-medium">
              vs {nm.opponent}
              {homeAway && <span className="ml-1.5 text-[10px] uppercase text-[color:var(--text-muted)]">{homeAway}</span>}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              {pred != null ? (
                <span
                  className="rounded-full px-2 py-0.5 font-semibold"
                  style={{ background: `${scaleColor(pred / 100)}22`, color: scaleColor(pred / 100) }}
                >
                  Predykcja {pred}%
                </span>
              ) : (
                <span className="rounded-full border border-[color:var(--border)] px-2 py-0.5 text-[color:var(--text-muted)]">
                  Predykcja wkrótce
                </span>
              )}
              {nm.q_score != null && (
                <span className="rounded-full border border-[color:var(--accent)]/30 bg-[var(--accent)]/10 px-2 py-0.5 font-semibold text-[color:var(--accent)]">
                  Q {nm.q_score}
                </span>
              )}
            </div>
          </Link>
        ) : (
          <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-white/[0.04] p-3 text-sm text-[color:var(--text-muted)]">
            Najbliższy mecz: vs {nm.opponent} · {fmtDate(nm.date)}
          </div>
        )
      ) : (
        <p className="mt-4 rounded-2xl border border-[color:var(--border)] bg-white/[0.04] p-3 text-sm text-[color:var(--text-muted)]">
          Brak nadchodzącego meczu.
        </p>
      )}
    </div>
  )
}
