import { NextResponse } from "next/server"
import { getCalendar } from "@/lib/calendar"

export const runtime = "nodejs"
export const dynamic = "force-dynamic" // zależne od ?from=&to=

// GET /api/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD — liczniki per dzień (heatmapa + nawigacja miesięcy).
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  try {
    const days = await getCalendar(
      from && DATE_RE.test(from) ? from : undefined,
      to && DATE_RE.test(to) ? to : undefined,
    )
    return NextResponse.json({ days })
  } catch {
    return NextResponse.json({ days: [] }, { status: 502 })
  }
}
