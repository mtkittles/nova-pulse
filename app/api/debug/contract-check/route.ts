import { NextResponse } from "next/server"
import { isOracleConfigured, oracleFetch } from "@/lib/oracle"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// TYMCZASOWY endpoint diagnostyczny — do usunięcia w tym samym commicie co
// dopięcie frontu do odds/form-flags/season_not_seeded (raporty/PODLACZENIE_odds_form_scorers.md).
// Zwraca SUROWE odpowiedzi Oracle (bez adaptera) dla trzech endpointów,
// żeby zweryfikować realny kształt JSON przed pisaniem kodu — nie zgadywać
// na podstawie samego raportu (lekcja z adaptMatchDetailed() z poprzedniej
// sesji). Klucz API zostaje server-side (oracleFetch) — nic tajnego w body.
//
// GET /api/debug/contract-check?event_id=af_1490402&team_id=8193&league_code=MLS
export async function GET(req: Request) {
  if (!isOracleConfigured()) {
    return NextResponse.json({ error: "Oracle nie skonfigurowane w tym środowisku." }, { status: 500 })
  }
  const sp = new URL(req.url).searchParams
  const eventId = sp.get("event_id")
  const teamId = sp.get("team_id")
  const leagueCode = sp.get("league_code")

  const out: Record<string, unknown> = {}

  if (eventId) {
    try {
      out.match_detailed = await oracleFetch<unknown>(`/match/${encodeURIComponent(eventId)}/detailed`)
    } catch (e) {
      out.match_detailed_error = e instanceof Error ? e.message : String(e)
    }
  }
  if (teamId) {
    try {
      out.team_form = await oracleFetch<unknown>(`/team/${encodeURIComponent(teamId)}/form?scope=all&count=10`)
    } catch (e) {
      out.team_form_error = e instanceof Error ? e.message : String(e)
    }
  }
  if (leagueCode) {
    try {
      out.league_scorers = await oracleFetch<unknown>(`/league/${encodeURIComponent(leagueCode)}/scorers`)
    } catch (e) {
      out.league_scorers_error = e instanceof Error ? e.message : String(e)
    }
  }

  return NextResponse.json(out)
}
