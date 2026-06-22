import { Trophy } from "lucide-react"
import { getUserRankings } from "@/lib/rankings"
import { getSession } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"
import { EmptyState } from "@/components/ui/empty-state"
import { LocalDateTime } from "@/components/local-time"

export const dynamic = "force-dynamic"
export const metadata = { title: "Ranking typerów", description: "Najlepsi typerzy społeczności Lupus Bets." }

const MEDAL = ["🥇", "🥈", "🥉"]
// subtelne tła dla podium (gold / silver / bronze)
const PODIUM_BG = [
  "linear-gradient(90deg, rgba(244,184,82,0.14), transparent 70%)",
  "linear-gradient(90deg, rgba(164,177,190,0.14), transparent 70%)",
  "linear-gradient(90deg, rgba(255,122,80,0.12), transparent 70%)",
]

// null/undefined → "—" dla nowych pól
const roiText = (roi: number | null) => (roi == null ? "—" : `${roi >= 0 ? "+" : ""}${(roi * 100).toFixed(1)}%`)
const roiClass = (roi: number | null) =>
  roi == null ? "text-[color:var(--text-muted)]" : roi >= 0 ? "text-[color:var(--success)]" : "text-[color:var(--danger)]"
const oddsText = (v: number | null) => (v == null ? "—" : v.toFixed(2))
const streakText = (n: number | null) => (n != null && n > 0 ? `🔥 ${n}` : "—")

export default async function RankingPage() {
  const [{ users, updated_at, error }, session] = await Promise.all([getUserRankings(), getSession()])

  return (
    <AppShell loggedIn={Boolean(session)} isAdmin={session?.isAdmin}>
      <div className="mx-auto max-w-2xl lg:max-w-4xl">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Ranking typerów</h1>
          <p className="mt-2 text-[color:var(--text-secondary)]">Najlepsi użytkownicy społeczności Lupus Bets</p>
        </header>

        {error ? (
          <EmptyState icon={Trophy} title="Nie udało się załadować rankingu" description="Spróbuj ponownie za chwilę." />
        ) : users.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="Ranking się zapełnia"
            description="Typuj mecze, a Twoje wyniki pojawią się tutaj. Minimum 10 rozliczonych typów, żeby wejść do rankingu."
            cta={{ label: "Zobacz dzisiejsze typy", href: "/typy" }}
          />
        ) : (
          <>
            {/* DESKTOP: tabela z pełnym zestawem kolumn */}
            <div className="hidden overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--border-soft)] bg-[var(--surface-1)] md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-[color:var(--border-soft)] text-xs uppercase tracking-wide text-[color:var(--text-muted)]">
                  <tr>
                    <th className="px-3 py-2.5 text-left">#</th>
                    <th className="px-3 py-2.5 text-left">Typer</th>
                    <th className="px-3 py-2.5 text-center">Typy</th>
                    <th className="px-3 py-2.5 text-center">Trafione</th>
                    <th className="px-3 py-2.5 text-center">Skuteczność</th>
                    <th className="px-3 py-2.5 text-right">ROI</th>
                    <th className="px-3 py-2.5 text-right">Śr. kurs</th>
                    <th className="px-3 py-2.5 text-right">Seria</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr
                      key={`${u.display_id}-${i}`}
                      className="border-b border-[color:var(--border-soft)] transition last:border-0 hover:bg-[var(--surface-2)]"
                      style={i < 3 ? { backgroundImage: PODIUM_BG[i] } : undefined}
                    >
                      <td className="px-3 py-3 text-center text-lg font-bold tnum">{i < 3 ? MEDAL[i] : <span className="text-[color:var(--text-muted)]">{i + 1}</span>}</td>
                      <td className="px-3 py-3 font-medium tnum">{u.display_id}</td>
                      <td className="px-3 py-3 text-center tnum text-[color:var(--text-secondary)]">{u.total_picks}</td>
                      <td className="px-3 py-3 text-center tnum text-[color:var(--text-secondary)]">{u.won_picks}</td>
                      <td className="px-3 py-3 text-center font-bold tnum text-[color:var(--cyan)]">{u.win_rate}%</td>
                      <td className={`px-3 py-3 text-right font-semibold tnum ${roiClass(u.roi)}`}>{roiText(u.roi)}</td>
                      <td className="px-3 py-3 text-right tnum text-[color:var(--text-secondary)]">{oddsText(u.avg_odds)}</td>
                      <td className="px-3 py-3 text-right tnum">{streakText(u.current_streak)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE: karty (tabela byłaby za szeroka) */}
            <div className="space-y-3 md:hidden">
              {users.map((u, i) => (
                <div
                  key={`${u.display_id}-${i}`}
                  className="relative rounded-[var(--radius-card)] border border-[color:var(--border-soft)] bg-[var(--surface-1)] p-4"
                  style={i < 3 ? { backgroundImage: PODIUM_BG[i] } : undefined}
                >
                  {u.current_streak != null && u.current_streak > 0 && (
                    <span className="absolute right-3 top-3 rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-2)] px-2 py-0.5 text-xs font-semibold">
                      🔥 {u.current_streak}
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold tnum">{i < 3 ? MEDAL[i] : <span className="text-[color:var(--text-muted)]">{i + 1}</span>}</span>
                    <span className="font-medium tnum">{u.display_id}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-2)] p-2">
                      <p className="text-[10px] uppercase tracking-wide text-[color:var(--text-muted)]">Typy / Trafione</p>
                      <p className="mt-0.5 font-semibold tnum">{u.total_picks} / {u.won_picks}</p>
                    </div>
                    <div className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-2)] p-2">
                      <p className="text-[10px] uppercase tracking-wide text-[color:var(--text-muted)]">Skuteczność</p>
                      <p className="mt-0.5 font-bold tnum text-[color:var(--cyan)]">{u.win_rate}%</p>
                    </div>
                    <div className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-2)] p-2">
                      <p className="text-[10px] uppercase tracking-wide text-[color:var(--text-muted)]">ROI</p>
                      <p className={`mt-0.5 font-semibold tnum ${roiClass(u.roi)}`}>{roiText(u.roi)}</p>
                    </div>
                    <div className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-2)] p-2">
                      <p className="text-[10px] uppercase tracking-wide text-[color:var(--text-muted)]">Śr. kurs</p>
                      <p className="mt-0.5 font-semibold tnum text-[color:var(--text-secondary)]">{oddsText(u.avg_odds)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <footer className="mt-4 space-y-1 text-center text-xs text-[color:var(--text-muted)]">
              <p>Aktualizacja: <LocalDateTime iso={updated_at} /></p>
              <p>Ranking uwzględnia tylko rozliczone typy (minimum 10) zapisane przez bota Telegram.</p>
            </footer>
          </>
        )}
      </div>
    </AppShell>
  )
}
