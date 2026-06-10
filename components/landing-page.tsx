"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Cpu,
  Flame,
  Gauge,
  Lock,
  Menu,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  TrendingUp,
  X,
  Zap,
} from "lucide-react"
import type { BetType, Tip } from "@/lib/types"
import { BET_TYPE_SHORT } from "@/lib/labels"
import { Brand } from "./brand"
import { ThemeToggle } from "./theme-toggle"
import { Faq } from "./faq"
import { CountUp } from "./ui/count-up"
import { AnimatedTabs } from "./ui/tabs"
import { StaggerGrid, StaggerItem } from "./ui/stagger"
import { plMatches } from "@/lib/i18n"
import TipCard from "./tip-card"

type LandingProps = {
  loggedIn?: boolean
  topTips: Tip[]
  todayTips: Tip[]
  wcTips: Tip[]
  matchesToday: number
  winRate: number // 0..1
  roi: number // np. 0.05
  totalTips: number
  settledTips: number
  avgQScore: number // 0..100
  leaguesCount: number
}

// Start MŚ 2026 — mecz otwarcia (Meksyk, 11.06.2026). Czas lokalny Meksyku (CST, -06:00).
const WC_START = new Date("2026-06-11T18:00:00-06:00").getTime()

const navItems = [
  { label: "Start", href: "#start" },
  { label: "Mundial", href: "#mundial" },
  { label: "Dziś", href: "#today" },
  { label: "Jak to działa", href: "#how" },
  { label: "FAQ", href: "#faq" },
]

const modes = [
  {
    icon: Target,
    name: "BTTS",
    desc: "Obie drużyny strzelą. Najstabilniejszy rynek, oparty na formie ofensywnej i defensywnej.",
    risk: "Ryzyko: niskie",
  },
  {
    icon: TrendingUp,
    name: "Over 1.5",
    desc: "W meczu padną co najmniej 2 gole. Wysoka trafialność przy niższych kursach.",
    risk: "Ryzyko: niskie",
  },
  {
    icon: Zap,
    name: "Mix",
    desc: "Silnik wybiera lepszy z BTTS / Over 1.5 dla każdego meczu osobno.",
    risk: "Ryzyko: średnie",
  },
  {
    icon: Flame,
    name: "Thriller 3:2 / 2:3",
    desc: "Dokładny wynik w strefie thriller. Wysokie kursy, ale to loteria — gra tylko świadoma.",
    risk: "Ryzyko: wysokie",
  },
]

const howItWorks = [
  {
    icon: Cpu,
    title: "Model Dixon-Coles",
    text: "Statystyczny model goli + ELO i kalibracja Platta liczy prawdopodobieństwa z dziesiątek tysięcy meczów — bez zaglądania w przyszłość.",
  },
  {
    icon: Gauge,
    title: "Q-Score",
    text: "Każdy typ dostaje ocenę jakości 0–100. Im wyższy Q-Score, tym pewniejszy sygnał — kolory kart prowadzą wzrok.",
  },
  {
    icon: Activity,
    title: "Auto-weryfikacja",
    text: "Po meczu live-tracker sprawdza wynik i aktualizuje skuteczność co ~30 min. Statystyki są prawdziwe, nie deklarowane.",
  },
  {
    icon: Sparkles,
    title: "Pięć trybów",
    text: "BTTS, Over 1.5, Mix, Thriller oraz tryb Mundialu — jeden silnik, rynek dobrany do meczu.",
  },
]

// Licznik z animacją od 0. SSR i pierwszy render klienta = 0 → brak rozjazdu hydratacji.
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Odliczanie do startu MŚ — rusza po zamontowaniu (brak rozjazdu hydratacji).
function Countdown({ target }: { target: number }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const diff = now == null ? 0 : Math.max(0, target - now)
  const d = Math.floor(diff / 86_400_000)
  const h = Math.floor((diff % 86_400_000) / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1000)
  const parts = [
    { v: d, l: "dni" },
    { v: h, l: "godz" },
    { v: m, l: "min" },
    { v: s, l: "sek" },
  ]

  return (
    <div className="flex gap-2 sm:gap-3" aria-label="Odliczanie do startu Mistrzostw Świata 2026">
      {parts.map((p) => (
        <div
          key={p.l}
          className="min-w-[3.5rem] rounded-2xl border border-white/15 bg-[var(--bg)]/50 px-2 py-2.5 text-center backdrop-blur sm:min-w-[4.5rem] sm:px-4"
        >
          <p className="text-2xl font-semibold tabular-nums text-white sm:text-3xl">
            {now == null ? "—" : String(p.v).padStart(2, "0")}
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/60 sm:text-xs">{p.l}</p>
        </div>
      ))}
    </div>
  )
}

