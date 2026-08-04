"use client"

import Link from "next/link"
import { Activity, ArrowRight, Check, CheckCircle2, Cpu, Send, ShieldCheck } from "lucide-react"
import type { Tip } from "@/lib/types"
import type { TimelinePoint } from "@/lib/stats-types"
import { Brand } from "./brand"
import { Card } from "./ui/card"
import { RevealText } from "./ui/reveal-text"
import { ScrollReveal } from "./scroll-reveal"
import { MobileTabBar } from "./mobile-tab-bar"
import { LandingHeader } from "./landing/landing-header"
import { HeroKinetic } from "./landing/hero-kinetic"
import { SectionIndex } from "./landing/section-index"
import { LiveTicker } from "./landing/live-ticker"
import { TodayStrip } from "./landing/today-strip"
import { TodayTips } from "./landing/today-tips"
import { ModelFormChart } from "./landing/model-form-chart"
import { QDistribution } from "./landing/q-distribution"
import { RecentSettled } from "./landing/recent-settled"

type LandingProps = {
  loggedIn?: boolean
  topTips: Tip[]
  todayTips: Tip[]
  matchesToday: number
  winRate: number // 0..1
  roi: number
  totalTips: number
  settledTips: number
  avgQScore: number // 0..100
  leaguesCount: number
  timeline: TimelinePoint[]
  recentSettled: Tip[]
}

const HOW_IT_WORKS = [
  {
    icon: Activity,
    title: "Dane i forma",
    text: "Zbieramy wyniki, formę drużyn i historię H2H z dziesiątek lig.",
  },
  {
    icon: Cpu,
    title: "Model goli + kalibracja + Q-Score",
    text: "Silnik łączy model goli Poissona/Dixon-Coles, kalibrację prawdopodobieństw i własny Q-Score.",
  },
  {
    icon: CheckCircle2,
    title: "Automatyczna weryfikacja na żywo",
    text: "Aktualizujemy wynik na żywo i rozliczamy typy po zakończeniu meczu.",
  },
]

const PLANS: {
  name: string
  price: string
  features: string[]
  cta: { label: string; href: string }
  highlight?: boolean
  badge?: { label: string; cls: string }
}[] = [
  {
    name: "Darmowy",
    price: "0 zł / miesiąc",
    features: ["Lista typów dnia", "Podstawowe statystyki", "Opóźnienie 24h"],
    cta: { label: "Zacznij za darmo", href: "/typy" },
  },
  {
    name: "Trial 7 dni",
    price: "Bezpłatnie",
    features: [
      "Wszystko z Free",
      "Typy w czasie rzeczywistym",
      "Q-Score + Edge",
      "Statystyki zaawansowane",
      "Szczegóły /mecz",
    ],
    cta: { label: "Wypróbuj 7 dni", href: "https://t.me/lupus_bet_bot" },
    highlight: true,
    badge: { label: "Nowość", cls: "border-amber-400/40 bg-amber-400/15 text-amber-200" },
  },
  {
    name: "Premium",
    price: "Przez bota Telegram",
    features: ["Wszystko z Trial", "Powiadomienia live", "Historia typów", "Ranking typerów"],
    cta: { label: "Dołącz przez Telegram", href: "https://t.me/lupus_bet_bot" },
    badge: { label: "Popularne", cls: "border-emerald-400/40 bg-emerald-400/15 text-emerald-200" },
  },
]

