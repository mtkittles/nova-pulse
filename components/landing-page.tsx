"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Menu,
  Send,
  ShieldCheck,
  Target,
  Trophy,
  X,
} from "lucide-react"
import type { Tip } from "@/lib/types"
import { OgarHorizontal, Brand } from "./brand"
import { LogoutButton } from "./logout-button"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { CountUp } from "./ui/count-up"
import TipCard from "./tip-card"
import { CardsCarousel } from "./cards-carousel"
import { LiveTicker } from "./live-ticker"
import { useLiveMatches } from "@/hooks/use-live-matches"
import type { TimelinePoint } from "@/lib/stats-types"
import type { WCPhase } from "@/lib/extra-types"

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
  timeline: TimelinePoint[]
  wcPhase?: WCPhase
}

const navItems = [
  { label: "Start", href: "#start" },
  { label: "Dziś", href: "#today" },
  { label: "Jak działa", href: "#how" },
  { label: "Statystyki", href: "/stats" },
]

const howItWorks = [
  {
    icon: Activity,
    title: "Dane i forma",
    text: "Zbieramy wyniki, formę drużyn i historię H2H z dziesiątek lig.",
  },
  {
    icon: Cpu,
    title: "Model Dixon-Coles + kalibracja + Q-Score",
    text: "Liczymy prawdopodobieństwa goli i jakość sygnału — każdy typ dostaje ocenę.",
  },
  {
    icon: CheckCircle2,
    title: "Automatyczna weryfikacja na żywo",
    text: "Aktualizujemy wynik na żywo i rozliczamy typy po zakończeniu meczu.",
  },
]

