import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { deleteUserPick } from "@/lib/picks"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// DELETE /api/user/picks/{id} — usuwa kupon usera (tylko własny).
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Wymagane logowanie." }, { status: 401 })
  const { id } = await params
  const ok = await deleteUserPick(session.uid, id)
  return NextResponse.json({ ok }, { status: ok ? 200 : 502 })
}
