import { NextResponse } from "next/server"
import { getTodayTips } from "@/lib/tips"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/tips/today
// Proxy server-side do danych bota. Klucz API / adres Oracle pozostają na serwerze.
// Kontrakt odpowiedzi: patrz PLAN.md (TipsResponse).
export async function GET() {
  try {
    const data = await getTodayTips()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Nie udało się pobrać typów." }, { status: 502 })
  }
}
