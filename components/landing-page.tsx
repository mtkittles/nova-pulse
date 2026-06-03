"use client"

import { useEffect, useState } from "react"
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
  Target,
  TrendingUp,
  X,
  Zap,
} from "lucide-react"
import { Brand } from "./brand"
import { ThemeToggle } from "./theme-toggle"
import { Faq } from "./faq"

type LandingProps = {
  tipsToday: number
  winRate: number // 0..1
  roi: number // np. 0.05
  totalTips: number
}

const navItems = [
  { label: "Start", href: "#start" },
  { label: "Jak to działa", href: "#how" },
  { label: "Tryby", href: "#modes" },
  { label: "Skuteczność", href: "#performance" },
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

const steps = [
  {
    icon: Cpu,
    title: "Silnik liczy",
    text: "Model Dixon-Coles + ELO + kalibracja Platt analizuje dziesiątki tysięcy meczów i wylicza prawdopodobieństwa — bez zaglądania w przyszłość (no-lookahead).",
  },
  {
    icon: Send,
    title: "Bot publikuje",
    text: "Gotowe typy z Q-Score, kursem i edge trafiają na Telegram (@lupus_bet_bot) oraz tutaj. Strona serwuje policzone rekordy, nie liczy na żądanie.",
  },
  {
    icon: Activity,
    title: "Auto-weryfikacja",
    text: "Po meczu live-tracker sprawdza wynik i aktualizuje skuteczność. Statystyki są prawdziwe i rozliczane automatycznie.",
  },
]

// Licznik z animacją od 0. SSR i pierwszy render klienta = 0 → brak rozjazdu hydratacji.
function CountUp({
  to,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1200,
}: {
  to: number
  decimals?: number
  prefix?: string
  suffix?: string
  duration?: number
}) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const ease = (p: number) => 1 - Math.pow(1 - p, 3)
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      setVal(to * ease(p))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, duration])
  return (
    <>
      {prefix}
      {val.toFixed(decimals)}
      {suffix}
    </>
  )
}

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

