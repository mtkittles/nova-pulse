import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { DEMO_USER } from "@/lib/demo-mode"
import { isCommentsConfigured, likeComment } from "@/lib/comments"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// POST — polubienie/cofnięcie (toggle) komentarza.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "login_required", message: "Zaloguj się, żeby polubić komentarz." }, { status: 401 })
  }
  if (session.uid === DEMO_USER.id) {
    return NextResponse.json(
      { error: "demo_disabled", message: "Niedostępne w trybie demonstracyjnym." },
      { status: 403 },
    )
  }
  if (!isCommentsConfigured()) {
    return NextResponse.json({ error: "Funkcja komentarzy jest chwilowo niedostępna." }, { status: 503 })
  }

  try {
    const result = await likeComment(id, session)
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Nie udało się polubić komentarza." }, { status: result.status || 502 })
    }
    return NextResponse.json(result.data ?? { ok: true })
  } catch (err) {
    console.error("comments like: błąd →", err)
    return NextResponse.json({ error: "Nie udało się polubić komentarza." }, { status: 502 })
  }
}
