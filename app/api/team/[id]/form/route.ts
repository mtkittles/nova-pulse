import { NextResponse } from "next/server"
import type { FormScope } from "@/lib/extra-types"
import { getTeamForm } from "@/lib/form"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/team/{id}/form?scope=all|home|away&count=5|10|15
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sp = new URL(req.url).searchParams
  const scopeRaw = sp.get("scope")
  const scope: FormScope = scopeRaw === "home" || scopeRaw === "away" ? scopeRaw : "all"
  const count = Math.min(20, Math.max(1, Number(sp.get("count")) || 5))
  try {
    const data = await getTeamForm(id, scope, count)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Dane chwilowo niedostępne" }, { status: 502 })
  }
}
