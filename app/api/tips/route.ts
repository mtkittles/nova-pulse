import { NextResponse } from "next/server"
import { getTips } from "@/lib/tips"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/tips?date=YYYY-MM-DD — typy dla dnia (proxy do Oracle, server-side).
export async function GET(req: Request) {
  const date = new URL(req.url).searchParams.get("date") || undefined
  try {
    const data = await getTips(date)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Dane chwilowo niedostępne" }, { status: 502 })
  }
}
