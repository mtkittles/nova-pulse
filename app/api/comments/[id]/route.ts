import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { DEMO_USER } from "@/lib/demo-mode"
import { deleteComment, isCommentsConfigured } from "@/lib/comments"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// DELETE — usunięcie własnego komentarza (autor) lub dowolnego (admin).
// Które z tych dwóch to backend rozstrzyga sam po telegram_id z tokenu —
// tu tylko przekazujemy sesję, nie zgadujemy uprawnień po stronie klienta.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "login_required", message: "Zaloguj się, żeby usunąć komentarz." }, { status: 401 })
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
    const result = await deleteComment(id, session)
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Nie udało się usunąć komentarza." }, { status: result.status || 502 })
    }
    return NextResponse.json(result.data ?? { ok: true })
  } catch (err) {
    console.error("comments delete: błąd →", err)
    return NextResponse.json({ error: "Nie udało się usunąć komentarza." }, { status: 502 })
  }
}
