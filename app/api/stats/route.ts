import { NextResponse } from "next/server"
import { getStats } from "@/lib/stats"

// GET /api/stats — proxy server-side do agregatów skuteczności bota.
// Kontrakt odpowiedzi: StatsResponse (patrz lib/stats-types.ts).
export async function GET() {
  try {
    const data = await getStats()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Nie udało się pobrać statystyk." }, { status: 502 })
  }
}
