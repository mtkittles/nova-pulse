import { NextResponse } from "next/server"
import { getStandingsWithMeta } from "@/lib/league"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  try {
    const { standings, leagueLogo } = await getStandingsWithMeta(code)
    return NextResponse.json({ standings, league_logo: leagueLogo })
  } catch {
    return NextResponse.json({ error: "Dane chwilowo niedostępne" }, { status: 502 })
  }
}
