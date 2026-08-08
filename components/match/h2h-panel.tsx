import type { H2HMatch } from "@/lib/extra-types"

function fmtDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" })
}

function parseScore(score: string): [number, number] | null {
  const m = score.match(/(\d+)\s*[:\-]\s*(\d+)/)
  return m ? [Number(m[1]), Number(m[2])] : null
}

type RowResult = "home-win" | "away-win" | "draw"

// Czy drużyna `name` wygrała TO konkretne historyczne starcie (niezależnie
// od tego, po której stronie boiska grała wtedy) — ta sama logika co
// h2hSummaryFrom w lib/oracle-map.ts, tylko per-wiersz zamiast zbiorczo.
function resultFor(m: H2HMatch, currentHomeTeam: string): RowResult {
  const parsed = parseScore(m.score)
  if (!parsed) return "draw"
  const [hs, as] = parsed
  if (hs === as) return "draw"
  const homeWonFixture = hs > as
  const currentHomeWasHomeThen = m.home.toLowerCase() === currentHomeTeam.toLowerCase()
  const currentHomeWonThen = (homeWonFixture && currentHomeWasHomeThen) || (!homeWonFixture && !currentHomeWasHomeThen)
  return currentHomeWonThen ? "home-win" : "away-win"
}

/**
 * H2H — kompaktowa lista (nie karty): data | gospodarz wynik gość. Kolor
 * zależy od tego, kto WYGRAŁ tamto starcie względem obecnego gospodarza:
 * cyan = wygrał obecny gospodarz (niezależnie, po której stronie grał
 * wtedy), szary = pozostałe (remis lub wygrał obecny gość).
 */
export function H2HPanel({ matches, homeTeam }: { matches: H2HMatch[]; homeTeam: string }) {
  if (matches.length === 0) {
    return (
      <div className="grid h-24 place-items-center rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-1)] text-sm text-[color:var(--text-muted)]">
        Brak historii bezpośrednich starć
      </div>
    )
  }

  let w = 0
  let d = 0
  let l = 0
  for (const m of matches) {
    const r = resultFor(m, homeTeam)
    if (r === "home-win") w++
    else if (r === "draw") d++
    else l++
  }

  return (
    <div className="glass-solid rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-1)] p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
          Bezpośrednie starcia
        </h2>
        <p className="shrink-0 text-xs text-[color:var(--text-secondary)] tnum">
          W ostatnich {matches.length}:{" "}
          <span className="font-semibold text-[color:var(--text-primary)]">
            {w}W-{d}R-{l}P
          </span>
        </p>
      </div>

      <ul className="space-y-1">
        {matches.map((m, i) => {
          const r = resultFor(m, homeTeam)
          const strong = r === "home-win"
          return (
            <li
              key={i}
              className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm"
            >
              <span className="w-20 shrink-0 text-xs text-[color:var(--text-muted)] tnum">{fmtDate(m.date)}</span>
              <span className={`min-w-0 flex-1 truncate text-right ${strong && m.home.toLowerCase() === homeTeam.toLowerCase() ? "font-semibold text-[color:var(--cyan)]" : "text-[color:var(--text-secondary)]"}`}>
                {m.home}
              </span>
              <span className={`shrink-0 tnum font-semibold ${strong ? "text-[color:var(--cyan)]" : "text-[color:var(--text-muted)]"}`}>
                {m.score}
              </span>
              <span className={`min-w-0 flex-1 truncate ${strong && m.away.toLowerCase() === homeTeam.toLowerCase() ? "font-semibold text-[color:var(--cyan)]" : "text-[color:var(--text-secondary)]"}`}>
                {m.away}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
