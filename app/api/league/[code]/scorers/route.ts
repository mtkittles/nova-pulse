import { NextResponse } from "next/server"
import { getScorers } from "@/lib/league"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  try {
    const { scorers, seasonNotSeeded, season } = await getScorers(code)
    return NextResponse.json({ scorers, season_not_seeded: seasonNotSeeded, season })
  } catch {
    return NextResponse.json({ error: "Dane chwilowo niedostępne" }, { status: 502 })
  }
}
