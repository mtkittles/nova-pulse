import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getUserPicks, saveUserPicks } from "@/lib/picks"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/user/picks — kupony zalogowanego (telegram_id z sesji).
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Wymagane logowanie." }, { status: 401 })
  const picks = await getUserPicks(session.uid)
  return NextResponse.json({ picks })
}

// POST /api/user/picks — zapisuje wybrane typy do kuponów usera.
export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Wymagane logowanie." }, { status: 401 })
  let body: { picks?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Zły format." }, { status: 400 })
  }
  const list = Array.isArray(body.picks) ? body.picks : []
  if (list.length === 0) return NextResponse.json({ error: "Brak typów." }, { status: 400 })

  const picks = (list as Record<string, unknown>[]).map((p) => ({
    event_id: (p.event_id ?? "") as string | number,
    bet_type: String(p.bet_type ?? ""),
    bet_side: String(p.bet_side ?? ""),
    odds: Number(p.odds) || 0,
    stake: Math.max(0, Number(p.stake) || 0),
  }))
  const ok = await saveUserPicks(session.uid, picks)
  return NextResponse.json({ ok }, { status: ok ? 200 : 502 })
}
