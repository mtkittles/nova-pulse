import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { DEMO_USER } from "@/lib/demo-mode"
import { isCommentsConfigured, reportComment } from "@/lib/comments"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// POST — zgłoszenie komentarza. `reason` opcjonalny.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "login_required", message: "Zaloguj się, żeby zgłosić komentarz." }, { status: 401 })
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

  let reason: string | undefined
  try {
    const body = (await req.json()) as { reason?: unknown }
    if (typeof body.reason === "string" && body.reason.trim()) reason = body.reason.trim().slice(0, 300)
  } catch {
    // body jest opcjonalne — brak/zły JSON nie jest błędem
  }

  try {
    const result = await reportComment(id, session, reason)
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Nie udało się zgłosić komentarza." }, { status: result.status || 502 })
    }
    return NextResponse.json(result.data ?? { ok: true })
  } catch (err) {
    console.error("comments report: błąd →", err)
    return NextResponse.json({ error: "Nie udało się zgłosić komentarza." }, { status: 502 })
  }
}
