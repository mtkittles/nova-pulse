"use client"

import Link from "next/link"
import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { BarChart3, Lock, Ticket } from "lucide-react"
import type { StatsResponse } from "@/lib/stats-types"
import { StatsView } from "./stats-view"
import { MyPicks } from "./my-picks"

type Tab = "bot" | "mine"

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

  const tabBtn = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition ${
      active
        ? "border-[color:var(--accent)]/40 bg-[var(--accent)]/15 text-white"
        : "border-white/12 bg-white/[0.05] text-white/60 hover:bg-white/10"
    }`

  return (
    <div>
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Statystyki</h1>
      <p className="mt-3 mb-6 text-white/55">Skuteczność typów bota oraz Twoich zapisanych kuponów.</p>

      <h2 className="sr-only">Wybór zakładki statystyk</h2>
      <div className="mb-8 flex flex-wrap gap-2">
        <button type="button" onClick={() => setTab("bot")} className={tabBtn(tab === "bot")}>
          <BarChart3 className="h-4 w-4" /> Typy bota
        </button>
        <button type="button" onClick={() => setTab("mine")} className={tabBtn(tab === "mine")}>
          <Ticket className="h-4 w-4" /> Moje kupony
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
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
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
