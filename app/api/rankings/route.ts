import { NextResponse } from "next/server"
import { getMarketRankings } from "@/lib/rankings"

export const runtime = "nodejs"
// nazwy/rankingi zmieniają się rzadko — cache 5 min
export const revalidate = 300

// GET /api/rankings — rankingi drużyn wg rynków (BTTS / Over 1.5) z Oracle /rankings/markets.
export async function GET() {
  try {
    const data = await getMarketRankings()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ btts: [], over_15: [] }, { status: 502 })
  }
}
