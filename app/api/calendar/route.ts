import { NextResponse } from "next/server"
import { getCalendar } from "@/lib/calendar"

export const runtime = "nodejs"
// cache 5 min — fetch w getCalendar ma revalidate:300
export const revalidate = 300

// GET /api/calendar — liczniki typów per dzień (heatmapa kalendarza).
export async function GET() {
  try {
    const days = await getCalendar()
    return NextResponse.json({ days })
  } catch {
    return NextResponse.json({ days: [] }, { status: 502 })
  }
}
