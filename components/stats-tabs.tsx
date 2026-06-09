"use client"

import Link from "next/link"
import { useState } from "react"
import { BarChart3, Lock, Ticket } from "lucide-react"
import type { StatsResponse } from "@/lib/stats-types"
import { StatsView } from "./stats-view"
import { MyPicks } from "./my-picks"
import { AnimatedTabs, TabPanel } from "./ui/tabs"

const TABS = ["bot", "mine"] as const
type Tab = (typeof TABS)[number]

export function StatsTabs({
  initial,
  initialPeriod,
  loggedIn,
}: {
  initial: StatsResponse
  initialPeriod: string
  loggedIn: boolean
}) {
  const [tab, setTab] = useState<Tab>("bot")
  const [dir, setDir] = useState(1)

  function go(next: Tab) {
    setDir(TABS.indexOf(next) >= TABS.indexOf(tab) ? 1 : -1)
    setTab(next)
  }

  return (
    <div>
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Statystyki</h1>
      <p className="mt-3 mb-6 text-white/55">Skuteczność typów bota oraz Twoich zapisanych kuponów.</p>

      <h2 className="sr-only">Wybór zakładki statystyk</h2>
      <AnimatedTabs
        groupId="stats-tabs"
        className="mb-8"
        value={tab}
        onChange={(k) => go(k as Tab)}
        items={[
          { key: "bot", label: "Typy bota", icon: BarChart3 },
          { key: "mine", label: "Moje kupony", icon: Ticket },
        ]}
      />

      <TabPanel
        tabKey={tab}
        direction={dir}
        swipeable
        onSwipe={(d) => go(TABS[Math.max(0, Math.min(TABS.length - 1, TABS.indexOf(tab) + d))])}
      >
        {tab === "bot" ? (
          <StatsView initial={initial} initialPeriod={initialPeriod} />
        ) : loggedIn ? (
          <MyPicks />
        ) : (
          <div className="grid place-items-center rounded-[1.8rem] border border-white/12 bg-white/[0.04] p-12 text-center">
            <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-[color:var(--accent)]/30 bg-[var(--accent)]/10 text-[color:var(--accent)]">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold">Zaloguj się, żeby śledzić swoje kupony</h3>
            <p className="mt-2 max-w-sm text-white/55">
              Zapisuj typy bota do własnych kuponów i śledź swoje ROI, skuteczność i bilans.
            </p>
            <Link
              href="/login"
              className="mt-6 rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-[color:var(--on-accent)] transition hover:scale-105"
            >
              Zaloguj przez Telegram
            </Link>
          </div>
        )}
      </TabPanel>
    </div>
  )
}