export default function LandingPage({
  loggedIn = false,
  topTips,
  todayTips,
  wcTips,
  winRate,
  roi,
  totalTips,
  settledTips,
  leaguesCount,
  wcPhase = "pre",
}: LandingProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  // zamknij menu na Esc
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false)
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [menuOpen])
  const reduce = useReducedMotion()
  const { updatedAt } = useLiveMatches()

  const roiPositive = roi >= 0
  const roiSign = roiPositive ? "+" : ""
  const lowSample = totalTips < 10
  const wcRunning = wcPhase === "group" || wcPhase === "knockout"

  const tipHref = (t: Tip) => (loggedIn && t.event_id ? `/mecz/${t.event_id}` : undefined)

  // Typy do sekcji "Dziś": preferuj topTips (value), w razie braku — pierwsze z dnia.
  const heroTips = (topTips.length > 0 ? topTips : todayTips).slice(0, 3)

  const syncTime = formatSyncTime(updatedAt)

  // whileInView fade+slideUp z poszanowaniem reduced-motion.
  const reveal = (delay = 0) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.5, delay: reduce ? 0 : delay },
  })

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--bg-0)] text-[color:var(--text-primary)]">
      {/* header */}
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="transition hover:opacity-90" aria-label="LUPUS BETS — strona główna">
          <OgarHorizontal height={36} />
        </Link>

        <nav className="hidden gap-8 text-sm text-[color:var(--text-secondary)] lg:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-[color:var(--text-primary)]">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button href={loggedIn ? "/profil" : "/login"} variant="primary" size="md">
            {loggedIn ? "Mój panel" : "Zaloguj"}
          </Button>
        </div>

      </header>

      {/* mobilny toggle — fixed nad overlayem, zawsze klikalny; ta sama funkcja toggle */}
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="fixed right-5 top-6 z-[70] grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-1)]/90 backdrop-blur md:hidden"
        aria-label={menuOpen ? "Zamknij menu" : "Otwórz menu"}
        aria-expanded={menuOpen}
      >
        {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* mobilne menu: backdrop (klik = zamknij) + panel; wylogowanie wewnątrz */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            aria-label="Zamknij menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-[var(--bg-0)]/70 backdrop-blur-sm"
          />
          <motion.nav
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            className="absolute left-4 right-4 top-20 grid gap-2 rounded-[var(--radius-card)] border border-[color:var(--border-soft)] bg-[var(--surface-1)] p-4 shadow-2xl shadow-black/40"
          >
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-2xl px-4 py-3 text-[color:var(--text-secondary)] transition hover:bg-[var(--surface-2)] hover:text-[color:var(--text-primary)]"
              >
                {item.label}
              </a>
            ))}
            <Button href={loggedIn ? "/profil" : "/login"} variant="primary" size="md" className="mt-1 w-full">
              {loggedIn ? "Mój panel" : "Zaloguj"}
            </Button>
            {loggedIn && (
              <div className="mt-1" onClick={() => setMenuOpen(false)}>
                <LogoutButton />
              </div>
            )}
          </motion.nav>
        </div>
      )}

      {/* HERO — kompaktowe, nie pełnoekranowe */}
      <section id="start" className="relative mx-auto max-w-7xl px-6 pb-10 pt-2 md:pt-6">
        {/* tło: subtelna siatka + poświata (oszczędnie, bez dublowania logo) */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(var(--border-soft)_1px,transparent_1px),linear-gradient(90deg,var(--border-soft)_1px,transparent_1px)] bg-[size:72px_72px] opacity-40" />
          <div className="absolute right-[-80px] top-[-60px] h-72 w-72 rounded-full bg-[var(--glow-1)] blur-3xl" />
        </div>

        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-2xl"
        >
          <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            LUPUS BETS
          </h1>
          <p className="mt-3 text-2xl font-semibold text-[color:var(--cyan)] sm:text-3xl">
            Analiza, nie przeczucie
          </p>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[color:var(--text-secondary)]">
            Algorytm Poissona analizuje formę, statystyki i kursy. Typy z przewagą nad bukmacherem —
            weryfikowane na żywo.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/typy" variant="primary" size="lg">
              Zobacz typy dnia <ArrowRight className="h-4 w-4" />
            </Button>
            <Button href="https://t.me/lupus_bet_bot" variant="secondary" size="lg">
              <Send className="h-4 w-4" /> Otwórz bota Telegram
            </Button>
          </div>
        </motion.div>
      </section>

      {/* LIVE TICKER */}
      <section className="relative z-10 mx-auto max-w-7xl px-6">
        <LiveTicker />
      </section>

      {/* DZIŚ */}
      <section id="today" className="mx-auto max-w-7xl px-6 py-14">
        <motion.div {...reveal()} className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[color:var(--cyan)]/80">Dziś</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Dziś w typach</h2>
          </div>
          <Button href="/typy" variant="ghost" size="md" className="hidden shrink-0 sm:inline-flex">
            Wszystkie typy →
          </Button>
        </motion.div>

        {heroTips.length > 0 ? (
          <>
            <motion.div {...reveal(0.05)}>
              <CardsCarousel ariaLabel="Topowe typy na dziś">
                {heroTips.map((tip) => (
                  <TipCard key={String(tip.event_id)} tip={tip} href={tipHref(tip)} />
                ))}
              </CardsCarousel>
            </motion.div>
            <div className="mt-8 text-center sm:hidden">
              <Button href="/typy" variant="secondary" size="md">
                Wszystkie typy →
              </Button>
            </div>
          </>
        ) : (
          <motion.div {...reveal(0.05)}>
            <Card hover={false} className="p-10 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-2)] text-[color:var(--cyan)]">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Dziś brak rekomendacji value</h3>
              <p className="mx-auto mt-2 max-w-md text-[color:var(--text-secondary)]">
                Brak typów powyżej progu jakości. Sprawdź pełny kalendarz meczów do obserwacji.
              </p>
              <div className="mt-6">
                <Button href="/typy" variant="primary" size="md">
                  Zobacz wszystkie typy <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </section>

      {/* PROOF BAR */}
      <section className="mx-auto max-w-7xl px-6 py-6">
        <motion.div {...reveal()}>
          <Card hover={false}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-5">
              <ProofItem
                label="Typów rozliczonych"
                value={<CountUp to={settledTips} className="tnum" />}
              />
              <ProofItem
                label="Skuteczność 30d"
                value={<CountUp to={winRate * 100} decimals={1} suffix="%" className="tnum" />}
              />
              <ProofItem
                label="ROI 30d"
                value={
                  <CountUp
                    to={roi * 100}
                    decimals={1}
                    prefix={roiSign}
                    suffix="%"
                    className="tnum"
                  />
                }
                valueClassName={
                  roiPositive ? "text-[color:var(--success)]" : "text-[color:var(--danger)]"
                }
              />
              <ProofItem
                label="Aktywne ligi"
                value={<CountUp to={leaguesCount} className="tnum" />}
              />
              <ProofItem label="Ostatnia synchronizacja" value={<span className="tnum">{syncTime}</span>} />
            </div>
            {lowSample && (
              <p className="mt-5 border-t border-[color:var(--border-soft)] pt-4 text-center text-sm text-[color:var(--text-muted)]">
                Model w akcji — zbieramy próbę.
              </p>
            )}
          </Card>
        </motion.div>
      </section>

      {/* JAK DZIAŁA MODEL */}
      <section id="how" className="mx-auto max-w-7xl px-6 py-14">
        <motion.div {...reveal()} className="mb-8 max-w-2xl">
          <p className="text-sm uppercase tracking-[0.25em] text-[color:var(--cyan)]/80">Jak działa model</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Trzy kroki od danych do rozliczenia.
          </h2>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {howItWorks.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div key={step.title} {...reveal(i * 0.08)} className="h-full">
                <Card className="h-full">
                  <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-[color:var(--border-strong)] bg-[var(--cyan-soft)] text-[color:var(--cyan)]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold leading-snug">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--text-secondary)]">{step.text}</p>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* MŚ — tylko gdy turniej trwa */}
      {wcRunning && (
        <section id="mundial" className="mx-auto max-w-7xl px-6 py-14">
          <motion.div {...reveal()}>
            <Card active hover={false} className="p-8 md:p-10">
              <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-lg">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-strong)] bg-[var(--cyan-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--cyan)]">
                    <Trophy className="h-3.5 w-3.5" /> Mundial 2026
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
                    {wcPhase === "knockout" ? "Faza pucharowa trwa" : "Faza grupowa trwa"}
                  </h2>
                  <p className="mt-3 leading-7 text-[color:var(--text-secondary)]">
                    Predykcje na mecze turnieju — z Q-Score i kursem. Wejdź w pełny tryb Mundialu.
                  </p>
                  <div className="mt-6">
                    <Button href="/mundial" variant="primary" size="md">
                      Zobacz Mundial →
                    </Button>
                  </div>
                </div>
                {wcTips.length > 0 && (
                  <div className="grid w-full gap-4 sm:grid-cols-2 lg:max-w-xl">
                    {wcTips.slice(0, 2).map((tip) => (
                      <TipCard key={String(tip.event_id)} tip={tip} href={tipHref(tip)} />
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </section>
      )}

      {/* STOPKA */}
      <footer className="mx-auto max-w-7xl px-6 py-12">
        <motion.div {...reveal()}>
          <Card hover={false} active className="flex flex-col items-start gap-5 p-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-semibold">Odbieraj typy w Telegramie</h3>
              <p className="mt-2 text-[color:var(--text-secondary)]">
                Ten sam silnik, drugi interfejs — natychmiast, z powiadomieniami.
              </p>
            </div>
            <Button href="https://t.me/lupus_bet_bot" variant="primary" size="lg">
              <Send className="h-4 w-4" /> Otwórz @lupus_bet_bot
            </Button>
          </Card>
        </motion.div>

        <div className="mt-8 rounded-[var(--radius-card)] border border-[color:var(--warning)]/30 bg-[color:var(--warning)]/8 p-5 text-sm text-[color:var(--text-secondary)]">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--warning)]" />
            <p>
              <strong className="font-semibold text-[color:var(--text-primary)]">18+ · Graj odpowiedzialnie.</strong>{" "}
              Typy to predykcje statystyczne, nie gwarancja wygranej. Hazard wiąże się z ryzykiem
              uzależnienia i utraty pieniędzy. Obstawiaj wyłącznie środki, które możesz stracić.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-between gap-5 border-t border-[color:var(--border-soft)] pt-8 text-sm text-[color:var(--text-secondary)] md:flex-row md:items-center">
          <Brand />
          <div className="flex flex-wrap gap-5">
            <Link href="/typy" className="transition hover:text-[color:var(--text-primary)]">
              Typy
            </Link>
            <Link href="/mundial" className="transition hover:text-[color:var(--text-primary)]">
              Mundial
            </Link>
            <Link href="/stats" className="transition hover:text-[color:var(--text-primary)]">
              Statystyki
            </Link>
            <Link href="/ligi" className="transition hover:text-[color:var(--text-primary)]">
              Ligi
            </Link>
          </div>
        </div>
        <p className="mt-6 text-xs text-[color:var(--text-muted)]">
          © 2026 LUPUS BETS. Interfejs nad silnikiem Lupus Bot. Predykcje oparte na modelu Dixon-Coles.
        </p>
      </footer>
    </main>
  )
}

function ProofItem({
  label,
  value,
  valueClassName = "",
}: {
  label: string
  value: React.ReactNode
  valueClassName?: string
}) {
  return (
    <div>
      <p className={`text-2xl font-semibold sm:text-3xl ${valueClassName}`}>{value}</p>
      <p className="mt-1 text-sm text-[color:var(--text-secondary)]">{label}</p>
    </div>
  )
}

// Czas ostatniej synchronizacji jako lokalne HH:MM, "—" gdy brak.
function formatSyncTime(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
}