const MODES: { key: "ALL" | BetType; label: string }[] = [
  { key: "ALL", label: "Wszystkie" },
  { key: "BTTS", label: BET_TYPE_SHORT.BTTS },
  { key: "OVER_1_5", label: BET_TYPE_SHORT.OVER_1_5 },
  { key: "MIX", label: BET_TYPE_SHORT.MIX },
  { key: "THRILLER", label: BET_TYPE_SHORT.THRILLER },
]

export default function LandingPage({
  loggedIn = false,
  topTips,
  todayTips,
  wcTips,
  matchesToday,
  winRate,
  roi,
  totalTips,
  settledTips,
  avgQScore,
  leaguesCount,
}: LandingProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [mode, setMode] = useState<"ALL" | BetType>("ALL")
  const roiSign = roi >= 0 ? "+" : ""
  const hasData = totalTips > 0
  const wcMatches = useMemo(() => new Set(wcTips.map((t) => String(t.event_id))).size, [wcTips])
  const wcLive = wcMatches > 0

  const modeCounts = useMemo(() => {
    const c: Record<string, number> = { ALL: todayTips.length }
    for (const t of todayTips) c[t.bet_type] = (c[t.bet_type] ?? 0) + 1
    return c
  }, [todayTips])

  const visibleTips = useMemo(() => {
    const list = mode === "ALL" ? todayTips : todayTips.filter((t) => t.bet_type === mode)
    return [...list].sort((a, b) => b.q_score - a.q_score).slice(0, 6)
  }, [todayTips, mode])

  const tipHref = (t: Tip) => (loggedIn ? `/mecz/${t.event_id}` : undefined)

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--bg)] text-white">
      {/* tło */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-[var(--glow-1)] blur-3xl" />
        <div className="absolute right-[-120px] top-40 h-96 w-96 rounded-full bg-[var(--glow-2)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>

      {/* header */}
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Brand />

        <nav className="hidden gap-8 text-sm text-white/60 lg:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Link
            href={loggedIn ? "/stats" : "/login"}
            className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[color:var(--on-accent)] transition hover:scale-105"
          >
            {loggedIn ? "Mój panel" : "Zaloguj"}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur md:hidden"
          aria-label="Otwórz menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="absolute left-6 right-6 top-20 z-30 rounded-3xl border border-white/15 bg-[var(--bg-soft)]/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl md:hidden"
          >
            <nav className="grid gap-2">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-2xl px-4 py-3 text-white/75 transition hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-1 flex items-center gap-2">
                <ThemeToggle />
              </div>
              <Link
                href={loggedIn ? "/stats" : "/login"}
                onClick={() => setMenuOpen(false)}
                className="mt-1 rounded-2xl bg-[var(--accent)] px-4 py-3 text-center font-semibold text-[color:var(--on-accent)]"
              >
                {loggedIn ? "Mój panel" : "Zaloguj"}
              </Link>
            </nav>
          </motion.div>
        )}
      </header>

      {/* HERO */}
      <section id="start" className="relative mx-auto max-w-7xl px-6 pb-10 pt-8 md:pt-12">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-3xl"
        >
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-[color:var(--accent)]/25 bg-[var(--accent)]/10 px-4 py-2 text-sm text-white/85 backdrop-blur">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
            </span>
            Model Dixon-Coles · auto-weryfikacja na żywo
          </div>

          <h1 className="text-5xl font-semibold tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Analiza,
            <br />
            <span className="text-[color:var(--accent)]">nie przeczucie.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-white/64">
            <span className="font-semibold text-white">LUPUS BETS</span> — interfejs nad silnikiem
            predykcji Lupus Bot. Typy BTTS, Over 1.5, Mix i Thriller z oceną Q-Score i realną,
            automatycznie weryfikowaną skutecznością.
          </p>
        </motion.div>

        {/* baner MŚ 2026 */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative z-10 mt-8 overflow-hidden rounded-[2rem] border border-[color:var(--accent)]/25 bg-gradient-to-br from-[var(--accent)]/15 via-white/[0.04] to-[var(--glow-2)] p-6 backdrop-blur md:p-8"
        >
          <div className="absolute right-[-30px] top-[-30px] h-40 w-40 rounded-full bg-[var(--glow-1)] blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white/85">
                <Trophy className="h-3.5 w-3.5 text-[color:var(--accent)]" /> Mistrzostwa Świata 2026
              </div>
              <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
                {wcLive ? (
                  <>
                    Dziś <span className="text-[color:var(--accent)]">{wcMatches}</span>{" "}
                    {plMatches(wcMatches)} Mundialu
                  </>
                ) : (
                  "Mundial startuje już wkrótce"
                )}
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-white/64">
                {wcLive
                  ? "Predykcje na mecze fazy turnieju — z Q-Score i kursem. Wejdź w pełny tryb Mundialu."
                  : "Mecz otwarcia 11 czerwca. Silnik szykuje typy na każdy mecz turnieju."}
              </p>
            </div>
            {!wcLive && <Countdown target={WC_START} />}
          </div>

          <div className="relative mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/typy"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-[color:var(--on-accent)] shadow-2xl transition hover:scale-105"
            >
              Zobacz wszystkie typy
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <a
              href="#mundial"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 py-3 font-semibold backdrop-blur transition hover:bg-white/15"
            >
              <Trophy className="h-4 w-4" /> Mundial 2026
            </a>
          </div>
        </motion.div>

        {/* wyróżnione typy na dziś */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 mt-10"
        >
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-[color:var(--accent)]/80">
                Topowe typy na dziś
              </p>
              <h2 className="mt-1 text-2xl font-semibold">
                {matchesToday > 0
                  ? `${matchesToday} ${plMatches(matchesToday)} w analizie`
                  : "Najwyższy Q-Score"}
              </h2>
            </div>
            <Link
              href="/typy"
              className="hidden shrink-0 items-center gap-1 text-sm font-medium text-[color:var(--accent)] transition hover:gap-2 sm:inline-flex"
            >
              Wszystkie <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {topTips.length > 0 ? (
            <StaggerGrid className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {topTips.map((tip) => (
                <StaggerItem key={String(tip.event_id)}>
                  <TipCard tip={tip} href={tipHref(tip)} />
                </StaggerItem>
              ))}
            </StaggerGrid>
          ) : (
            <div className="rounded-[1.8rem] border border-white/12 bg-white/[0.04] p-10 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-white/12 bg-white/[0.05] text-[color:var(--accent)]">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Dziś brak rekomendacji value</h3>
              <p className="mt-2 text-white/60">
                Dziś brak rekomendacji value powyżej progu jakości. Sprawdź pozostałe mecze do
                obserwacji.
              </p>
              <Link
                href="/typy"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-[color:var(--on-accent)] transition hover:scale-105"
              >
                Zobacz mecze do obserwacji <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </motion.div>
      </section>

      {/* PASEK STATYSTYK (social proof) */}
      <section id="performance" className="mx-auto max-w-7xl px-6 py-10">
        <Reveal>
          {hasData ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                {
                  icon: Target,
                  value: <CountUp to={winRate * 100} decimals={1} suffix="%" />,
                  label: "trafień modelu",
                },
                {
                  icon: TrendingUp,
                  value: <CountUp to={roi * 100} decimals={1} prefix={roiSign} suffix="%" />,
                  label: "ROI (stawka 1u)",
                },
                {
                  icon: CheckCircle2,
                  value: <CountUp to={settledTips} />,
                  label: "typów zweryfikowanych",
                },
                { icon: BarChart3, value: <CountUp to={leaguesCount} />, label: "lig w analizie" },
              ].map((s) => {
                const Icon = s.icon
                return (
                  <div
                    key={s.label}
                    className="rounded-[1.6rem] border border-white/12 bg-white/[0.05] p-5 backdrop-blur"
                  >
                    <Icon className="mb-3 h-5 w-5 text-[color:var(--accent)]" />
                    <p className="text-2xl font-semibold sm:text-3xl">{s.value}</p>
                    <p className="mt-1 text-sm text-white/60">{s.label}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-start gap-4 rounded-[1.6rem] border border-white/12 bg-white/[0.05] p-6 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[color:var(--accent)]/25 bg-[var(--accent)]/10 text-[color:var(--accent)]">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Model w akcji</p>
                  <p className="text-sm text-white/60">
                    Pierwsze rozliczenia pojawią się tu zaraz po zakończonych meczach.
                  </p>
                </div>
              </div>
              <Link
                href="/stats"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/15"
              >
                Statystyki <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </Reveal>
      </section>

      {/* SEKCJA MŚ 2026 */}
      <section id="mundial" className="mx-auto max-w-7xl px-6 py-16">
        <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[color:var(--accent)]/80">Mundial 2026</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              {wcLive ? "Mecze Mistrzostw Świata" : "Tryb Mundialu — w przygotowaniu"}
            </h2>
          </div>
          <Link
            href="/typy"
            className="inline-flex items-center gap-1 text-sm font-medium text-[color:var(--accent)] transition hover:gap-2"
          >
            Pełny tryb Mundialu <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>

        {wcLive ? (
          <StaggerGrid className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {wcTips.slice(0, 6).map((tip) => (
              <StaggerItem key={String(tip.event_id)}>
                <TipCard tip={tip} href={tipHref(tip)} />
              </StaggerItem>
            ))}
          </StaggerGrid>
        ) : (
          <Reveal>
            <div className="overflow-hidden rounded-[2rem] border border-white/12 bg-gradient-to-br from-[var(--accent)]/10 via-white/[0.04] to-transparent p-8 backdrop-blur md:p-12">
              <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-lg">
                  <Trophy className="mb-4 h-10 w-10 text-[color:var(--accent)]" />
                  <h3 className="text-2xl font-semibold">48 drużyn. Jeden silnik gotowy.</h3>
                  <p className="mt-3 leading-7 text-white/64">
                    Gdy ruszy turniej, mecze Mundialu pojawią się tutaj z predykcją i Q-Score —
                    kolory kart pokażą pewność typu. Mecz otwarcia: 11 czerwca 2026.
                  </p>
                </div>
                <Countdown target={WC_START} />
              </div>
            </div>
          </Reveal>
        )}
      </section>

      {/* DZIŚ W TYPACH */}
      <section id="today" className="mx-auto max-w-7xl px-6 py-16">
        <Reveal className="mb-6">
          <p className="text-sm uppercase tracking-[0.3em] text-[color:var(--accent)]/80">Dziś w typach</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Podgląd na dziś — pełnia w zakładce Typy.
          </h2>
        </Reveal>

        <Reveal className="mb-6">
          <AnimatedTabs
            groupId="home-modes"
            value={mode}
            onChange={(k) => setMode(k as "ALL" | BetType)}
            items={MODES.map((m) => ({ key: m.key, label: m.label, count: modeCounts[m.key] ?? 0 }))}
          />
        </Reveal>

        {visibleTips.length > 0 ? (
          <Reveal>
            <StaggerGrid key={mode} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleTips.map((tip) => (
                <StaggerItem key={String(tip.event_id)}>
                  <TipCard tip={tip} href={tipHref(tip)} />
                </StaggerItem>
              ))}
            </StaggerGrid>
            <div className="mt-8 text-center">
              <Link
                href="/typy"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-[color:var(--on-accent)] transition hover:scale-105"
              >
                Zobacz wszystkie typy <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        ) : (
          <Reveal>
            <div className="rounded-[1.8rem] border border-white/12 bg-white/[0.04] p-10 text-center text-white/60">
              Brak typów w tym trybie na dziś. Sprawdź{" "}
              <Link href="/typy" className="font-semibold text-[color:var(--accent)] hover:underline">
                kalendarz typów
              </Link>
              .
            </div>
          </Reveal>
        )}
      </section>

      {/* JAK TO DZIAŁA */}
      <section id="how" className="mx-auto max-w-7xl px-6 py-16">
        <Reveal className="mb-10 max-w-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-[color:var(--accent)]/80">Jak to działa</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Dlaczego możesz ufać tym liczbom.
          </h2>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map((step, i) => {
            const Icon = step.icon
            return (
              <Reveal key={step.title} delay={i * 0.08}>
                <article className="h-full rounded-[2rem] border border-white/12 bg-white/[0.055] p-7 shadow-2xl shadow-black/20 backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.085]">
                  <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl border border-[color:var(--accent)]/20 bg-[var(--accent)]/10 text-[color:var(--accent)]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/60">{step.text}</p>
                </article>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* TRYBY (szczegóły) */}
      <section id="modes" className="mx-auto max-w-7xl px-6 py-16">
        <Reveal className="mb-10 max-w-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-[color:var(--accent)]/80">Tryby</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Cztery rynki, jeden silnik.
          </h2>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {modes.map((mode, i) => {
            const Icon = mode.icon
            const high = mode.risk.includes("wysokie")
            return (
              <Reveal key={mode.name} delay={i * 0.08}>
                <article className="h-full rounded-[2rem] border border-white/12 bg-white/[0.055] p-6 shadow-2xl shadow-black/20 backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.085]">
                  <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-[color:var(--accent)]/20 bg-[var(--accent)]/10 text-[color:var(--accent)]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold">{mode.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/58">{mode.desc}</p>
                  <span
                    className={`mt-5 inline-block rounded-full border px-3 py-1 text-xs font-medium ${
                      high
                        ? "border-rose-300/30 bg-rose-300/10 text-rose-200"
                        : "border-white/12 bg-white/[0.05] text-white/55"
                    }`}
                  >
                    {mode.risk}
                  </span>
                </article>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* DOSTĘP / TELEGRAM */}
      <section id="access" className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-5 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-[2rem] border border-white/12 bg-white/[0.055] p-8 backdrop-blur">
              <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl border border-[color:var(--accent)]/20 bg-[var(--accent)]/10 text-[color:var(--accent)]">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-semibold">Darmowy dostęp na start</h3>
              <p className="mt-4 leading-7 text-white/60">
                Bez logowania widzisz dzisiejsze typy i podstawowe wskaźniki. Zaloguj się przez
                Telegram, aby odblokować pełne statystyki, historię, filtry i własne kupony — bez
                opłat.
              </p>
              <ul className="mt-6 grid gap-3 text-sm text-white/70">
                {[
                  "Podgląd dzisiejszych typów — bez logowania",
                  "Pełne wykresy, historia i filtry — po zalogowaniu",
                  "Własne kupony i śledzenie ROI",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--accent)]" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="flex h-full flex-col justify-between rounded-[2rem] border border-white/12 bg-gradient-to-br from-[var(--accent)]/10 to-white/[0.04] p-8 backdrop-blur">
              <div>
                <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl border border-[color:var(--accent)]/20 bg-[var(--accent)]/10 text-[color:var(--accent)]">
                  <Send className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-semibold">Bot na Telegramie</h3>
                <p className="mt-4 leading-7 text-white/60">
                  Ten sam silnik, drugi interfejs. Odbieraj typy bezpośrednio w Telegramie —
                  natychmiast, z powiadomieniami.
                </p>
              </div>
              <a
                href="https://t.me/lupus_bet_bot"
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-[color:var(--on-accent)] transition hover:scale-105"
              >
                Otwórz @lupus_bet_bot <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-6 py-16">
        <Reveal className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-[color:var(--accent)]/80">FAQ</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Najczęstsze pytania.</h2>
        </Reveal>
        <Reveal delay={0.05}>
          <Faq />
        </Reveal>
      </section>

      {/* STOPKA + 18+ */}
      <footer className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-[1.6rem] border border-amber-300/20 bg-amber-300/[0.06] p-5 text-sm text-amber-100/80">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <p>
              <strong className="font-semibold">18+ · Graj odpowiedzialnie.</strong> Typy to
              predykcje statystyczne, nie gwarancja wygranej. Hazard wiąże się z ryzykiem
              uzależnienia i utraty pieniędzy. Obstawiaj wyłącznie środki, które możesz stracić.
              Pomoc: <span className="underline">uzaleznienia.pl</span>.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-between gap-5 border-t border-white/10 pt-8 text-sm text-white/60 md:flex-row md:items-center">
          <Brand />
          <div className="flex flex-wrap gap-5">
            <Link href="/typy" className="transition hover:text-white">
              Typy
            </Link>
            <Link href="/stats" className="transition hover:text-white">
              Statystyki
            </Link>
            <Link href="/ligi" className="transition hover:text-white">
              Ligi
            </Link>
            <a href="#mundial" className="transition hover:text-white">
              Mundial
            </a>
          </div>
        </div>
        <p className="mt-6 text-xs text-white/55">
          © 2026 LUPUS BETS. Interfejs nad silnikiem Lupus Bot. Predykcje piłkarskie oparte na
          modelu Dixon-Coles.
        </p>
      </footer>
    </main>
  )
}
