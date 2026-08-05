"use client"

import Link from "next/link"
import type { Tip } from "@/lib/types"
import { getMarketLabel } from "@/lib/market-label"
import { fmtOdds } from "@/lib/format"
import { TeamBadge } from "../team-badge"

/**
 * „Ostatnio rozliczone" — proof bar.
 *
 * Czyta wyłącznie `actual_result` (0/1) z Oracle. Świadomie NIE przelicza
 * wyniku ze skoru: to sekcja dowodowa, więc pokazuje to, co bot rzeczywiście
 * zapisał, a nie to, co dałoby się wywnioskować.
 */
export function RecentSettled({ tips }: { tips: Tip[] }) {
  const settled = tips.filter((t) => t.actual_result === 0 || t.actual_result === 1)
  if (settled.length === 0) return null

  const wins = settled.filter((t) => t.actual_result === 1).length
  const rate = Math.round((wins / settled.length) * 100)

  return (
    <div className="overflow-hidden rounded-xl border border-[color:var(--border-subtle)] bg-[var(--bg-1)]">
      {/* pasek znaczników — cały wynik na jeden rzut oka. Monochromatyczny cyan:
          trafiony = pełna kropka, chybiony = pusty obrys (--border-subtle).
          Jedyny sygnał koloru na landingu poza samym --cyan zostaje wyłącznie
          w tej sekcji dowodowej (patrz komentarz przy pasku niżej). */}
      <div className="flex items-center gap-3 border-b border-[color:var(--border-subtle)] px-4 py-3 md:px-5">
        <div className="flex flex-wrap gap-1.5">
          {settled.map((t, i) => (
            <span
              key={`${t.event_id}-${i}`}
              title={t.actual_result === 1 ? "Trafiony" : "Chybiony"}
              className={
                t.actual_result === 1
                  ? "h-2.5 w-2.5 rounded-full bg-[var(--cyan)]"
                  : "h-2.5 w-2.5 rounded-full border border-[color:var(--border-subtle)]"
              }
            />
          ))}
        </div>
        <p className="ml-auto shrink-0 text-sm text-[color:var(--text-secondary)]">
          <span className="tnum font-semibold text-[color:var(--text-primary)]">
            {wins}/{settled.length}
          </span>{" "}
          <span className="tnum">({rate}%)</span>
        </p>
      </div>

      <ul className="divide-y divide-[color:var(--border-subtle)]">
        {settled.slice(0, 6).map((t, i) => {
          const m = getMarketLabel(
            t.bet_type_raw ?? t.bet_type,
            t.bet_side_raw ?? t.bet_side,
            t.home,
            t.away,
          )
          const won = t.actual_result === 1
          // Sygnał trafienia bez zielonego/czerwonego: pasek i etykieta różnią
          // się INTENSYWNOŚCIĄ cyjanu (jasny = trafiony, przygaszony = chybiony),
          // nie barwą — spójne z gradacją opacity w histogramie Q-Score.
          const row = (
            <div className="flex items-center gap-3 px-4 py-3 md:px-5">
              <span
                className={`h-8 w-1 shrink-0 rounded-full bg-[var(--cyan)] ${won ? "" : "opacity-25"}`}
              />
              <span className="flex shrink-0 -space-x-1.5">
                <TeamBadge teamName={t.home} logoUrl={t.homeLogo} size="sm" />
                <TeamBadge teamName={t.away} logoUrl={t.awayLogo} size="sm" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {t.home} — {t.away}
                </span>
                <span className="block truncate text-xs text-[color:var(--text-muted)]">{m.full}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block tnum text-sm font-semibold text-[color:var(--cyan)]">
                  {fmtOdds(t.odds)}
                </span>
                <span
                  className={`block text-[11px] font-semibold ${
                    won ? "text-[color:var(--cyan)]" : "text-[color:var(--text-muted)]"
                  }`}
                >
                  {won ? "trafiony" : "chybiony"}
                </span>
              </span>
            </div>
          )

          return (
            <li key={`${t.event_id}-${i}`}>
              {t.isOrphan || !t.event_id ? (
                row
              ) : (
                <Link
                  href={`/mecz/${t.event_id}`}
                  className="block transition-colors duration-150 hover:bg-white/[0.03]"
                >
                  {row}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
