import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, BarChart3, Send, Ticket } from "lucide-react"
import { getSession } from "@/lib/auth"
import { getUserPicks } from "@/lib/picks"
import { DEMO_MODE, DEMO_USER } from "@/lib/demo-mode"
import { MOCK_PROFILE } from "@/lib/demo-data"
import { getMarketLabel } from "@/lib/market-label"
import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusPill, type PillStatus } from "@/components/ui/status-pill"
import { EmptyState } from "@/components/ui/empty-state"
import { TeamBadge } from "@/components/team-badge"
import { ProfileIdentity } from "@/components/profile/profile-identity"
import { ProfileSettings } from "@/components/profile/avatar-picker"

export const dynamic = "force-dynamic"
export const metadata = { title: "Profil", description: "Twój profil: statystyki, ostatnie typy i ustawienia." }

export default async function ProfilPage() {
  const session = await getSession()
  if (!session) redirect("/login")
  // Demo: dla syntetycznego testera mockowy profil (zero kontaktu z Oracle).
  const isDemoUser = DEMO_MODE && session.uid === DEMO_USER.id
  const picks = isDemoUser ? MOCK_PROFILE.picks : await getUserPicks(session.uid)
  const defaultNick = isDemoUser ? MOCK_PROFILE.nick : session.name || session.username || "Gracz"

  const settled = picks.filter((p) => p.status === "won" || p.status === "lost")
  const won = settled.filter((p) => p.status === "won").length
  const winRate = settled.length ? Math.round((won / settled.length) * 100) : 0
  const profit = settled.reduce((a, p) => a + (p.status === "won" ? p.odds - 1 : -1), 0)
  const roi = settled.length ? (profit / settled.length) * 100 : 0

  // ostatnie 3 (po dacie malejąco)
  const recent = [...picks].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")).slice(0, 3)

  // seria: 3 ostatnie rozliczone same WON
  const lastSettled = [...settled].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
  const streak3 = lastSettled.length >= 3 && lastSettled.slice(0, 3).every((p) => p.status === "won")

  const badges = [
    { icon: "🎯", label: "Pierwszy typ", earned: picks.length >= 1, hint: "Dodaj pierwszy typ do kuponu." },
    { icon: "🔥", label: "Seria 3", earned: streak3, hint: "Trafienie 3 typów pod rząd." },
    { icon: "💎", label: "Weteran", earned: picks.length >= 20, hint: "Zbierz 20 typów." },
    { icon: "⭐", label: "Wysoka jakość", earned: false, hint: "Typy ze średnim Q-Score ≥ 80 (wkrótce)." },
  ]

  return (
    <AppShell loggedIn isAdmin={session.isAdmin}>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* [A] NAGŁÓWEK */}
        <Card hover={false}>
          <ProfileIdentity defaultNick={defaultNick} tier={session.tier} />
        </Card>

        {/* [B] ODZNAKI */}
        <Card hover={false}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">Odznaki</h2>
          <div className="flex flex-wrap gap-3">
            {badges.map((b) => (
              <span
                key={b.label}
                title={b.earned ? b.label : `${b.label} — ${b.hint}`}
                className={`flex flex-col items-center gap-1 ${b.earned ? "" : "opacity-30"}`}
              >
                <span className={`grid h-12 w-12 place-items-center rounded-2xl border text-2xl ${b.earned ? "border-[color:var(--cyan)] bg-[var(--cyan-soft)]" : "border-[color:var(--border-soft)] bg-[var(--surface-2)]"}`}>
                  {b.icon}
                </span>
                <span className="text-[10px] text-[color:var(--text-muted)]">{b.label}</span>
              </span>
            ))}
          </div>
        </Card>

        {/* [C] MOJE STATYSTYKI */}
        <Card hover={false}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">Moje statystyki</h2>
          {picks.length === 0 ? (
            <EmptyState icon={Ticket} title="Brak typów — zacznij śledzić!" description="Dodaj typy do kuponu w zakładce Typy." cta={{ label: "Przejdź do typów", href: "/typy" }} />
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-2)] p-3">
                  <p className="text-xs text-[color:var(--text-muted)]">Skuteczność</p>
                  <p className="mt-1 text-xl font-bold tnum">{winRate}%</p>
                </div>
                <div className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-2)] p-3">
                  <p className="text-xs text-[color:var(--text-muted)]">ROI</p>
                  <p className={`mt-1 text-xl font-bold tnum ${roi >= 0 ? "text-[color:var(--success)]" : "text-[color:var(--danger)]"}`}>
                    {roi >= 0 ? "+" : ""}{roi.toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-2)] p-3">
                  <p className="text-xs text-[color:var(--text-muted)]">Typy</p>
                  <p className="mt-1 text-xl font-bold tnum">{picks.length}</p>
                </div>
              </div>
              <Link href="/stats" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[color:var(--cyan)] hover:gap-2">
                Zobacz pełne statystyki <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </Card>

        {/* [D] OSTATNIE TYPY */}
        {recent.length > 0 && (
          <Card hover={false}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">Ostatnie typy</h2>
            <div className="space-y-2">
              {recent.map((p) => {
                const market = getMarketLabel(p.bet_type, p.bet_side, p.home, p.away)
                const pill: PillStatus = p.status === "won" ? "WON" : p.status === "lost" ? "LOST" : "PENDING"
                return (
                  <div key={String(p.id)} className="flex items-center gap-3 rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-2)] p-3">
                    <div className="flex shrink-0 items-center gap-1">
                      <TeamBadge teamName={p.home} size="sm" />
                      <TeamBadge teamName={p.away} size="sm" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.home} – {p.away}</p>
                      <p className="mt-0.5"><span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold ${market.badge}`}>{market.short}</span></p>
                    </div>
                    <StatusPill status={pill} />
                  </div>
                )
              })}
            </div>
            {process.env.NEXT_PUBLIC_FEATURE_COUPONS === "true" && (
              <Link href="/kupony" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[color:var(--cyan)] hover:gap-2">
                Wszystkie moje typy <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </Card>
        )}

        {/* [E] TELEGRAM BOT */}
        <Card hover={false} className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Send className="h-5 w-5 text-[color:var(--cyan)]" /> Lupus Bot na Telegramie
            </h2>
            <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Otrzymuj typy jako pierwszy.</p>
          </div>
          <Link href="https://t.me/lupus_bet_bot" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--cyan)] px-5 py-2.5 text-sm font-semibold text-[color:var(--bg-0)] transition hover:bg-[var(--cyan-strong)]">
            <Send className="h-4 w-4" /> Otwórz bota
          </Link>
        </Card>

        {/* [F] USTAWIENIA */}
        <Card hover={false}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">Ustawienia</h2>
          <ProfileSettings />
        </Card>

        <p className="flex items-center justify-center gap-1 text-center text-xs text-[color:var(--text-muted)]">
          <BarChart3 className="h-3.5 w-3.5" /> Statystyki liczone z Twoich zapisanych typów.
        </p>
      </div>
    </AppShell>
  )
}