// Nagłówek sekcji — jeden wzorzec dla całej strony (eyebrow + tytuł + opcjonalny link).
function SectionHead({
  eyebrow,
  title,
  hint,
  action,
}: {
  eyebrow: string
  title: string
  hint?: string
  action?: { label: string; href: string }
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[color:var(--cyan)]/80">
          {eyebrow}
        </p>
        <RevealText text={title} className="mt-1.5 text-xl font-semibold tracking-tight md:text-2xl" />
        {hint && <p className="mt-1 text-sm text-[color:var(--text-secondary)]">{hint}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="tap hidden shrink-0 items-center gap-1 whitespace-nowrap text-sm text-[color:var(--text-secondary)] transition-colors duration-150 hover:text-[color:var(--cyan)] sm:inline-flex"
        >
          {action.label} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}

export default function LandingPage({
  loggedIn = false,
  todayTips,
  winRate,
  roi,
  settledTips,
  timeline,
  recentSettled,
}: LandingProps) {
  const roiPositive = roi >= 0

  return (
    <div className="min-h-screen bg-[var(--bg-0)] text-[color:var(--text-primary)]">
      <LandingHeader loggedIn={loggedIn} />
      <SectionIndex />

      {/* pb-tabbar: zapas na dolną nawigację mobilną + pasek gestów */}
      <main className="pb-tabbar mx-auto max-w-6xl px-4 md:px-6 lg:pb-0">
        {/* ——— 1. HERO KINETYCZNY ——— */}
        <HeroKinetic tips={todayTips} />

        {/* ——— LIVE TICKER — pełna szerokość, wychodzi poza max-w-6xl ——— */}
        <div className="-mx-4 md:-mx-6">
          <LiveTicker tips={todayTips} />
        </div>

        {/* ——— 2. DZIŚ W SKRÓCIE ——— */}
        <section id="dzis" className="scroll-mt-24 pt-8 md:pt-10">
          <ScrollReveal>
            <TodayStrip tips={todayTips} />
          </ScrollReveal>
        </section>

        {/* ——— 3. TYPY DNIA ——— */}
        <section id="typy-dnia" className="scroll-mt-24 pt-12 md:pt-14">
          <SectionHead
            eyebrow="Dziś"
            title="Typy dnia"
            hint="Jedna karta = jeden mecz. Filtruj po lidze i rynku."
            action={{ label: "Wszystkie", href: "/typy" }}
          />
          <TodayTips tips={todayTips} loggedIn={loggedIn} />
        </section>

        {/* ——— 4 + 5. FORMA MODELU + ROZKŁAD Q ——— */}
        <section id="forma" className="scroll-mt-24 pt-12 md:pt-14">
          <SectionHead
            eyebrow="Dowód"
            title="Forma modelu"
            hint="Skuteczność ostatnich 30 dni i rozkład ocen dzisiejszych typów."
            action={{ label: "Pełne statystyki", href: "/stats" }}
          />
          <div className="grid gap-4 lg:grid-cols-5">
            <ScrollReveal className="lg:col-span-3">
              <ModelFormChart timeline={timeline} />
            </ScrollReveal>
            <ScrollReveal delay={80} className="lg:col-span-2">
              <QDistribution tips={todayTips} />
            </ScrollReveal>
          </div>
        </section>

        {/* ——— 6. OSTATNIO ROZLICZONE ——— */}
        {recentSettled.length > 0 && (
          <section id="rozliczone" className="scroll-mt-24 pt-12 md:pt-14">
            <SectionHead
              eyebrow="Weryfikacja"
              title="Ostatnio rozliczone"
              hint={`${settledTips} typów rozliczonych · skuteczność ${(winRate * 100).toFixed(1)}% · ROI ${roiPositive ? "+" : ""}${(roi * 100).toFixed(1)}%`}
            />
            <ScrollReveal>
              <RecentSettled tips={recentSettled} />
            </ScrollReveal>
          </section>
        )}

        {/* ——— 7a. JAK DZIAŁA ——— */}
        <section id="how" className="scroll-mt-24 pt-12 md:pt-14">
          <SectionHead eyebrow="Jak działa model" title="Trzy kroki od danych do rozliczenia" />
          <div className="grid gap-4 md:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon
              return (
                <ScrollReveal key={step.title} delay={i * 70} className="h-full">
                  <div className="lift h-full rounded-[var(--radius-card)] border border-[color:var(--border-soft)] bg-[var(--surface-1)] p-5">
                    <div className="grid h-10 w-10 place-items-center rounded-xl border border-[color:var(--border-strong)] bg-[var(--cyan-soft)] text-[color:var(--cyan)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold leading-snug">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                      {step.text}
                    </p>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </section>

        {/* ——— 7b. PLANY ——— */}
        <section id="plany" className="scroll-mt-24 pt-12 md:pt-14">
          <SectionHead eyebrow="Plany" title="Wybierz poziom dostępu" />
          <div className="grid gap-4 md:grid-cols-3">
            {PLANS.map((plan, i) => (
              <ScrollReveal key={plan.name} delay={i * 70} className="h-full">
                <div
                  className={`relative flex h-full flex-col rounded-[var(--radius-card)] border bg-[var(--surface-1)] p-5 ${
                    plan.highlight
                      ? "border-[color:var(--cyan)]/60 bg-[linear-gradient(160deg,var(--cyan-soft),transparent_55%)]"
                      : "border-[color:var(--border-soft)]"
                  }`}
                >
                  {plan.badge && (
                    <span
                      className={`absolute right-4 top-4 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${plan.badge.cls}`}
                    >
                      {plan.badge.label}
                    </span>
                  )}
                  <h3 className="text-base font-semibold">{plan.name}</h3>
                  <p className="mt-1 text-xl font-bold tracking-tight">{plan.price}</p>
                  <ul className="mt-4 flex-1 space-y-2 text-sm text-[color:var(--text-secondary)]">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--cyan)]" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.cta.href}
                    className={`tap mt-5 inline-flex items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-transform duration-150 hover:scale-[1.02] ${
                      plan.highlight
                        ? "bg-[var(--cyan)] text-[color:var(--on-accent)]"
                        : "border border-[color:var(--border-soft)] bg-[var(--surface-2)] text-[color:var(--text-primary)]"
                    }`}
                  >
                    {plan.cta.href.includes("t.me") && <Send className="h-4 w-4" />}
                    {plan.cta.label}
                  </Link>
                </div>
              </ScrollReveal>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-[color:var(--text-muted)]">
            Plany Trial i Premium prowadzone są przez bota Telegram. Brak płatności na stronie.
          </p>
        </section>

        {/* ——— 8. STOPKA ——— */}
        <footer className="pt-12 md:pt-14">
          <ScrollReveal>
            <Card hover={false} active className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold">Odbieraj typy w Telegramie</h3>
                <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                  Ten sam silnik, drugi interfejs — z powiadomieniami.
                </p>
              </div>
              <Link
                href="https://t.me/lupus_bet_bot"
                className="tap inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--cyan)] px-5 text-sm font-semibold text-[color:var(--on-accent)] transition-transform duration-150 hover:scale-[1.02]"
              >
                <Send className="h-4 w-4" /> @lupus_bet_bot
              </Link>
            </Card>
          </ScrollReveal>

          <div className="mt-6 flex items-start gap-3 rounded-[var(--radius-card)] border border-[color:var(--warning)]/30 bg-[color:var(--warning)]/[0.08] p-4 text-sm text-[color:var(--text-secondary)]">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--warning)]" />
            <p>
              <strong className="font-semibold text-[color:var(--text-primary)]">
                18+ · Graj odpowiedzialnie.
              </strong>{" "}
              Typy to predykcje statystyczne, nie gwarancja wygranej. Hazard wiąże się z ryzykiem
              uzależnienia i utraty pieniędzy. Obstawiaj wyłącznie środki, które możesz stracić.
            </p>
          </div>

          <div className="mt-6 flex flex-col justify-between gap-4 border-t border-[color:var(--border-soft)] pt-6 text-sm text-[color:var(--text-secondary)] md:flex-row md:items-center">
            <Brand />
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {[
                ["Typy", "/typy"],
                ["Live", "/live"],
                ["Statystyki", "/stats"],
                ["Ranking", "/ranking"],
                ["Ligi", "/ligi"],
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="transition-colors duration-150 hover:text-[color:var(--cyan)]"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <p className="mt-5 pb-8 text-xs leading-5 text-[color:var(--text-muted)]">
            © 2026 LUPUS BETS. Interfejs nad silnikiem Lupus Bot.
          </p>
        </footer>
      </main>

      <MobileTabBar />
    </div>
  )
}
