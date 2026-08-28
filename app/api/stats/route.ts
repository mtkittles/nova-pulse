import { NextResponse } from "next/server"
import { getStats } from "@/lib/stats"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/stats?period=7|30|all&include_legacy=true
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams
  const period = params.get("period") || undefined
  const includeLegacy = params.get("include_legacy") === "true"
  try {
    const data = await getStats(period, includeLegacy)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Dane chwilowo niedostępne" }, { status: 502 })
  }
}
