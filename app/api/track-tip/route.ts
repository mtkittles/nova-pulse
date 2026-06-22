import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { DEMO_MODE } from "@/lib/demo-mode"
import { isOracleConfigured, oracleMutate } from "@/lib/oracle"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// POST /api/track-tip — "Śledź typ": zapisuje typ usera do Oracle.
// Sesja sprawdzana server-side; klucz Oracle nigdy nie trafia do klienta.
// Idempotentne po stronie Oracle (INSERT OR IGNORE).
export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Wymagane logowanie." }, { status: 401 })

  // Tryb demo: zero zapisu na Oracle (no-op, jak inne mutacje).
  if (DEMO_MODE) return NextResponse.json({ ok: true, demo: true, message: "Niedostępne w trybie demo." })

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Zły format." }, { status: 400 })
  }

  const event_id = body.event_id
  const bet_type = body.bet_type
  if (event_id == null || event_id === "" || !bet_type) {
    return NextResponse.json({ error: "Brak danych typu (event_id/bet_type)." }, { status: 400 })
  }

  // Podgląd bez Oracle: udajemy sukces (nie ma gdzie zapisać).
  if (!isOracleConfigured()) return NextResponse.json({ ok: true, mock: true })

  const payload = {
    event_id,
    bet_type,
    bet_side: body.bet_side ?? "",
    odds: body.odds ?? null,
    home_team: body.home_team ?? "",
    away_team: body.away_team ?? "",
    match_date: body.match_date ?? null,
    league_code: body.league_code ?? "",
  }

  try {
    await oracleMutate(`/user/${encodeURIComponent(session.uid)}/picks`, "POST", payload)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("track-tip: Oracle błąd →", err)
    return NextResponse.json({ ok: false, error: "Nie udało się zapisać typu." }, { status: 502 })
  }
}