export default function LandingPage({ tipsToday, winRate, roi, totalTips }: LandingProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const roiSign = roi >= 0 ? "+" : ""

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
            href="/login"
            className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[color:var(--on-accent)] transition hover:scale-105"
          >
            Zaloguj
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
            className="absolute left-6 right-6 top-20 rounded-3xl border border-white/15 bg-[var(--bg-soft)]/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl md:hidden"
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
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="mt-1 rounded-2xl bg-[var(--accent)] px-4 py-3 text-center font-semibold text-[color:var(--on-accent)]"
              >
                Zaloguj
              </Link>
            </nav>
          </motion.div>
        )}
      </header>

      {/* hero */}
      <section
        id="start"
        className="relative mx-auto grid min-h-[80vh] max-w-7xl items-center gap-14 px-6 py-16 md:grid-cols-[1.05fr_0.95fr] md:py-20"
      >
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10"
        >
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-[color:var(--accent)]/25 bg-[var(--accent)]/10 px-4 py-2 text-sm text-white/85 backdrop-blur">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
            </span>
            Model Dixon-Coles · auto-weryfikacja wyników
          </div>

          <h1 className="text-5xl font-semibold tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
            Mądrzejsze typy.
            <br />
            <span className="text-[color:var(--accent)]">Model, nie przeczucie.</span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-8 text-white/64 md:text-xl">
            LUPUS BETS to interfejs nad silnikiem predykcji piłkarskich Lupus Bot.
            Predykcje BTTS, Over 1.5, Mix i Thriller — z oceną jakości Q-Score i
            realną, automatycznie weryfikowaną skutecznością.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-[color:var(--on-accent)] shadow-2xl transition hover:scale-105"
            >
              Zobacz dzisiejsze typy
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <Link
              href="/stats"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 py-3 font-semibold backdrop-blur transition hover:bg-white/15"
            >
              <BarChart3 className="h-4 w-4" />
              Statystyki
            </Link>
          </div>

          {/* mini-KPI */}
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {[
              { label: "Typy na dziś", value: <CountUp to={tipsToday} /> },
              { label: "Trafialność", value: <CountUp to={winRate * 100} decimals={1} suffix="%" /> },
              {
                label: "ROI",
                value: <CountUp to={roi * 100} decimals={1} prefix={roiSign} suffix="%" />,
              },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-3xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur"
              >
                <p className="text-2xl font-semibold text-[color:var(--accent)]">{kpi.value}</p>
                <p className="mt-1 text-sm text-white/48">{kpi.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* karta-podgląd */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 34 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="relative z-10"
        >
          <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-[var(--glow-1)] via-[var(--glow-2)] to-transparent blur-3xl" />
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-4 top-8 z-20 hidden rounded-3xl border border-white/15 bg-[var(--bg-soft)]/85 p-4 shadow-2xl shadow-black/35 backdrop-blur-xl sm:block"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">Q-Score</p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--accent)]">82 / 100</p>
          </motion.div>

          <div className="relative overflow-hidden rounded-[2.4rem] border border-white/15 bg-white/[0.06] p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <div className="relative rounded-[1.9rem] border border-white/10 bg-[var(--bg)]/90 p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/45">Przykładowy typ</p>
                  <h2 className="mt-1 text-2xl font-semibold">Arsenal vs Chelsea</h2>
                </div>
                <span className="rounded-2xl bg-[var(--accent)]/10 px-3 py-2 text-sm font-semibold text-[color:var(--accent)]">
                  BTTS
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  ["Prawd.", "71%"],
                  ["Kurs", "1.65"],
                  ["Edge", "+8%"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
                    <p className="text-xs text-white/40">{k}</p>
                    <p className="mt-1 text-xl font-semibold">{v}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-white/45">Q-Score</span>
                  <span className="font-semibold text-[color:var(--accent)]">82 / 100</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-[var(--accent)]"
                    initial={{ width: 0 }}
                    animate={{ width: "82%" }}
                    transition={{ duration: 1.2, delay: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* pasek zaufania */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <Reveal className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { icon: BarChart3, value: <CountUp to={227} />, label: "aktywnych lig" },
            { icon: Cpu, value: <CountUp to={69} suffix="k+" />, label: "meczów w bazie" },
            { icon: Activity, value: "30 min", label: "cykl weryfikacji" },
            { icon: Gauge, value: <CountUp to={totalTips} />, label: "rozliczonych typów" },
          ].map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.label}
                className="rounded-[1.6rem] border border-white/12 bg-white/[0.05] p-5 backdrop-blur"
              >
                <Icon className="mb-3 h-5 w-5 text-[color:var(--accent)]" />
                <p className="text-2xl font-semibold">{s.value}</p>
                <p className="mt-1 text-sm text-white/48">{s.label}</p>
              </div>
            )
          })}
        </Reveal>
      </section>

      {/* jak to działa */}
      <section id="how" className="mx-auto max-w-7xl px-6 py-20">
        <Reveal className="mb-12 max-w-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-[color:var(--accent)]/80">
            Jak to działa
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Od modelu do gotowego typu w trzech krokach.
          </h2>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <Reveal key={step.title} delay={i * 0.1}>
                <article className="h-full rounded-[2rem] border border-white/12 bg-white/[0.055] p-7 shadow-2xl shadow-black/20 backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.085]">
                  <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl border border-[color:var(--accent)]/20 bg-[var(--accent)]/10 text-[color:var(--accent)]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="mt-3 leading-7 text-white/60">{step.text}</p>
                </article>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* tryby */}
      <section id="modes" className="mx-auto max-w-7xl px-6 py-20">
        <Reveal className="mb-12 max-w-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-[color:var(--accent)]/80">Tryby</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
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
                  <h3 className="text-xl font-semibold">{mode.name}</h3>
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

      {/* skuteczność */}
      <section id="performance" className="mx-auto max-w-7xl px-6 py-20">
        <Reveal>
          <div className="overflow-hidden rounded-[2.4rem] border border-white/12 bg-gradient-to-br from-[var(--accent)]/10 via-white/[0.04] to-[var(--glow-2)] p-8 backdrop-blur md:p-12">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-xl">
                <p className="text-sm uppercase tracking-[0.3em] text-[color:var(--accent)]/80">
                  Skuteczność
                </p>
                <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
                  Liczby, nie obietnice.
                </h2>
                <p className="mt-5 leading-8 text-white/64">
                  Każdy typ jest automatycznie rozliczany po meczu. Zobacz pełne
                  wykresy: trafialność i ROI w czasie, podział na rynki i ligi oraz
                  kalibrację Q-Score.
                </p>
                <Link
                  href="/stats"
                  className="mt-7 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-[color:var(--on-accent)] transition hover:scale-105"
                >
                  Otwórz statystyki
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Target, value: <CountUp to={winRate * 100} decimals={1} suffix="%" />, label: "Trafialność" },
                  { icon: TrendingUp, value: <CountUp to={roi * 100} decimals={1} prefix={roiSign} suffix="%" />, label: "ROI" },
                  { icon: Gauge, value: <CountUp to={68} />, label: "Śr. Q-Score" },
                  { icon: BarChart3, value: <CountUp to={totalTips} />, label: "Typów" },
                ].map((k) => {
                  const Icon = k.icon
                  return (
                    <div
                      key={k.label}
                      className="rounded-[1.6rem] border border-white/12 bg-[var(--bg)]/40 p-5 backdrop-blur"
                    >
                      <Icon className="mb-3 h-5 w-5 text-[color:var(--accent)]" />
                      <p className="text-3xl font-semibold">{k.value}</p>
                      <p className="mt-1 text-sm text-white/48">{k.label}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* dostęp / free */}
      <section id="access" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-5 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-[2rem] border border-white/12 bg-white/[0.055] p-8 backdrop-blur">
              <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl border border-[color:var(--accent)]/20 bg-[var(--accent)]/10 text-[color:var(--accent)]">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-semibold">Darmowy dostęp na start</h3>
              <p className="mt-4 leading-7 text-white/60">
                Bez logowania zobaczysz dzisiejsze typy i podstawowe wskaźniki.
                Zaloguj się przez Telegram, aby odblokować pełne statystyki,
                historię i filtry — bez opłat.
              </p>
              <ul className="mt-6 grid gap-3 text-sm text-white/70">
                {[
                  "Dzisiejsze typy i podstawowe KPI — bez logowania",
                  "Pełne wykresy, historia i filtry — po zalogowaniu",
                  "Logowanie przez Telegram (email wkrótce)",
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
                  Ten sam silnik, drugi interfejs. Odbieraj typy bezpośrednio w
                  Telegramie — natychmiast, z powiadomieniami.
                </p>
              </div>
              <a
                href="https://t.me/lupus_bet_bot"
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-[color:var(--on-accent)] transition hover:scale-105"
              >
                Otwórz @lupus_bet_bot
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-6 py-20">
        <Reveal className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-[color:var(--accent)]/80">FAQ</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Najczęstsze pytania.
          </h2>
        </Reveal>
        <Reveal delay={0.05}>
          <Faq />
        </Reveal>
      </section>

      {/* footer + 18+ */}
      <footer className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-[1.6rem] border border-amber-300/20 bg-amber-300/[0.06] p-5 text-sm text-amber-100/80">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <p>
              <strong className="font-semibold">18+ · Graj odpowiedzialnie.</strong> Typy
              to predykcje statystyczne, nie gwarancja wygranej. Hazard wiąże się z
              ryzykiem uzależnienia i utraty pieniędzy. Obstawiaj wyłącznie środki, które
              możesz stracić. Pomoc: <span className="underline">uzaleznienia.pl</span>.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-between gap-5 border-t border-white/10 pt-8 text-sm text-white/45 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <Brand />
          </div>
          <div className="flex flex-wrap gap-5">
            <Link href="/dashboard" className="transition hover:text-white">
              Typy
            </Link>
            <Link href="/stats" className="transition hover:text-white">
              Statystyki
            </Link>
            <a href="#faq" className="transition hover:text-white">
              FAQ
            </a>
            <Link href="/login" className="transition hover:text-white">
              Zaloguj
            </Link>
          </div>
        </div>
        <p className="mt-6 text-xs text-white/30">
          © 2026 LUPUS BETS. Interfejs nad silnikiem Lupus Bot. Predykcje piłkarskie
          oparte na modelu Dixon-Coles.
        </p>
      </footer>
    </main>
  )
}
