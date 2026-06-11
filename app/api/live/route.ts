import { NextResponse } from "next/server"
import { isOracleConfigured, oracleFetch } from "@/lib/oracle"
import { getLeagueName } from "@/lib/leagues"

// ZAWSZE świeże — wyniki live nie mogą być cache'owane.
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function rec(x: unknown): Record<string, unknown> {
  return x && typeof x === "object" ? (x as Record<string, unknown>) : {}
}
function num(x: unknown): number {
  const n = Number(x)
  return Number.isFinite(n) ? n : 0
}

// GET /api/live — bieżące mecze na żywo z Oracle (/public-api/live).
export async function GET() {
  if (!isOracleConfigured()) {
    return NextResponse.json({ matches: [], count: 0, updated_at: null })
  }
  try {
    const data = await oracleFetch<unknown>("/live", 0)
    const r = rec(data)
    const raw = Array.isArray(r.matches) ? (r.matches as unknown[]) : []
    const matches = raw.map((m) => {
      const o = rec(m)
      const code = String(o.league_code ?? "")
      return {
        event_id: String(o.af_fixture_id ?? o.event_id ?? o.id ?? ""),
        home_team: String(o.home_team ?? o.home ?? ""),
        away_team: String(o.away_team ?? o.away ?? ""),
        home_score: num(o.home_score),
        away_score: num(o.away_score),
        ht_home_score: o.ht_home_score != null ? num(o.ht_home_score) : null,
        ht_away_score: o.ht_away_score != null ? num(o.ht_away_score) : null,
        minute: o.minute != null ? num(o.minute) : null,
        status_short: String(o.status_short ?? o.status ?? ""),
        league: String(o.league_name ?? "") || getLeagueName(code),
        league_code: code,
        kickoff_utc: o.kickoff_utc != null ? String(o.kickoff_utc) : null,
        last_live_update: o.last_live_update != null ? String(o.last_live_update) : null,
      }
    })
    return NextResponse.json({
      matches,
      count: matches.length,
      updated_at: r.updated_at != null ? String(r.updated_at) : new Date().toISOString(),
    })
  } catch (err) {
    console.error("/api/live: Oracle niedostępne →", err)
    return NextResponse.json({ matches: [], count: 0, updated_at: null }, { status: 502 })
  }
}
