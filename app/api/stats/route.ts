import { NextResponse } from "next/server"
import { getStats } from "@/lib/stats"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/stats?period=7|30|all
export async function GET(req: Request) {
  const period = new URL(req.url).searchParams.get("period") || undefined
  try {
    const data = await getStats(period)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Dane chwilowo niedostępne" }, { status: 502 })
  }
}
