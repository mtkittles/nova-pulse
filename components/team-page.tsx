"use client"

import { useState } from "react"
import Link from "next/link"
import { Activity, BarChart3, CalendarClock, Target } from "lucide-react"
import type { TeamSeason, UpcomingMatch } from "@/lib/extra-types"
import { BET_TYPE_SHORT } from "@/lib/labels"
import { TeamBadge } from "./team-badge"
import { FormSquares } from "./form-squares"
import { TeamFormTable } from "./team-form-table"
import { TeamSplitStats } from "./team-split-stats"
import { AnimatedTabs, TabPanel } from "./ui/tabs"

const TABS = ["stats", "form", "fixtures", "scorers"] as const
type Tab = (typeof TABS)[number]

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
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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

function pctTxt(v: number | null | undefined): string {
  return v != null ? `${v}%` : "—"
}

// Akcent terminarza wg progów szans.
function fixtureAccent(m: UpcomingMatch): { ring: string; badge: string; label: string } | null {
  const prob = (bt: string) => m.predictions.find((p) => p.bet_type === bt)?.model_prob ?? 0
  const btts = prob("BTTS")
  const o15 = prob("OVER_1_5")
  const thr = prob("THRILLER")
  if (btts > 0.65)
    return { ring: "border-l-emerald-400", badge: "bg-emerald-400/15 text-emerald-200", label: `BTTS ${Math.round(btts * 100)}%` }
  if (o15 > 0.6)
    return { ring: "border-l-cyan-400", badge: "bg-cyan-400/15 text-cyan-200", label: `Over 1.5 ${Math.round(o15 * 100)}%` }
  if (thr > 0.05)
    return { ring: "border-l-amber-400", badge: "bg-amber-300/15 text-amber-200", label: `Thriller ${Math.round(thr * 100)}%` }
  return null
}

function FixtureCard({ m, teamName }: { m: UpcomingMatch; teamName: string }) {
  const acc = fixtureAccent(m)
  const hasEvent = m.event_id !== "" && m.event_id != null
  const cls = `block rounded-[1.4rem] border border-white/12 border-l-4 bg-white/[0.05] p-5 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/[0.08] ${
    acc ? acc.ring : "border-l-white/15"
  }`
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
      {acc && (
        <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${acc.badge}`}>
          ★ {acc.label}
        </span>
      )}
      {m.predictions.length > 0 ? (
        <div className="mt-3 space-y-2">
          {m.predictions.map((p, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-xs font-medium text-white/70">{BET_TYPE_SHORT[p.bet_type]}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                <span className="block h-full rounded-full bg-[var(--accent)]" style={{ width: `${p.q_score ?? 0}%` }} />
              </span>
              <span className="w-8 shrink-0 text-right text-xs font-semibold text-white/70">{p.q_score ?? "—"}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-white/60">Brak predykcji.</p>
      )}
    </>
  )
  return hasEvent ? (
    <Link href={`/mecz/${m.event_id}`} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  )
}

export function TeamPage({ team, upcoming }: { team: TeamSeason; upcoming: UpcomingMatch[] }) {
  const [tab, setTab] = useState<Tab>("stats")
  const [dir, setDir] = useState(1)
  function go(next: Tab) {
    setDir(TABS.indexOf(next) >= TABS.indexOf(tab) ? 1 : -1)
    setTab(next)
  }

  const total = team.wins + team.draws + team.losses || 1
  const wPct = (team.wins / total) * 100
  const dPct = (team.draws / total) * 100
  const lPct = (team.losses / total) * 100

  return (
    <div>
      {/* nagłówek */}
      <div className="mb-6 flex items-center gap-4 rounded-[2rem] border border-white/12 bg-white/[0.05] p-6 backdrop-blur">
        <TeamBadge teamName={team.name} logoUrl={team.logo} size="xl" />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{team.name}</h1>
          <p className="mt-1 text-sm text-white/55">
            {team.league} · {team.country}
            {team.position != null && <> · {team.position}. miejsce</>}
          </p>
        </div>
      </div>

      <AnimatedTabs
        groupId="team-tabs"
        className="mb-6"
        value={tab}
        onChange={(k) => go(k as Tab)}
        items={[
          { key: "stats", label: "Statystyki", icon: BarChart3 },
          { key: "form", label: "Forma", icon: Activity },
          { key: "fixtures", label: "Terminarz", icon: CalendarClock },
          { key: "scorers", label: "Strzelcy", icon: Target },
        ]}
      />

      <TabPanel tabKey={tab} direction={dir}>
        {tab === "stats" && (
          <div>
            <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Mecze" value={`${team.played}`} />
              <Stat label="Bramki" value={`${team.gf}:${team.ga}`} />
              <Stat label="BTTS" value={pctTxt(team.btts_pct)} />
              <Stat label="Over 2.5" value={pctTxt(team.over25_pct)} />
            </div>

            <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-emerald-300">{team.wins} W</span>
                <span className="text-amber-200">{team.draws} R</span>
                <span className="text-rose-300">{team.losses} P</span>
              </div>
              <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
                <span className="bg-emerald-400/90" style={{ width: `${wPct}%` }} />
                <span className="bg-amber-300/70" style={{ width: `${dPct}%` }} />
                <span className="bg-rose-400/90" style={{ width: `${lPct}%` }} />
              </div>
            </div>

            <h3 className="mb-3 text-lg font-semibold">Dom vs Wyjazd</h3>
            <TeamSplitStats
              teamId={team.team_id}
              fallbackHome={team.home_stats}
              fallbackAway={team.away_stats}
            />
          </div>
        )}

        {tab === "form" && <TeamFormTable teamId={team.team_id} teamName={team.name} />}

        {tab === "fixtures" && (
          <div>
            {upcoming.length === 0 ? (
              <p className="rounded-[1.4rem] border border-white/12 bg-white/[0.04] p-6 text-white/60">
                Brak nadchodzących meczów w aktualnym źródle danych.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {upcoming.map((m, i) => (
                  <FixtureCard key={`${m.event_id}-${i}`} m={m} teamName={team.name} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "scorers" && (
          <div>
            <div className="mb-6">
              <p className="mb-2 text-sm text-white/60">Ostatnia forma</p>
              <FormSquares results={team.form} />
            </div>
            {team.scorers.length === 0 ? (
              <p className="rounded-[1.4rem] border border-white/12 bg-white/[0.04] p-6 text-white/60">
                Brak danych o strzelcach dla tej drużyny w aktualnym źródle danych.
              </p>
            ) : (
              <div className="overflow-hidden rounded-[1.4rem] border border-white/12 bg-white/[0.04]">
                {team.scorers.slice(0, 8).map((s, i) => (
                  <div
                    key={`${s.player}-${i}`}
                    className="flex items-center justify-between border-b border-white/5 px-5 py-3 text-sm last:border-0"
                  >
                    <span className="font-medium">
                      <span className="mr-2 text-white/40">{i + 1}.</span>
                      {s.player}
                    </span>
                    <span className="text-white/60">
                      <span className="font-semibold text-[color:var(--accent)]">{s.goals}</span> gol(i)
                      {s.assists ? ` · ${s.assists} as.` : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </TabPanel>
    </div>
  )
}
