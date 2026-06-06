import { NextResponse } from "next/server"
import { getScorers } from "@/lib/league"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  try {
    const data = await getScorers(code)
    return NextResponse.json({ scorers: data })
  } catch {
    return NextResponse.json({ error: "Dane chwilowo niedostępne" }, { status: 502 })
  }
}
