"use client"

import { useState } from "react"
import Link from "next/link"
import type { WCGroup, WCStatus } from "@/lib/extra-types"
import { flagForNation } from "@/lib/design"
import { AnimatedTabs, TabPanel } from "@/components/ui/tabs"

const STATUS_DOT: Record<WCStatus, string> = {
  advance: "bg-emerald-400",
  playoff: "bg-amber-300",
  out: "bg-rose-400",
}
const STATUS_ROW: Record<WCStatus, string> = {
  advance: "border-l-emerald-400",
  playoff: "border-l-amber-300",
  out: "border-l-rose-400",
}

function GroupTable({ group }: { group: WCGroup }) {
  if (group.teams.length === 0)
    return <p className="rounded-[1.4rem] border border-white/12 bg-white/[0.04] p-6 text-white/60">Brak danych grupy.</p>
  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-white/12 bg-white/[0.04]">
      <table className="w-full text-sm">
        <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/55">
          <tr>
            <th className="px-3 py-2.5 text-left">#</th>
            <th className="px-2 py-2.5 text-left">Drużyna</th>
            <th className="px-2 py-2.5 text-center">M</th>
            <th className="px-2 py-2.5 text-center">W</th>
            <th className="px-2 py-2.5 text-center">R</th>
            <th className="px-2 py-2.5 text-center">P</th>
            <th className="px-2 py-2.5 text-center">Br.</th>
            <th className="px-2 py-2.5 text-center">Pkt</th>
            <th className="px-2 py-2.5 text-center">% awansu</th>
          </tr>
        </thead>
        <tbody>
          {group.teams.map((t) => (
            <tr
              key={`${t.position}-${t.team}`}
              className={`border-b border-l-4 border-white/5 ${t.status ? STATUS_ROW[t.status] : "border-l-transparent"} last:border-b-0`}
            >
              <td className="px-3 py-2.5 text-white/50">
                <span className={`mr-2 inline-block h-2 w-2 rounded-full ${t.status ? STATUS_DOT[t.status] : "bg-white/30"}`} />
                {t.position}
              </td>
              <td className="px-2 py-2.5">
                <span className="mr-1.5">{flagForNation(t.team)}</span>
                {t.team_id != null ? (
                  <Link href={`/druzyna/${t.team_id}`} className="font-medium transition hover:text-[color:var(--accent)] hover:underline">
                    {t.team}
                  </Link>
                ) : (
                  <span className="font-medium">{t.team}</span>
                )}
              </td>
              <td className="px-2 py-2.5 text-center">{t.played}</td>
              <td className="px-2 py-2.5 text-center">{t.win}</td>
              <td className="px-2 py-2.5 text-center">{t.draw}</td>
              <td className="px-2 py-2.5 text-center">{t.loss}</td>
              <td className="px-2 py-2.5 text-center text-white/60">{t.gf}:{t.ga}</td>
              <td className="px-2 py-2.5 text-center font-semibold text-[color:var(--accent)]">{t.points}</td>
              <td className="px-2 py-2.5 text-center font-medium">{t.advance_pct != null ? `${t.advance_pct}%` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function GroupsView({ groups }: { groups: WCGroup[] }) {
  const [active, setActive] = useState(groups[0]?.name ?? "A")
  const [dir, setDir] = useState(1)
  const idx = groups.findIndex((g) => g.name === active)
  const current = groups[idx] ?? groups[0]

  function go(name: string) {
    const ni = groups.findIndex((g) => g.name === name)
    setDir(ni >= idx ? 1 : -1)
    setActive(name)
  }

  if (groups.length === 0)
    return (
      <p className="rounded-[1.6rem] border border-white/12 bg-white/[0.04] p-8 text-center text-white/60">
        Brak danych grupowych w aktualnym źródle danych.
      </p>
    )

  return (
    <div>
      <AnimatedTabs
        groupId="wc-groups"
        className="mb-5"
        value={active}
        onChange={go}
        items={groups.map((g) => ({ key: g.name, label: g.name }))}
      />
      <TabPanel
        tabKey={active}
        direction={dir}
        swipeable
        onSwipe={(d) => {
          const ni = Math.max(0, Math.min(groups.length - 1, idx + d))
          go(groups[ni].name)
        }}
      >
        <h2 className="mb-3 text-xl font-semibold">Grupa {current.name}</h2>
        <GroupTable group={current} />
      </TabPanel>

      <div className="mt-5 flex flex-wrap gap-4 text-xs text-white/60">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> awans</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-300" /> walka o 3. miejsce</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-400" /> odpada</span>
      </div>
    </div>
  )
}
