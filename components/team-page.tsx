import Link from "next/link"
import Image from "next/image"
import type { BetType } from "@/lib/types"
import type { TeamSeason, UpcomingMatch } from "@/lib/extra-types"
import { BET_TYPE_SHORT } from "@/lib/labels"
import { FormSquares } from "./form-squares"

const ACCENT: Record<BetType, { ring: string; text: string; bar: string }> = {
  BTTS: { ring: "border-l-emerald-400", text: "text-emerald-300", bar: "bg-emerald-400" },
  OVER_1_5: { ring: "border-l-cyan-400", text: "text-cyan-300", bar: "bg-cyan-400" },
  MIX: { ring: "border-l-violet-400", text: "text-violet-300", bar: "bg-violet-400" },
  THRILLER: { ring: "border-l-amber-400", text: "text-amber-300", bar: "bg-amber-400" },
}

function fmt(iso: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
  }).format(d)
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
      <p className="text-xs text-white/60">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function UpcomingCard({ m, teamName }: { m: UpcomingMatch; teamName: string }) {
  // najmocniejszy tryb z Q≥70 → akcent koloru karty
  const best = [...m.predictions].filter((p) => p.q_score >= 70).sort((a, b) => b.q_score - a.q_score)[0]
  const accent = best ? ACCENT[best.bet_type] : null
  const hasEvent = m.event_id !== "" && m.event_id != null
  const className = `block rounded-[1.4rem] border border-l-4 bg-white/[0.05] p-5 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/[0.08] ${
    accent ? accent.ring : "border-l-white/15"
  } border-white/12`

  const inner = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs uppercase tracking-[0.16em] text-white/60">{m.league}</span>
        <span className="text-sm text-white/55">{fmt(m.kickoff_utc)}</span>
      </div>
      <h4 className="mt-2 font-semibold">
        {m.home && m.away ? (
          <>
            {m.home} <span className="text-white/55">vs</span> {m.away}
          </>
        ) : (
          <>
            {teamName} <span className="text-white/55">vs</span> {m.opponent || "—"}
          </>
        )}
      </h4>

      {m.predictions.length > 0 ? (
        <div className="mt-4 space-y-2">
          {m.predictions.map((p, i) => {
            const a = ACCENT[p.bet_type]
            return (
              <div key={i} className="flex items-center gap-3">
                <span className={`w-20 shrink-0 text-xs font-medium ${a.text}`}>{BET_TYPE_SHORT[p.bet_type]}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                  <span className={`block h-full rounded-full ${a.bar}`} style={{ width: `${p.q_score}%` }} />
                </span>
                <span className="w-8 shrink-0 text-right text-xs font-semibold text-white/70">{p.q_score}</span>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="mt-3 text-sm text-white/60">Brak predykcji.</p>
      )}
    </>
  )

  return hasEvent ? (
    <Link href={`/mecz/${m.event_id}`} className={className}>
      {inner}
    </Link>
  ) : (
    <div className={className}>{inner}</div>
  )
}

export function TeamPage({ team, upcoming }: { team: TeamSeason; upcoming: UpcomingMatch[] }) {
  const total = team.wins + team.draws + team.losses || 1
  const wPct = (team.wins / total) * 100
  const dPct = (team.draws / total) * 100
  const lPct = (team.losses / total) * 100

  return (
    <div>
      {/* nagłówek */}
      <div className="mb-8 flex items-center gap-4 rounded-[2rem] border border-white/12 bg-white/[0.05] p-6 backdrop-blur">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/12 bg-white/[0.06]">
          {team.logo ? (
            <Image src={team.logo} alt={team.name} width={64} height={64} className="h-full w-full object-contain" />
          ) : (
            <span className="text-2xl font-bold text-[color:var(--accent)]">{team.name.charAt(0)}</span>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{team.name}</h1>
          <p className="mt-1 text-sm text-white/55">
            {team.league} · {team.country}
          </p>
        </div>
      </div>

      {/* statystyki sezonu */}
      <h2 className="mb-4 text-xl font-semibold">Sezon</h2>
      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Mecze" value={`${team.played}`} />
        <Stat label="Bramki" value={`${team.gf}:${team.ga}`} />
        <Stat label="BTTS" value={team.btts_pct != null ? `${team.btts_pct}%` : "—"} />
        <Stat label="Over 2.5" value={team.over25_pct != null ? `${team.over25_pct}%` : "—"} />
      </div>

      {/* W/D/L wizualnie */}
      <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-emerald-300">{team.wins} W</span>
          <span className="text-white/55">{team.draws} R</span>
          <span className="text-rose-300">{team.losses} P</span>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
          <span className="bg-emerald-400/90" style={{ width: `${wPct}%` }} />
          <span className="bg-white/30" style={{ width: `${dPct}%` }} />
          <span className="bg-rose-400/90" style={{ width: `${lPct}%` }} />
        </div>
      </div>

      {/* forma */}
      <h2 className="mb-3 text-xl font-semibold">Forma (ostatnie {team.form.length || 0})</h2>
      <div className="mb-8">
        <FormSquares results={team.form} />
      </div>

      {/* strzelcy */}
      {team.scorers.length > 0 && (
        <>
          <h2 className="mb-3 text-xl font-semibold">Najlepsi strzelcy</h2>
          <div className="mb-8 overflow-hidden rounded-[1.4rem] border border-white/12 bg-white/[0.04]">
            {team.scorers.slice(0, 5).map((s, i) => (
              <div
                key={`${s.player}-${i}`}
                className="flex items-center justify-between border-b border-white/5 px-5 py-3 text-sm last:border-0"
              >
                <span className="font-medium">{s.player}</span>
                <span className="text-white/60">
                  <span className="font-semibold text-[color:var(--accent)]">{s.goals}</span> gol(i)
                  {s.assists ? ` · ${s.assists} as.` : ""}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* najbliższe mecze */}
      <h2 className="mb-4 text-xl font-semibold">Najbliższe mecze</h2>
      {upcoming.length === 0 ? (
        <p className="rounded-[1.4rem] border border-white/12 bg-white/[0.04] p-6 text-white/55">
          Brak nadchodzących meczów.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {upcoming.map((m, i) => (
            <UpcomingCard key={`${m.event_id}-${i}`} m={m} teamName={team.name} />
          ))}
        </div>
      )}
    </div>
  )
}
