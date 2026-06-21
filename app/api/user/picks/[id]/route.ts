import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { deleteUserPick } from "@/lib/picks"
import { DEMO_MODE } from "@/lib/demo-mode"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// DELETE /api/user/picks/{id} — usuwa kupon usera (tylko własny).
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Wymagane logowanie." }, { status: 401 })
  // Demo: nie usuwamy nic z Oracle (no-op).
  if (DEMO_MODE) return NextResponse.json({ ok: true, demo: true, message: "Niedostępne w trybie demo." })
  const { id } = await params
  const ok = await deleteUserPick(session.uid, id)
  return NextResponse.json({ ok }, { status: ok ? 200 : 502 })
}
