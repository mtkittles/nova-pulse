import { NextResponse } from "next/server"
import { getDates } from "@/lib/dates"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/dates — dni, dla których są typy.
export async function GET() {
  try {
    const data = await getDates()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Dane chwilowo niedostępne" }, { status: 502 })
  }
}
