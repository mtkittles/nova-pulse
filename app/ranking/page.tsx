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

export default async function RankingPage() {
  const [{ users, updated_at, error }, session] = await Promise.all([getUserRankings(), getSession()])

  return (
    <AppShell loggedIn={Boolean(session)} isAdmin={session?.isAdmin}>
      <div className="mx-auto max-w-2xl">
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
            description="Typuj mecze, a Twoje wyniki pojawią się tutaj. Minimum 3 rozliczone typy, żeby wejść do rankingu."
            cta={{ label: "Zobacz dzisiejsze typy", href: "/typy" }}
          />
        ) : (
          <>
            <div className="overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--border-soft)] bg-[var(--surface-1)]">
              <table className="w-full text-sm">
                <thead className="border-b border-[color:var(--border-soft)] text-xs uppercase tracking-wide text-[color:var(--text-muted)]">
                  <tr>
                    <th className="px-3 py-2.5 text-left">#</th>
                    <th className="px-3 py-2.5 text-left">Typer</th>
                    <th className="px-3 py-2.5 text-center">Typy</th>
                    <th className="px-3 py-2.5 text-center">Trafione</th>
                    <th className="px-3 py-2.5 text-right">Skuteczność</th>
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
                      <td className="px-3 py-3 text-right">
                        <span className="font-bold tnum text-[color:var(--cyan)]">{u.win_rate}%</span>
                        <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
                          <span className="block h-full rounded-full bg-[var(--cyan)]" style={{ width: `${Math.max(0, Math.min(100, u.win_rate))}%` }} />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="mt-4 space-y-1 text-center text-xs text-[color:var(--text-muted)]">
              <p>Aktualizacja: <LocalDateTime iso={updated_at} /></p>
              <p>Ranking uwzględnia tylko rozliczone typy (minimum 3) zapisane przez bota Telegram.</p>
            </footer>
          </>
        )}
      </div>
    </AppShell>
  )
}
