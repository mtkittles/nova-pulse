import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { DEMO_USER } from "@/lib/demo-mode"
import { createComment, isCommentsConfigured, listComments } from "@/lib/comments"
import type { MatchComment } from "@/lib/extra-types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_LIMIT = 50
const DEFAULT_LIMIT = 20
const MAX_BODY_LEN = 500

// Kształt odpowiedzi Oracle nie jest pewny w 100% (kontrakt nie precyzuje) —
// akceptujemy zarówno { comments: [...], total } jak i gołą tablicę.
function normalizeList(data: unknown): { comments: MatchComment[]; total?: number } {
  if (Array.isArray(data)) return { comments: data as MatchComment[] }
  if (data && typeof data === "object") {
    const d = data as { comments?: unknown; total?: unknown }
    if (Array.isArray(d.comments)) {
      return { comments: d.comments as MatchComment[], total: typeof d.total === "number" ? d.total : undefined }
    }
  }
  return { comments: [] }
}

// GET — lista komentarzy. X-Comment-Token dołączany OPCJONALNIE, gdy jest
// sesja — wtedy Oracle dokłada do wyniku WŁASNE hidden_auto wołającego
// (oznaczone `pending_moderation: true`). Bez sesji / z tokenem złym —
// Oracle cicho spada do listy anonimowej (bez 401 do obsłużenia tutaj).
// `is_mine` dokładamy sami, bo to porównanie telegram_id z sesją.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const url = new URL(req.url)
  const sort = url.searchParams.get("sort") === "top" ? "top" : "newest"
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(url.searchParams.get("limit")) || DEFAULT_LIMIT))
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0)

  if (!isCommentsConfigured()) {
    return NextResponse.json({ comments: [], total: 0 })
  }

  try {
    const session = await getSession()
    const result = await listComments(id, { sort, limit, offset }, session ?? undefined)
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Nie udało się pobrać komentarzy." }, { status: result.status || 502 })
    }
    const { comments, total } = normalizeList(result.data)
    const enriched = session ? comments.map((c) => ({ ...c, is_mine: String(c.telegram_id) === session.uid })) : comments
    return NextResponse.json({ comments: enriched, total })
  } catch (err) {
    console.error("comments GET: błąd →", err)
    return NextResponse.json({ error: "Nie udało się pobrać komentarzy." }, { status: 502 })
  }
}

// POST — dodanie komentarza. Wymaga sesji (lb_session) — telegram_id do
// tokenu bierzemy WYŁĄCZNIE z niej, nigdy z body żądania.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "login_required", message: "Zaloguj się, żeby komentować." }, { status: 401 })
  }

  // Konto demo (syntetyczna tożsamość, WSPÓLNA dla wszystkich odwiedzających
  // podgląd/preview) — nie wysyłamy jej do prawdziwego backendu, żeby jeden
  // tester nie mógł np. wyczerpać limitu albo dostać bana dla wszystkich
  // innych korzystających z ?demo=1. Odczyt (GET) zostaje w pełni żywy.
  if (session.uid === DEMO_USER.id) {
    return NextResponse.json(
      { error: "demo_disabled", message: "Dodawanie komentarzy jest wyłączone w trybie demonstracyjnym." },
      { status: 403 },
    )
  }

  let body: { body?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Komentarz jest pusty lub za długi." }, { status: 422 })
  }
  const text = typeof body.body === "string" ? body.body.trim() : ""
  if (!text || text.length > MAX_BODY_LEN) {
    return NextResponse.json({ error: "Komentarz jest pusty lub za długi." }, { status: 422 })
  }

  if (!isCommentsConfigured()) {
    return NextResponse.json({ error: "Funkcja komentarzy jest chwilowo niedostępna." }, { status: 503 })
  }

  try {
    const result = await createComment(id, session, text)
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Nie udało się dodać komentarza." }, { status: result.status || 502 })
    }
    return NextResponse.json(result.data, { status: 201 })
  } catch (err) {
    console.error("comments POST: błąd →", err)
    return NextResponse.json({ error: "Nie udało się dodać komentarza." }, { status: 502 })
  }
}
