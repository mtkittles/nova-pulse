import { NextResponse } from "next/server"
import { getLeagueForm } from "@/lib/league"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const count = Math.min(20, Math.max(1, Number(new URL(req.url).searchParams.get("count")) || 5))
  try {
    const rows = await getLeagueForm(code, count)
    return NextResponse.json({ rows })
  } catch {
    return NextResponse.json({ rows: [] }, { status: 502 })
  }
}
